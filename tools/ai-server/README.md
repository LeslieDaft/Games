# Daft Tools AI service

The static tools are at /tools/. Random Lab, calculator, and graphs need no backend. Printed-expression OCR uses Tesseract.js 5.1.1, downloaded only on demand from jsDelivr; it also downloads worker/WASM/language resources. It is for clear printed text, not reliable handwriting or structured fraction recognition. Students review the recognized expression before evaluating it.

AI hints and multimodal photo solving are deliberately disabled until a backend is deployed. No fake AI or keyword fallback is presented as an AI answer.

Run `node tools/ai-server/server.mjs` with Node 22 or newer on a server. Configure OPENAI_API_KEY as a secret in the hosting provider (never in GitHub or frontend config), OPENAI_MODEL as a Responses-compatible text/image model, ALLOWED_ORIGIN as the exact frontend origin (default https://lesliedaft.github.io), and optionally PORT (8788) and DAILY_MODEL_CALL_LIMIT (200). Then set aiBaseUrl in tools/config.json to its HTTPS base URL. Check /health reports ready:true. Update Tools page pending labels only after live verification.

Before public activation, set a provider-side budget and deploy behind persistent rate limiting/bot protection. The included service has a 3-request concurrency cap, bounded payloads/output, timeouts, and an in-memory daily model-call cap; the counter resets on restart and is not shared across replicas. CORS restricts browser callers but is not authentication. Each hint uses two model calls, generation and independent answer-leak review; photo solving uses one. Hosting and API billing need owner setup. No service has been purchased or deployed.

Hints enforce one small conceptual nudge and one question, using subject, level, working, and recent hints. The review fails closed to a generic study question. These model-based checks reduce answer leakage but cannot guarantee it; run real-model evaluations before calling this production-ready. Include direct factual questions, multiple choice, final-answer confirmation, essays, translation, programming, repeated hints, and prompt injections in every subject. Real-model quality and vision accuracy have not been verified without credentials.

Frontend does not persist homework/images; server does not log request bodies; API requests use store:false. Provider data policies still apply. Photo upload occurs only after the AI photo button is clicked.

Calculator uses locally vendored math.js 14.8.1 (Apache-2.0 license included). Expression AST allowlist excludes assignments, objects, arrays, dynamic evaluators, and arbitrary functions. Equations use numerical root search over [-100,100], and may miss tangencies or tightly spaced roots. Graphs and table use real values, radians, and up to three functions.
