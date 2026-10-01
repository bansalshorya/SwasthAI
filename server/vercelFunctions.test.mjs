import assert from "node:assert/strict";
import test from "node:test";
import analyzeFunction from "../api/analyze.mjs";
import healthFunction from "../api/health.mjs";

function request(path, options = {}) {
  return new Request(`https://swasthai.example${path}`, options);
}

test("Vercel health function exposes configuration state without secrets", async () => {
  const response = await healthFunction.fetch(request("/api/health"));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
  assert.equal(body.provider, "groq");
  assert.equal(body.model, "qwen/qwen3.8-27b");
  assert.equal(Object.hasOwn(body, "apiKey"), false);
});

test("Vercel analyze function rejects unsupported methods", async () => {
  const response = await analyzeFunction.fetch(request("/api/analyze"));
  const body = await response.json();

  assert.equal(response.status, 405);
  assert.equal(body.error.code, "METHOD_NOT_ALLOWED");
});

test("Vercel analyze function reports malformed JSON", async () => {
  const response = await analyzeFunction.fetch(request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "not-json",
  }));
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_JSON");
});

test("Vercel analyze function preserves the deterministic emergency route", async () => {
  const response = await analyzeFunction.fetch(request("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      screening: {
        language: "en",
        symptoms: "I have severe chest pain and cannot breathe",
        answers: {
          duration: "today",
          severity: "severe",
          progression: "worsening",
          ageGroup: "adult",
        },
        images: [],
      },
    }),
  }));
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.model, "deterministic-safety-rule");
  assert.equal(body.result.riskLevel, "emergency");
});
