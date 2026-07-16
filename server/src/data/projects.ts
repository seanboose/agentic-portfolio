import { ProjectsSchema, type Project } from "@portfolio/shared";
import raw from "./projects.json" with { type: "json" };

export const projects: Project[] = ProjectsSchema.parse(raw);
