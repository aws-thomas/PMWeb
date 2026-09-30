import { describe, expect, test } from "vitest";
import { isReservedSlug, slugify, withSuffix } from "./slug";

describe("slugify", () => {
  test.each([
    ["Client Website", "client-website"],
    ["  Q3 -- launch!!  ", "q3-launch"],
    ["Cafe Muller", "cafe-muller"],
    ["Café Müller", "cafe-muller"],
    ["API v2.0 / Auth", "api-v2-0-auth"],
  ])("turns %j into %j", (name, slug) => {
    expect(slugify(name)).toBe(slug);
  });

  test.each(["!!!", "   ", "项目"])(
    "falls back to 'project' when %j has no Latin letters or digits",
    (name) => expect(slugify(name)).toBe("project"),
  );

  test("caps the base at 60 characters without a trailing hyphen", () => {
    const slug = slugify(`${"a".repeat(59)} ${"b".repeat(140)}`);
    expect(slug).toBe("a".repeat(59));
    expect(slugify("x".repeat(200))).toHaveLength(60);
  });
});

describe("withSuffix", () => {
  test("leaves the first attempt bare and numbers the rest from 2", () => {
    expect(withSuffix("website", 1)).toBe("website");
    expect(withSuffix("website", 2)).toBe("website-2");
    expect(withSuffix("website", 10)).toBe("website-10");
  });
});

describe("isReservedSlug", () => {
  test.each(["new", "archived"])("reserves %j, which a fixed route already uses", (slug) => {
    expect(isReservedSlug(slug)).toBe(true);
  });

  test.each(["new-2", "archived-2", "news", "client-website"])("allows %j", (slug) => {
    expect(isReservedSlug(slug)).toBe(false);
  });
});
