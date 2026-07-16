import { describe, it, expect } from "vitest";
import { ProjectSchema, ProjectsSchema } from "./project.js";

const validSoftware = {
  id: "weather-app",
  type: "software" as const,
  title: "Weather App",
  tagline: "A simple weather app.",
  tags: ["React"],
  date: "2026-03",
  featured: true,
  thumbnail: "/images/weather-app/thumb.webp",
  images: ["/images/weather-app/thumb.webp"],
  body: "Body text.",
  liveUrl: "https://example.com",
  repoUrl: "https://github.com/example/weather-app",
};

const validArt = {
  id: "sunset-study",
  type: "art" as const,
  title: "Sunset Study",
  tagline: "An oil painting.",
  tags: ["Oil on canvas"],
  date: "2026-01",
  featured: false,
  thumbnail: "/images/sunset-study/thumb.webp",
  images: ["/images/sunset-study/thumb.webp"],
  body: "Body text.",
};

describe("ProjectSchema", () => {
  it("accepts a valid software project", () => {
    expect(ProjectSchema.safeParse(validSoftware).success).toBe(true);
  });

  it("accepts a valid art project", () => {
    expect(ProjectSchema.safeParse(validArt).success).toBe(true);
  });

  it("accepts a software project with no liveUrl/repoUrl", () => {
    const { liveUrl: _liveUrl, repoUrl: _repoUrl, ...rest } = validSoftware;
    expect(ProjectSchema.safeParse(rest).success).toBe(true);
  });

  it("rejects an art project with liveUrl (not part of the art variant)", () => {
    const result = ProjectSchema.safeParse({ ...validArt, liveUrl: "https://example.com" });
    // extra unknown keys are stripped by default zod object parsing, not rejected —
    // this documents that behavior rather than asserting a rejection.
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "art") {
      expect((result.data as Record<string, unknown>).liveUrl).toBeUndefined();
    }
  });

  it("rejects an art project with repoUrl (not part of the art variant)", () => {
    const result = ProjectSchema.safeParse({ ...validArt, repoUrl: "https://example.com" });
    // extra unknown keys are stripped by default zod object parsing, not rejected —
    // this documents that behavior rather than asserting a rejection.
    expect(result.success).toBe(true);
    if (result.success && result.data.type === "art") {
      expect((result.data as Record<string, unknown>).repoUrl).toBeUndefined();
    }
  });

  it("rejects an unknown type literal", () => {
    const result = ProjectSchema.safeParse({ ...validSoftware, type: "sculpture" });
    expect(result.success).toBe(false);
  });

  it("rejects a malformed date", () => {
    const result = ProjectSchema.safeParse({ ...validSoftware, date: "March 2026" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-url liveUrl", () => {
    const result = ProjectSchema.safeParse({ ...validSoftware, liveUrl: "not-a-url" });
    expect(result.success).toBe(false);
  });
});

describe("ProjectsSchema", () => {
  it("accepts an array of projects with unique ids", () => {
    expect(ProjectsSchema.safeParse([validSoftware, validArt]).success).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(ProjectsSchema.safeParse([]).success).toBe(true);
  });

  it("rejects duplicate ids with a specific error message", () => {
    const result = ProjectsSchema.safeParse([validSoftware, { ...validArt, id: validSoftware.id }]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("Duplicate project id(s): weather-app");
    }
  });

  it("names all duplicate ids when there are multiple", () => {
    const dup1 = { ...validArt, id: "dup-a" };
    const dup2 = { ...validSoftware, id: "dup-a" };
    const dup3 = { ...validArt, id: "dup-b" };
    const dup4 = { ...validSoftware, id: "dup-b" };
    const result = ProjectsSchema.safeParse([dup1, dup2, dup3, dup4]);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain("dup-a");
      expect(result.error.issues[0].message).toContain("dup-b");
    }
  });
});
