import { createReadStream } from "node:fs";
import { access, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeScreening, resolveAIProvider, ScreeningError } from "./openaiScreening.mjs";
import { checkPhoto, suggestFollowUps } from "./screeningAssist.mjs";
import { translateReport } from "./reportTranslation.mjs";
import { searchCareResources } from "./careResources.mjs";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_DIR = path.dirname(SERVER_DIR);
const DIST_DIR = path.join(PROJECT_DIR, "dist");
const PORT = Number(process.env.AI_SERVER_PORT || 8787);
const HOST = process.env.AI_SERVER_HOST || "127.0.0.1";
const MAX_REQUEST_BYTES = 12 * 1024 * 1024;

const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".webmanifest": "application/manifest+json",
};

function applySecurityHeaders(response) {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Permissions-Policy", "camera=(self), microphone=(self), geolocation=()");
}

function applyCors(request, response) {
  const allowedOrigin = process.env.AI_ALLOWED_ORIGIN;
  if (allowedOrigin && request.headers.origin === allowedOrigin) {
    response.setHeader("Access-Control-Allow-Origin", allowedOrigin);
    response.setHeader("Vary", "Origin");
  }
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request, maxBytes = MAX_REQUEST_BYTES) {
  const declaredLength = Number(request.headers["content-length"] || 0);
  if (declaredLength > maxBytes) {
    throw new ScreeningError("The screening request is too large.", "REQUEST_TOO_LARGE", 413);
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      throw new ScreeningError("The screening request is too large.", "REQUEST_TOO_LARGE", 413);
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ScreeningError("The request body must be valid JSON.", "INVALID_JSON", 400);
  }
}

async function handleApi(request, response, pathname) {
  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    });
    response.end();
    return true;
  }

  if (pathname === "/api/health" && request.method === "GET") {
    const provider = resolveAIProvider();
    sendJson(response, 200, {
      ok: true,
      aiConfigured: Boolean(provider.apiKey),
      provider: provider.id,
      model: provider.model,
      apiStyle: provider.apiStyle,
    });
    return true;
  }

  if (!["/api/analyze", "/api/follow-up", "/api/photo-check", "/api/translate-report", "/api/care-resources"].includes(pathname)) return false;
  if (request.method !== "POST") {
    sendJson(response, 405, { error: { code: "METHOD_NOT_ALLOWED", message: "Use POST for this endpoint." } });
    return true;
  }

  const body = await readJsonBody(request, pathname === "/api/care-resources" ? 2_048 : MAX_REQUEST_BYTES);
  const result = pathname === "/api/follow-up"
    ? await suggestFollowUps(body)
    : pathname === "/api/photo-check"
      ? await checkPhoto(body)
      : pathname === "/api/care-resources"
        ? await searchCareResources(body)
      : pathname === "/api/translate-report"
        ? await translateReport(body)
      : await analyzeScreening(body.screening);
  sendJson(response, 200, result);
  return true;
}

async function existingFile(filePath) {
  try {
    const info = await stat(filePath);
    return info.isFile();
  } catch {
    return false;
  }
}

async function serveStatic(response, pathname, headOnly = false) {
  try {
    await access(DIST_DIR);
  } catch {
    sendJson(response, 404, {
      error: { code: "FRONTEND_NOT_BUILT", message: "Frontend build not found. Run npm run dev or npm run build first." },
    });
    return;
  }

  const decodedPath = decodeURIComponent(pathname);
  const requested = decodedPath === "/" ? "/index.html" : decodedPath;
  let filePath = path.resolve(DIST_DIR, `.${requested}`);
  if (!filePath.startsWith(`${DIST_DIR}${path.sep}`) || !(await existingFile(filePath))) {
    filePath = path.join(DIST_DIR, "index.html");
  }

  response.writeHead(200, {
    "Content-Type": MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream",
    "Cache-Control": filePath.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable",
  });
  if (headOnly) response.end();
  else createReadStream(filePath).pipe(response);
}

const server = createServer(async (request, response) => {
  applySecurityHeaders(response);
  applyCors(request, response);
  const requestUrl = new URL(request.url || "/", `http://${request.headers.host || `${HOST}:${PORT}`}`);

  try {
    if (await handleApi(request, response, requestUrl.pathname)) return;
    if (request.method === "GET" || request.method === "HEAD") {
      await serveStatic(response, requestUrl.pathname, request.method === "HEAD");
      return;
    }
    sendJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found." } });
  } catch (error) {
    const known = error instanceof ScreeningError;
    const status = known ? error.status : 500;
    const code = known ? error.code : "INTERNAL_ERROR";
    const message = known ? error.message : "The screening service encountered an unexpected error.";
    console.error("Screening request failed", { route: requestUrl.pathname, code, status, providerStatus: error.providerStatus });
    if (!response.headersSent) sendJson(response, status, { error: { code, message, ...(error.retryAfterSeconds ? { retryAfterSeconds: error.retryAfterSeconds } : {}) } });
    else response.end();
  }
});

server.listen(PORT, HOST, () => {
  const provider = resolveAIProvider();
  console.log(`SwasthAI server listening on http://${HOST}:${PORT}`);
  console.log(
    `AI provider: ${provider.label} / ${provider.model} (${provider.apiKey ? "configured" : "missing key"})`,
  );
});
