import { useQuery } from "@tanstack/react-query";
import { ProjectSchema, type Project } from "@portfolio/shared";

async function fetchProject(id: string): Promise<Project> {
  const res = await fetch(`/api/projects/${id}`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return ProjectSchema.parse(await res.json());
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: () => fetchProject(id),
    retry: false, // a 404 for an unknown slug is not transient — don't keep retrying
  });
}
