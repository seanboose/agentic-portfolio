import { z } from "zod";

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
  type: z.literal("software"),
  liveUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional(),
});

const ArtProjectSchema = BaseProjectSchema.extend({
  type: z.literal("art"),
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
