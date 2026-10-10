import assert from "node:assert/strict";
import test from "node:test";
import { searchCareResources, validateCareSearch } from "./careResources.mjs";
import { ScreeningError } from "./openaiScreening.mjs";
import careApi from "../api/care-resources.mjs";

test("care search sends only selected location and care category to TinyFish", async () => {
  let calls = 0;
  const result = await searchCareResources({ location: " New Delhi ", careType: "clinic", language: "en" }, {
    apiKey: "test-tinyfish-key",
    fetchImpl: async (url, request) => {
      calls++;
      assert.equal(url.origin, "https://api.search.tinyfish.ai");
      assert.equal(url.searchParams.get("location"), "IN");
      assert.equal(url.searchParams.get("language"), "en");
      assert.equal(url.searchParams.get("query"), "general physician clinic New Delhi India");
      assert.equal(request.headers["X-API-Key"], "test-tinyfish-key");
      assert.equal(request.body, undefined);
      return Response.json({ results: [
        { title: " City Clinic ", url: "https://example.org/clinic", site_name: "example.org", snippet: "Public listing" },
        { title: "Duplicate", url: "https://example.org/clinic" },
        { title: "Unsafe", url: "javascript:alert(1)" },
        { title: "Another hospital", url: "http://example.org/hospital" },
      ] });
    },
  });
  assert.equal(calls, 1);
  assert.deepEqual(result.results, [{
    title: "City Clinic", url: "https://example.org/clinic", siteName: "example.org", snippet: "Public listing",
  }]);
});

test("care search accepts Hindi cities and six-digit PIN codes, but no screening fields", () => {
  assert.equal(validateCareSearch({ location: "नई दिल्ली", careType: "hospital", language: "hi" }).location, "नई दिल्ली");
  assert.equal(validateCareSearch({ location: "110001", careType: "clinic", language: "en" }).location, "110001");
  for (const raw of [
    { location: "11001", careType: "hospital", language: "en" },
    { location: "Delhi", careType: "cardiologist", language: "en" },
    { location: "Delhi", careType: "hospital", language: "en", symptoms: "rash" },
    { location: "Delhi", careType: "hospital", language: "fr" },
  ]) {
    assert.throws(() => validateCareSearch(raw), (error) => error instanceof ScreeningError && error.code === "INVALID_CARE_SEARCH");
  }
});

test("care search reports missing or rejected keys without returning provider details", async () => {
  const request = { location: "Delhi", careType: "hospital", language: "en" };
  await assert.rejects(searchCareResources(request, { apiKey: "" }),
    (error) => error.code === "CARE_SEARCH_NOT_CONFIGURED");
  await assert.rejects(searchCareResources(request, {
    apiKey: "bad-key",
    fetchImpl: async () => Response.json({ message: "Private provider details" }, { status: 401 }),
  }), (error) => error.code === "CARE_SEARCH_INVALID_KEY" && !error.message.includes("Private provider details"));
});

test("Vercel care search endpoint rejects wrong methods and malformed JSON", async () => {
  const wrongMethod = await careApi.fetch(new Request("https://swasthai.example/api/care-resources"));
  assert.equal(wrongMethod.status, 405);
  const malformed = await careApi.fetch(new Request("https://swasthai.example/api/care-resources", {
    method: "POST", body: "{broken",
  }));
  assert.equal(malformed.status, 400);
  assert.equal((await malformed.json()).error.code, "INVALID_JSON");
});
