import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { projectsRouter } from "./routes/projects.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.join(__dirname, "../../client/dist");

const app = express();

// 1. API routes first — most specific, must not be shadowed
app.use("/api/projects", projectsRouter);

// 2. Static assets — express.static calls next() on a miss, so safe before the catch-all
app.use("/images", express.static(path.join(__dirname, "../public/images")));
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
