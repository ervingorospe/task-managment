import { effectiveSearch, MIN_SEARCH_LENGTH } from "./search-query";

it("returns the trimmed search when it meets the default minimum length", () => {
  expect(effectiveSearch("  login  ")).toBe("login");
});

it("returns an empty string when below the default minimum length", () => {
  expect(effectiveSearch("ab")).toBe("");
});

it("returns an empty string when exactly at (minLength - 1)", () => {
  expect(effectiveSearch("a".repeat(MIN_SEARCH_LENGTH - 1))).toBe("");
});

it("respects a custom minLength", () => {
  expect(effectiveSearch("ab", 2)).toBe("ab");
  expect(effectiveSearch("a", 2)).toBe("");
});
