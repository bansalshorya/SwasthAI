import { translateReport } from "../server/reportTranslation.mjs";
import { ScreeningError } from "../server/openaiScreening.mjs";

export const maxDuration = 150;

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for this endpoint." } }, { status: 405 });
    }
    try {
      const text = await request.text();
      if (Buffer.byteLength(text, "utf8") > 40_000) {
        throw new ScreeningError("The report is too large to translate.", "REQUEST_TOO_LARGE", 413);
      }
      const output = await translateReport(JSON.parse(text));
      return Response.json(output, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const known = error instanceof ScreeningError;
      return Response.json({
        error: {
          code: known ? error.code : "INVALID_JSON",
          message: known ? error.message : "Could not read the translation request.",
          ...(known && error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}),
        },
      }, { status: known ? error.status : 400, headers: { "Cache-Control": "no-store" } });
    }
  },
};
