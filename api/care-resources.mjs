import { searchCareResources } from "../server/careResources.mjs";
import { ScreeningError } from "../server/openaiScreening.mjs";

export const maxDuration = 15;

export default {
  async fetch(request) {
    if (request.method !== "POST") {
      return Response.json({ error: { code: "METHOD_NOT_ALLOWED" } }, { status: 405 });
    }
    try {
      const text = await request.text();
      if (Buffer.byteLength(text, "utf8") > 2_048) {
        throw new ScreeningError("Request too large.", "REQUEST_TOO_LARGE", 413);
      }
      const result = await searchCareResources(JSON.parse(text));
      return Response.json(result, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const known = error instanceof ScreeningError;
      return Response.json({ error: {
        code: known ? error.code : "INVALID_JSON",
        message: known ? error.message : "Could not read the care search request.",
      } }, { status: known ? error.status : 400, headers: { "Cache-Control": "no-store" } });
    }
  },
};
