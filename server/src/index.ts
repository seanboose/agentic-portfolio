import { config } from "dotenv";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectsRouter } from "./routes/projects.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// server/src (dev, via tsx) and server/dist (prod, via tsc output) are both exactly
// one directory under server/, so ../../ reaches the repo root from either.
const repoRoot = path.join(__dirname, "../..");

// .env.development(.local) are checked-in/gitignored dev-only tiers that still exist
// on disk in prod (Render deploys the full repo) — only cascade them in development so
// they can never shadow Render's injected prod env vars. .env itself (production-safe,
// committed) always loads, dev and prod alike. Paths are resolved against the repo
// root explicitly (not process.cwd()) since npm workspace scripts run with cwd set to
// the workspace directory (server/), not the repo root where these files live.
const envFiles =
  process.env.NODE_ENV === "development"
    ? [".env.development.local", ".env.development", ".env"]
    : [".env"];
config({ path: envFiles.map((f) => path.join(repoRoot, f)) });

const clientDist = path.join(__dirname, "../../client/dist");

const app = express();

// 1. API routes first — most specific, must not be shadowed
app.use("/api/projects", projectsRouter);

// 2. Static assets — express.static calls next() on a miss, so safe before the catch-all
app.use("/images", express.static(path.join(__dirname, "../public/images")));
// A miss under /images is a genuinely missing asset, not a client-side route —
// 404 here instead of falling through to the SPA catch-all below.
app.use("/images", (req, res) => {
  res.status(404).end();
});
app.use(express.static(clientDist)); // also serves index.html at "/"

// 3. SPA fallback last — anything unmatched falls through to index.html;
//    React Router reads the URL client-side and renders the right page.
app.get("*", (req, res) => {
  res.sendFile(path.join(clientDist, "index.html"));
});

const port = process.env.PORT ?? 4000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
