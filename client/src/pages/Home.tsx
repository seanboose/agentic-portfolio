import { useState } from "react";
import { PROJECT_TYPES, type Project, type ProjectType } from "@portfolio/shared";
import { useProjects } from "../queries/useProjects";
import { ProjectCard } from "../components/ProjectCard";
import { Loading } from "../components/Loading";
import styles from "./Home.module.css";

type Filter = "all" | ProjectType;

const FILTERS: Filter[] = ["all", PROJECT_TYPES.software, PROJECT_TYPES.art];

const FILTER_LABELS: Record<Filter, string> = {
  all: "All",
  [PROJECT_TYPES.software]: "Software",
  [PROJECT_TYPES.art]: "Art",
};

function filterProjects(projects: Project[] = [], filter: Filter): Project[] {
  return filter === "all" ? projects : projects.filter((p) => p.type === filter);
}

export function Home() {
  const { data: projects, isLoading, error } = useProjects();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) return <Loading />;
  if (error) return <p>Failed to load projects.</p>;

  const filtered = filterProjects(projects, filter);

  return (
    <div>
      <div className={styles.tabs}>
        {FILTERS.map((tab) => (
          <button
            key={tab}
            className={tab === filter ? styles.activeTab : styles.tab}
            onClick={() => setFilter(tab)}
          >
            {FILTER_LABELS[tab]}
          </button>
        ))}
      </div>
      <div className={styles.grid}>
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
