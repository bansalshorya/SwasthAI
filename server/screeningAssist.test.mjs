import assert from "node:assert/strict";
import test from "node:test";
import { checkPhoto, suggestFollowUps } from "./screeningAssist.mjs";
import { analyzeScreening, ScreeningError, validateScreening } from "./openaiScreening.mjs";
import { compareScreenings } from "../src/services/progress.js";

const config = { provider: "groq", apiKey: "test-key", model: "test-model" };

test("AI selects valid contextual follow-up questions and ignores duplicate or unknown IDs", async () => {
  const output = await suggestFollowUps({ symptoms: "Itchy skin rash after a new soap", language: "en" }, {
    ...config,
    fetchImpl: async (_url, request) => {
      const body = JSON.parse(request.body);
      assert.match(body.messages[1].content[0].text, /new soap/);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ ids: ["newExposure", "spreading", "newExposure", "invented"] }) } }] });
    },
  });
  assert.deepEqual(output.ids, ["newExposure", "spreading"]);
});

test("photo precheck sends the image and rejects unsupported uploads", async () => {
  const image = `data:image/png;base64,${Buffer.from("image").toString("base64")}`;
  const output = await checkPhoto({ symptoms: "Rash on arm", language: "en", image }, {
    ...config,
    fetchImpl: async (_url, request) => {
      const body = JSON.parse(request.body);
      assert.equal(body.messages[1].content[1].image_url.url, image);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ status: "mismatch", explanation: "This is a screenshot, not an arm." }) } }] });
    },
  });
  assert.equal(output.status, "mismatch");
  await assert.rejects(checkPhoto({ symptoms: "Rash", image: "data:image/svg+xml;base64,abcd" }, config),
    (error) => error instanceof ScreeningError && error.code === "INVALID_SCREENING");
});

test("caregiver, medicine, allergy, and adaptive answers reach the screening prompt", async () => {
  const screening = validateScreening({
    language: "en", symptoms: "My child has an itchy rash", images: [],
    answers: { duration: "today", severity: "mild", progression: "stable", ageGroup: "child" },
    context: { subjectRelation: "child", medications: "Existing medicine", allergies: "Peanuts" },
    followUps: { spreading: "yes", newExposure: "unsure" },
  });
  assert.equal(screening.context.subjectRelation, "child");
  let called = false;
  await analyzeScreening(screening, {
    ...config,
    fetchImpl: async (_url, request) => {
      called = true;
      const text = JSON.parse(request.body).messages[1].content[0].text;
      assert.match(text, /Existing medicine/);
      assert.match(text, /Peanuts/);
      assert.match(text, /Is the affected area spreading\?: yes/);
      return Response.json({ choices: [{ message: { content: JSON.stringify({ imageConsistency: { status: "not_provided" }, evidence: [] }) } }] });
    },
  });
  assert.equal(called, true);
});

test("breathing difficulty follow-up triggers emergency safety routing without model call", async () => {
  const output = await analyzeScreening({ symptoms: "I have a cough", language: "en", images: [], answers: {}, followUps: { breathing: "yes" } }, {
    ...config, fetchImpl: () => { throw new Error("model should not be called"); },
  });
  assert.equal(output.result.riskLevel, "emergency");
});

test("progress is based on user-reported severity and progression", () => {
  const previous = { inspection: { answers: { severity: "moderate" } } };
  const current = { inspection: { answers: { severity: "mild", progression: "stable" } } };
  assert.equal(compareScreenings(previous, current).change, "better");
});
