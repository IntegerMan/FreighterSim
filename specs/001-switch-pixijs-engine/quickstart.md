# Quickstart: PixiJS Rendering Engine Cutover

## Prerequisites
- Node.js LTS and pnpm/npm installed
- Modern browser with WebGL2 support (WebGL1 or Canvas acceptable for fallback)

## Setup

```bash
git checkout 001-switch-pixijs-engine
npm install
npm run dev
```

Open the app at http://localhost:5173 and navigate core screens (navigation/map, cargo, bridge). Verify capability selection message and responsiveness.

## Tests & Lint

```bash
npm run test
npm run e2e
npm run lint
```

All Playwright E2E and ESLint checks must pass before marking the feature complete.

## Debug/QA Indicators
- Ensure a debug view shows: fps, frame time (p95), memory, particle count, effects intensity, throttling stage.
- Contracts available in specs/001-switch-pixijs-engine/contracts/openapi.yaml for instrumentation.

## Notes
- Auto-throttling: particles → effects intensity → resolution (last resort).
- WebGL context loss: one auto recovery attempt; halt if failure repeats within 30s.