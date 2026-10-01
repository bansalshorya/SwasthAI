import { resolveAIProvider, ScreeningError } from "../server/openaiScreening.mjs";

function json(status, body) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export default {
  async fetch(request) {
    if (request.method !== "GET") {
      return json(405, {
        error: { code: "METHOD_NOT_ALLOWED", message: "Use GET for this endpoint." },
      });
    }

    try {
      const provider = resolveAIProvider();
      return json(200, {
        ok: true,
        aiConfigured: Boolean(provider.apiKey),
        provider: provider.id,
        model: provider.model,
        apiStyle: provider.apiStyle,
      });
    } catch (error) {
      const known = error instanceof ScreeningError;
      return json(known ? error.status : 500, {
        ok: false,
        error: {
          code: known ? error.code : "INTERNAL_ERROR",
          message: known ? error.message : "The AI service configuration is invalid.",
        },
      });
    }
  },
};
