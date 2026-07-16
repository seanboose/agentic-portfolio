import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { PROJECT_TYPES } from "@portfolio/shared";
import { useProject } from "../queries/useProject";
import { ImageGallery } from "../components/ImageGallery";
import { TagList } from "../components/TagList";
import { Loading } from "../components/Loading";
import styles from "./ProjectDetail.module.css";

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, error } = useProject(id!);

  if (isLoading) return <Loading />;
  if (error || !project) return <p>Project not found.</p>;

  return (
    <div>
      <Link to="/" className={styles.back}>
        &larr; Back
      </Link>
      <h1>{project.title}</h1>
      <p className={styles.tagline}>{project.tagline}</p>
      <TagList tags={project.tags} />

      {project.type === PROJECT_TYPES.software && (project.liveUrl || project.repoUrl) && (
        <div className={styles.links}>
          {project.liveUrl && (
            <a href={project.liveUrl} target="_blank" rel="noreferrer">
              Live site
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noreferrer">
              Repository
            </a>
          )}
        </div>
      )}

      <ImageGallery images={project.images} alt={project.title} />

      <div className={styles.body}>
        <ReactMarkdown>{project.body}</ReactMarkdown>
      </div>
    </div>
  );
}
