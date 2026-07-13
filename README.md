# Portfolio

React (Vite) + Express, unified deployment. See `PLAN.md` for full architecture notes.

## Getting started

```
npm install
npm run dev
```

Vite dev server runs at http://localhost:5173 (proxies `/api` and `/images` to Express on :4000).

## Tests

```
npm run test        # vitest — shared schema tests
npm run test:e2e    # playwright — full app, runs against a production build
```

Playwright needs a browser binary, installed once per machine:

```
npm run test:e2e:setup -w e2e
```

If the browser fails to *launch* (not just download) on a fresh machine, it's missing system libraries — try:

```
npx playwright install chromium --with-deps
```

(`--with-deps` may require sudo.)

## Production

```
npm run build
npm run start
```

Single Express process serves the built client, `/api/*`, and `/images/*` from one port. Deployed on Render:

```
Build command: npm install && npm run build
Start command: npm run start
```
