import { Link } from "react-router-dom";
import type { Project } from "@portfolio/shared";
import { TagList } from "./TagList";
import styles from "./ProjectCard.module.css";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link to={`/projects/${project.id}`} className={styles.card}>
      <img src={project.thumbnail} alt={project.title} className={styles.thumbnail} />
      <h3 className={styles.title}>{project.title}</h3>
      <p className={styles.tagline}>{project.tagline}</p>
      <TagList tags={project.tags} />
    </Link>
  );
}
