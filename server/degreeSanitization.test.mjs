import assert from "node:assert/strict";
import test from "node:test";
import { sanitizeDegreeSymbols, localizeMedicalText } from "../src/services/medicalTranslation.js";

test("sanitizeDegreeSymbols cleans corrupted degree mojibake and encoding variants", () => {
  assert.equal(
    sanitizeDegreeSymbols("High fever over 103Â°F (39.4Â°C) not responding to medication"),
    "High fever over 103°F (39.4°C) not responding to medication"
  );
  assert.equal(
    sanitizeDegreeSymbols("High fever over 103â°F"),
    "High fever over 103°F"
  );
  assert.equal(
    sanitizeDegreeSymbols("Fever above 102 &deg;F"),
    "Fever above 102°F"
  );
  assert.equal(
    sanitizeDegreeSymbols("Fever above 102&#176;F"),
    "Fever above 102°F"
  );
  assert.equal(
    sanitizeDegreeSymbols("103Â°F से अधिक तेज़ बुखार"),
    "103°F से अधिक तेज़ बुखार"
  );
  assert.equal(
    sanitizeDegreeSymbols("103°F से अधिक तेज़ बुखार"),
    "103°F से अधिक तेज़ बुखार"
  );
  assert.equal(
    sanitizeDegreeSymbols("High fever 103 \uFFFD F"),
    "High fever 103°F"
  );
  assert.equal(
    sanitizeDegreeSymbols("Temperature above 38.5 \uFFFD C"),
    "Temperature above 38.5°C"
  );
  assert.equal(
    sanitizeDegreeSymbols("High fever 103&amp;deg;F"),
    "High fever 103°F"
  );
  assert.equal(
    sanitizeDegreeSymbols("High fever 103\u2109 (39.4\u2103)"),
    "High fever 103°F (39.4°C)"
  );
  assert.equal(
    sanitizeDegreeSymbols("High fever 103ºF"),
    "High fever 103°F"
  );
});

test("localizeMedicalText handles temperature red flags in both English and Hindi with clean degree symbol", () => {
  const enText = "High fever over 103°F (39.4°C) not responding to medication";
  const hiText = localizeMedicalText(enText, "hi");
  assert.equal(hiText, "103°F (39.4°C) से अधिक तेज़ बुखार जो कम न हो रहा हो");
  assert.ok(!hiText.includes("Â"));
  assert.ok(!hiText.includes("â"));
  assert.ok(hiText.includes("103°F"));

  const backToEn = localizeMedicalText(hiText, "en");
  assert.equal(backToEn, "High fever over 103°F (39.4°C) not responding to medication");
  assert.ok(!backToEn.includes("Â"));
  assert.ok(!backToEn.includes("â"));
  assert.ok(backToEn.includes("103°F"));
});
