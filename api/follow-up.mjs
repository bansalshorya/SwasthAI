import { suggestFollowUps } from "../server/screeningAssist.mjs";
import { ScreeningError } from "../server/openaiScreening.mjs";

export const maxDuration = 30;
export default {
  async fetch(request) {
    if (request.method !== "POST") return Response.json({ error: { code: "METHOD_NOT_ALLOWED" } }, { status: 405 });
    try {
      const text = await request.text();
      if (text.length > 8_000) throw new ScreeningError("Request too large.", "REQUEST_TOO_LARGE", 413);
      return Response.json(await suggestFollowUps(JSON.parse(text)), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const known = error instanceof ScreeningError;
      return Response.json({ error: { code: known ? error.code : "INVALID_JSON", message: known ? error.message : "Could not prepare follow-up questions." } }, { status: known ? error.status : 400 });
    }
  },
};
