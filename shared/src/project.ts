import { z } from "zod";

// Single source of truth for project-type string values — reused in the schema's
// z.literal() calls below and in PROJECT_TYPES, so the two can't drift apart.
const SOFTWARE_TYPE = "software";
const ART_TYPE = "art";

const BaseProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  tagline: z.string(),
  tags: z.array(z.string()),
  date: z.string().regex(/^\d{4}-\d{2}$/), // "YYYY-MM"
  featured: z.boolean(),
  thumbnail: z.string(),
  images: z.array(z.string()),
  body: z.string(), // markdown
});

const SoftwareProjectSchema = BaseProjectSchema.extend({
  type: z.literal(SOFTWARE_TYPE),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
});

const ArtProjectSchema = BaseProjectSchema.extend({
  type: z.literal(ART_TYPE),
});

export const ProjectSchema = z.discriminatedUnion("type", [
  SoftwareProjectSchema,
  ArtProjectSchema,
]);

export const ProjectsSchema = z.array(ProjectSchema).superRefine((projects, ctx) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const p of projects) {
    if (seen.has(p.id)) duplicates.add(p.id);
    seen.add(p.id);
  }
  if (duplicates.size > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Duplicate project id(s): ${[...duplicates].join(", ")}`,
    });
  }
});

export type Project = z.infer<typeof ProjectSchema>;

// Reuses the same constants passed into z.literal() above, checked against the
// schema's own inferred type — a new project type added to the discriminated
// union without a matching PROJECT_TYPES entry fails to compile.
export const PROJECT_TYPES = {
  [SOFTWARE_TYPE]: SOFTWARE_TYPE,
  [ART_TYPE]: ART_TYPE,
} as const satisfies Record<Project["type"], Project["type"]>;

export type ProjectType = Project["type"];
