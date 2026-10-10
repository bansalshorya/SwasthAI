import assert from "node:assert/strict";
import test from "node:test";
import { translateReport, translationProviderOptions } from "./reportTranslation.mjs";
import { ScreeningError } from "./openaiScreening.mjs";
import { applyReportTranslations, reportTextEntries, requestReportTranslation, validateReportTranslations } from "../src/services/resultTranslation.js";
import { hydrateSession } from "../src/services/aiSkillEngine.js";
import translateApi from "../api/translate-report.mjs";

const config = { provider: "groq", apiKey: "test-key", model: "test-model" };

test("translation can use a separate server-side provider and key", () => {
  const screening = { provider: "groq", apiKey: "screening-key", model: "screening-model" };
  assert.equal(translationProviderOptions(screening, {}), screening);
  const translation = translationProviderOptions(screening, {
    TRANSLATION_PROVIDER: "openai",
    TRANSLATION_API_KEY: "translation-key",
    TRANSLATION_MODEL: "translation-model",
  });
  assert.equal(translation.provider, "openai");
  assert.equal(translation.apiKey, "translation-key");
  assert.equal(translation.model, "translation-model");
  assert.equal(screening.apiKey, "screening-key");
  assert.equal(translationProviderOptions(screening, { TRANSLATION_PROVIDER: "groq" }).apiKey, "");
});

test("report translation keeps medical risk and status fields unchanged", async () => {
  const source = {
    language: "en",
    inspection: { answers: { symptoms: "Rash for 24 hours" } },
    result: {
      summary: "Seek care in 24 hours.", riskLevel: "high",
      possibleConditions: [{ name: "Rash", confidence: "low", reason: "May be irritation.", commonSymptoms: ["Itching"] }],
      imageConsistency: { status: "mismatch", explanation: "The photo does not match." },
      redFlags: ["Call for help if breathing becomes difficult."],
      doctorRecommendation: { specialist: "A clinician", timeframe: "Within 24 hours" },
    },
  };
  const entries = reportTextEntries(source);
  const translatedItems = entries.map(({ id, text }) => ({ id, text: `हिंदी: ${text}` }));
  const response = await translateReport({ sourceLanguage: "en", targetLanguage: "hi", items: entries }, {
    ...config,
    fetchImpl: async (_url, request) => {
      const body = JSON.parse(request.body);
      assert.equal(body.response_format.type, "json_schema");
      assert.match(body.messages[0].content, /Preserve uncertainty, negation, urgency/);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ items: translatedItems }) } }] });
    },
  });
  const map = validateReportTranslations(entries, response.items);
  const display = applyReportTranslations(source, map, "hi");
  assert.equal(display.language, "hi");
  assert.equal(display.result.summary, "हिंदी: Seek care in 24 hours.");
  assert.equal(display.inspection.answers.symptoms, "हिंदी: Rash for 24 hours");
  assert.equal(display.result.riskLevel, "high");
  assert.equal(display.result.imageConsistency.status, "mismatch");
  assert.equal(display.result.possibleConditions[0].confidence, "low");
  assert.equal(source.result.summary, "Seek care in 24 hours.");
});

test("NVIDIA translates a complete report using the screening key", async () => {
  const items = [{ id: "summary", text: "Seek help in 24 hours." }];
  const response = await translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, {
    provider: "nvidia", apiKey: "test-key",
    fetchImpl: async (url, request) => {
      assert.equal(url, "https://integrate.api.nvidia.com/v1/chat/completions");
      const body = JSON.parse(request.body);
      assert.equal(body.max_tokens, 8_000);
      assert.equal(body.response_format.type, "json_schema");
      assert.equal(body.chat_template_kwargs.clear_thinking, true);
      assert.equal(body.reasoning_effort, "low");
      return Response.json({ choices: [{ message: { content: JSON.stringify({ items: [{ id: "summary", text: "24 घंटे में मदद लें।" }] }) } }] });
    },
  });
  assert.equal(response.items[0].text, "24 घंटे में मदद लें।");
});

test("report translation rejects missing items or changed numbers", async () => {
  const items = [{ id: "summary", text: "Seek help in 24 hours." }];
  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, {
    ...config,
    fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify({ items: [] }) } }] }),
  }), (error) => error instanceof ScreeningError && error.code === "AI_TRANSLATION_INCOMPLETE");

  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, {
    ...config,
    fetchImpl: async () => Response.json({ choices: [{ message: { content: JSON.stringify({ items: [{ id: "summary", text: "24 की जगह 48 घंटे में सहायता लें।" }] }) } }] }),
  }), (error) => error instanceof ScreeningError && error.code === "AI_TRANSLATION_NUMBER_MISMATCH");
});

test("rate limits preserve the provider retry delay without leaking report text", async () => {
  const items = [{ id: "summary", text: "Seek help in 24 hours." }];
  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, {
    ...config,
    fetchImpl: async (_url, request) => {
      assert.equal(JSON.parse(request.body).max_completion_tokens, 3_500);
      return Response.json({ error: { message: "Private provider details" } }, {
        status: 429, headers: { "retry-after": "37" },
      });
    },
  }), (error) => error instanceof ScreeningError && error.code === "AI_RATE_LIMITED"
    && error.status === 429 && error.retryAfterSeconds === 37
    && !error.message.includes("Private provider details"));
});

test("provider request rejection is distinguished from rate limiting", async () => {
  const items = [{ id: "summary", text: "Seek help." }];
  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, {
    ...config, fetchImpl: async () => Response.json({ error: { message: "Invalid schema" } }, { status: 400 }),
  }), (error) => error instanceof ScreeningError && error.code === "AI_PROVIDER_REJECTED" && error.providerStatus === 400);
});

test("a short rate limit is retried once, then the translated report is returned", async () => {
  const entries = [{ id: "summary", text: "Seek help in 24 hours." }];
  const delays = [];
  let calls = 0;
  const translated = await requestReportTranslation(entries, "en", "hi", {
    fetchImpl: async () => {
      calls++;
      return calls === 1
        ? Response.json({ error: { code: "AI_RATE_LIMITED", retryAfterSeconds: 5 } }, { status: 429 })
        : Response.json({ items: [{ id: "summary", text: "24 घंटे में सहायता लें।" }] });
    },
    sleepImpl: async (ms) => { delays.push(ms); },
  });
  assert.equal(calls, 2);
  assert.deepEqual(delays, [5000]);
  assert.equal(translated.summary, "24 घंटे में सहायता लें।");
});

test("a long rate limit does not trigger repeated provider requests", async () => {
  let calls = 0;
  await assert.rejects(requestReportTranslation([{ id: "summary", text: "Seek help." }], "en", "hi", {
    fetchImpl: async () => {
      calls++;
      return Response.json({ error: { code: "AI_RATE_LIMITED", retryAfterSeconds: 60 } }, { status: 429 });
    },
    sleepImpl: async () => { throw new Error("Should not wait"); },
  }), (error) => error.code === "AI_RATE_LIMITED" && error.retryAfterSeconds === 60);
  assert.equal(calls, 1);
});

test("report translation rejects duplicate IDs and invalid language switches", async () => {
  const items = [{ id: "summary", text: "A result" }, { id: "summary", text: "Another result" }];
  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "hi", items }, config),
    (error) => error instanceof ScreeningError && error.code === "INVALID_TRANSLATION");
  await assert.rejects(translateReport({ sourceLanguage: "en", targetLanguage: "en", items: items.slice(0, 1) }, config),
    (error) => error instanceof ScreeningError && error.code === "INVALID_TRANSLATION");
});

test("prototype reports rebuild locally in the selected language", () => {
  const source = hydrateSession({
    language: "en",
    inspection: { answers: { symptoms: "Itchy rash", severity: "mild" }, images: [] },
    result: { prototype: true },
  }, "en");
  const hindi = hydrateSession(source, "hi");
  assert.equal(source.result.prototype, true);
  assert.equal(hindi.result.prototype, true);
  assert.equal(hindi.result.riskLevel, source.result.riskLevel);
  assert.notEqual(hindi.result.summary, source.result.summary);
  assert.match(hindi.result.summary, /आपके उत्तर/);
});

test("Vercel translation endpoint rejects wrong method and malformed JSON", async () => {
  const wrongMethod = await translateApi.fetch(new Request("http://localhost/api/translate-report", { method: "GET" }));
  assert.equal(wrongMethod.status, 405);
  const malformed = await translateApi.fetch(new Request("http://localhost/api/translate-report", {
    method: "POST", body: "{not-json", headers: { "Content-Type": "application/json" },
  }));
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "INVALID_JSON");
});
