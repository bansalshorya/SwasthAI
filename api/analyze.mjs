import { analyzeScreening, ScreeningError } from "../server/openaiScreening.mjs";

export const maxDuration = 150;

const MAX_REQUEST_BYTES = 4_000_000;

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

async function readJson(request) {
  const declaredLength = Number(request.headers.get("content-length") || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    throw new ScreeningError("The screening request is too large.", "REQUEST_TOO_LARGE", 413);
  }

  let text;
  try {
    text = await request.text();
  } catch {
    throw new ScreeningError("The request body could not be read.", "INVALID_JSON", 400);
  }

  if (Buffer.byteLength(text, "utf8") > MAX_REQUEST_BYTES) {
    throw new ScreeningError("The screening request is too large.", "REQUEST_TOO_LARGE", 413);
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new ScreeningError("The request body must be valid JSON.", "INVALID_JSON", 400);
  }
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Cache-Control": "no-store",
        },
      });
    }

    if (request.method !== "POST") {
      return json(405, {
        error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for this endpoint." },
      });
    }

    try {
      const body = await readJson(request);
      const output = await analyzeScreening(body.screening);
      return json(200, output);
    } catch (error) {
      const known = error instanceof ScreeningError;
      const status = known ? error.status : 500;
      const code = known ? error.code : "INTERNAL_ERROR";
      const message = known
        ? error.message
        : "The screening service encountered an unexpected error.";
      console.error("Vercel screening request failed", { code, status });
      return json(status, { error: { code, message } });
    }
  },
};
