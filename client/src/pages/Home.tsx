import { useState } from "react";
import type { Project } from "@portfolio/shared";
import { useProjects } from "../queries/useProjects";
import { ProjectCard } from "../components/ProjectCard";
import styles from "./Home.module.css";

type Filter = "all" | "software" | "art";

export function Home() {
  const { data: projects, isLoading, error } = useProjects();
  const [filter, setFilter] = useState<Filter>("all");

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Failed to load projects.</p>;

  const filtered: Project[] =
    filter === "all" ? (projects ?? []) : (projects ?? []).filter((p) => p.type === filter);

  return (
    <div>
      <div className={styles.tabs}>
        {(["all", "software", "art"] as const).map((tab) => (
          <button
            key={tab}
            className={tab === filter ? styles.activeTab : styles.tab}
            onClick={() => setFilter(tab)}
          >
            {tab === "all" ? "All" : tab === "software" ? "Software" : "Art"}
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
