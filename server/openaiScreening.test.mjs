import assert from "node:assert/strict";
import test from "node:test";
import {
  analyzeScreening,
  buildProviderRequest,
  resolveAIProvider,
  ScreeningError,
  validateScreening,
} from "./openaiScreening.mjs";

const SAMPLE_IMAGE = `data:image/webp;base64,${Buffer.from("image-bytes").toString("base64")}`;

function screening(overrides = {}) {
  return {
    language: "en",
    symptoms: "Itchy red rash on my forearm for two days",
    answers: {
      duration: "one_to_three_days",
      severity: "mild",
      progression: "stable",
      ageGroup: "adult",
    },
    images: [],
    ...overrides,
  };
}

function validResult() {
  return {
    isTargetValid: true,
    riskLevel: "low",
    confidence: "medium",
    summary: "The report may fit a minor skin irritation, but this is not a diagnosis.",
    possibleConditions: [{
      name: "Contact dermatitis",
      confidence: "medium",
      reason: "The visible redness and itching can fit irritation.",
      commonSymptoms: ["Itching", "Redness"],
    }],
    evidence: ["Itchy red rash reported for two days"],
    imageAssessment: "No photo was available for visual review.",
    imageConsistency: {
      status: "not_provided",
      explanation: "No photo was supplied; the result is based only on the reported symptoms and answers.",
      recommendedAction: "If the concern is clearly visible, you may start a new screening with a relevant photo.",
    },
    homeCare: ["Avoid new skin products and monitor the area."],
    dietPlan: { eat: ["Normal balanced meals"], avoid: ["No specific restriction"] },
    monitorSymptoms: ["Spreading redness"],
    redFlags: ["Breathing difficulty or facial swelling"],
    doctorRecommendation: { specialist: "Primary-care clinician", timeframe: "If worsening or not improving" },
    disclaimer: "AI-assisted screening, not a diagnosis.",
  };
}

function screeningWithImages() {
  return validateScreening(screening({
    images: [
      { stepId: "symptom_overview", role: "untrusted role", label: "Untrusted label", dataUrl: SAMPLE_IMAGE },
      { stepId: "symptom_closeup", role: "untrusted role", label: "Untrusted label", dataUrl: SAMPLE_IMAGE },
    ],
  }));
}

test("validates and limits the browser screening payload", () => {
  const result = validateScreening(screening({
    language: "unexpected",
    answers: { duration: " one_to_three_days ", ignored: "do not forward" },
  }));

  assert.equal(result.language, "en");
  assert.equal(result.answers.duration, "one_to_three_days");
  assert.equal(result.answers.ignored, undefined);
  assert.deepEqual(Object.keys(result.answers), ["duration", "severity", "progression", "ageGroup"]);
});

test("rejects unsupported image types", () => {
  assert.throws(
    () => validateScreening(screening({
      images: [{ stepId: "symptom_overview", dataUrl: "data:image/svg+xml;base64,PHN2Zz4=" }],
    })),
    (error) => error instanceof ScreeningError && error.code === "INVALID_SCREENING",
  );
});

test("rejects answer values outside the shared domain configuration", () => {
  assert.throws(
    () => validateScreening(screening({ answers: { duration: "invented-duration" } })),
    (error) => error instanceof ScreeningError && error.code === "INVALID_SCREENING",
  );
});

test("resolves the Groq provider defaults", () => {
  const provider = resolveAIProvider({ provider: "groq", apiKey: "test-key" });

  assert.equal(provider.id, "groq");
  assert.equal(provider.baseUrl, "https://api.groq.com/openai/v1");
  assert.equal(provider.apiStyle, "chat-completions");
  assert.equal(provider.model, "qwen/qwen3.8-27b");
});

test("supports a custom OpenAI-compatible provider", () => {
  const provider = resolveAIProvider({
    provider: "compatible",
    apiKey: "test-key",
    baseUrl: "https://example.ai/v1/",
    model: "vision-model",
    apiStyle: "chat-completions",
  });

  assert.equal(provider.id, "compatible");
  assert.equal(provider.baseUrl, "https://example.ai/v1");
  assert.equal(provider.model, "vision-model");
});

test("builds a strict multimodal Groq chat-completions request", () => {
  const provider = resolveAIProvider({ provider: "groq", apiKey: "test-key", model: "test-model" });
  const request = buildProviderRequest(screeningWithImages(), provider);

  assert.equal(request.model, "test-model");
  assert.equal(request.store, undefined);
  assert.equal(request.response_format.type, "json_schema");
  assert.equal(request.response_format.json_schema.strict, true);
  assert.ok(request.response_format.json_schema.schema.required.includes("imageConsistency"));
  assert.match(request.messages[0].content, /imageConsistency\.status/);
  assert.match(request.messages[0].content, /mismatch/);
  assert.match(request.messages[1].content[0].text, /role=visible_symptom_overview/);
  assert.deepEqual(
    request.messages[1].content.map((item) => item.type),
    ["text", "image_url", "image_url"],
  );
});

test("builds a private structured OpenAI Responses request", () => {
  const provider = resolveAIProvider({ provider: "openai", apiKey: "test-key", model: "test-model" });
  const request = buildProviderRequest(screeningWithImages(), provider);

  assert.equal(request.model, "test-model");
  assert.equal(request.store, false);
  assert.equal(request.text.format.type, "json_schema");
  assert.equal(request.text.format.strict, true);
  assert.deepEqual(
    request.input[0].content.map((item) => item.type),
    ["input_text", "input_image", "input_image"],
  );
});

test("emergency phrases bypass the model even when no API key is configured", async () => {
  let fetchCalled = false;
  const output = await analyzeScreening(screening({ symptoms: "I have chest pain and cannot breathe" }), {
    provider: "groq",
    apiKey: "",
    fetchImpl: async () => {
      fetchCalled = true;
      throw new Error("should not be called");
    },
  });

  assert.equal(fetchCalled, false);
  assert.equal(output.model, "deterministic-safety-rule");
  assert.equal(output.result.riskLevel, "emergency");
  assert.equal(output.result.imageConsistency.status, "not_provided");
});

test("emergency routing marks supplied images as not evaluated", async () => {
  const output = await analyzeScreening(screening({
    symptoms: "I have chest pain and cannot breathe",
    images: [{ stepId: "symptom_overview", dataUrl: SAMPLE_IMAGE }],
  }), {
    provider: "groq",
    apiKey: "",
    fetchImpl: async () => {
      throw new Error("should not be called");
    },
  });

  assert.equal(output.result.imageConsistency.status, "not_evaluated");
  assert.match(output.result.imageConsistency.recommendedAction, /emergency help/i);
});

test("requires the API key on the server for ordinary screening", async () => {
  await assert.rejects(
    analyzeScreening(screening(), { provider: "groq", apiKey: "" }),
    (error) => error instanceof ScreeningError && error.code === "AI_NOT_CONFIGURED" && error.status === 503,
  );
});

test("parses a structured Groq chat-completions response", async () => {
  const expected = validResult();
  const output = await analyzeScreening(screening(), {
    provider: "groq",
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (url, request) => {
      assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
      assert.equal(request.headers.Authorization, "Bearer test-key");
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            choices: [{ finish_reason: "stop", message: { content: JSON.stringify(expected) } }],
          };
        },
      };
    },
  });

  assert.equal(output.provider, "groq");
  assert.equal(output.model, "test-model");
  assert.deepEqual(output.result, expected);
});

test("mismatched images are excluded from evidence and lower confidence", async () => {
  const expected = {
    ...validResult(),
    confidence: "high",
    evidence: [
      "Reported itchy rash for two days",
      "Image note: the uploaded screenshot does not show a forearm rash",
    ],
    imageAssessment: "mismatch",
    imageConsistency: {
      status: "mismatch",
      explanation: "The photo is a screenshot and does not show the described forearm rash.",
      recommendedAction: "Upload a clear photo of the affected forearm.",
    },
  };
  const output = await analyzeScreening(screening({
    images: [{ stepId: "symptom_overview", dataUrl: SAMPLE_IMAGE }],
  }), {
    provider: "groq",
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      async json() {
        return {
          choices: [{ finish_reason: "stop", message: { content: JSON.stringify(expected) } }],
        };
      },
    }),
  });

  assert.equal(output.result.imageConsistency.status, "mismatch");
  assert.equal(output.result.confidence, "low");
  assert.deepEqual(output.result.evidence, ["Reported itchy rash for two days"]);
  assert.equal(output.result.imageAssessment, output.result.imageConsistency.explanation);
});

test("parses a structured OpenAI Responses response", async () => {
  const expected = validResult();
  const output = await analyzeScreening(screening(), {
    provider: "openai",
    apiKey: "test-key",
    model: "test-model",
    fetchImpl: async (url) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      return {
        ok: true,
        status: 200,
        async json() {
          return {
            status: "completed",
            output: [{ content: [{ type: "output_text", text: JSON.stringify(expected) }] }],
          };
        },
      };
    },
  });

  assert.equal(output.provider, "openai");
  assert.deepEqual(output.result, expected);
});
