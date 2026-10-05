import { checkPhoto } from "../server/screeningAssist.mjs";
import { ScreeningError } from "../server/openaiScreening.mjs";

export const maxDuration = 60;
export default {
  async fetch(request) {
    if (request.method !== "POST") return Response.json({ error: { code: "METHOD_NOT_ALLOWED" } }, { status: 405 });
    try {
      const text = await request.text();
      if (text.length > 4_600_000) throw new ScreeningError("Photo too large.", "REQUEST_TOO_LARGE", 413);
      return Response.json(await checkPhoto(JSON.parse(text)), { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      const known = error instanceof ScreeningError;
      return Response.json({ error: { code: known ? error.code : "INVALID_JSON", message: known ? error.message : "Could not check the photo." } }, { status: known ? error.status : 400 });
    }
  },
};
