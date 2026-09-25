# SwasthAI

A mobile-first Hindi/English health-screening prototype built with React, Vite, and Capacitor.

## Included flow

1. Choose Hindi or English.
2. Describe symptoms by typing or browser speech recognition.
3. Answer four contextual questions.
4. Optionally add up to three symptom photos.
5. Review possible conditions, urgency, conservative self-care, diet guidance, symptoms to monitor, red flags, and professional-care timing.

Red-flag phrases bypass the standard flow and show emergency guidance. The product consistently describes its output as screening assistance, not diagnosis.

## Run locally

```bash
npm install
npm run dev
```

Without configuration, the app uses a clearly labelled local prototype result so the full flow can be tested without sending health data anywhere.

## Connect a real multimodal service

Copy `.env.example` to `.env` and set `VITE_AI_PROXY_URL` to an authenticated server endpoint. The client sends the selected language, symptom context, optional images in configured role order, and the strict response schema.

The proxy must:

- authenticate the app and apply rate limits;
- keep model credentials on the server;
- validate the model response against `APP_CONFIG.ai.responseSchema`;
- avoid retaining symptoms or photos by default;
- return `{ "result": { ...schema fields } }` or the schema object directly.

Do not expose an AI provider key in client-side environment variables.

## Browser support

- Typing and gallery upload work in current modern browsers.
- Camera access requires HTTPS or localhost and explicit user permission.
- Voice input uses the browser Speech Recognition API where available; typing remains the fallback.
- Capacitor configuration is included, but Android packaging has not been generated in this prototype.

## Medical safety scope

This application is not a medical device and does not confirm disease, provide probability percentages, or prescribe medication. Clinical review, privacy assessment, localization review, security testing, and applicable regulatory work are required before real-world release.
