import { Router } from "express";
import { projects } from "../data/loadProjects.js";

export const projectsRouter = Router();

projectsRouter.get("/", (req, res) => {
  res.json(projects);
});

projectsRouter.get("/:id", (req, res) => {
  const project = projects.find((p) => p.id === req.params.id);
  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }
  res.json(project);
});
