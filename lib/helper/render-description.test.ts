// isomorphic-dompurify pulls in jsdom (for its server-side path) which
// drags in an ESM-only transitive chain (html-encoding-sniffer ->
// @exodus/bytes) that Jest can't require() as CJS. DOMPurify's own
// sanitization correctness is that library's job, not this file's — these
// tests are about renderDescription/toPlainText's own trim/parse/delegate
// logic, so a lightweight stand-in is enough.
jest.mock("isomorphic-dompurify", () => ({
  sanitize: (html: string, options?: { ALLOWED_TAGS?: string[] }) => {
    if (options?.ALLOWED_TAGS?.length === 0) {
      return html.replace(/<[^>]*>/g, "");
    }
    return html.replace(/<script[\s\S]*?<\/script>/gi, "");
  },
}));

import { renderDescription, toPlainText } from "./render-description";

describe("renderDescription", () => {
  it("returns an empty string for null/undefined/blank input", () => {
    expect(renderDescription(null)).toBe("");
    expect(renderDescription(undefined)).toBe("");
    expect(renderDescription("   ")).toBe("");
  });

  it("converts markdown to HTML", () => {
    expect(renderDescription("**bold** text")).toContain("<strong>bold</strong>");
  });

  it("sanitizes out a script tag", () => {
    const html = renderDescription('<script>alert("xss")</script>Hello');
    expect(html).not.toContain("<script>");
    expect(html).toContain("Hello");
  });
});

describe("toPlainText", () => {
  it("returns an empty string for null/undefined/blank input", () => {
    expect(toPlainText(null)).toBe("");
    expect(toPlainText(undefined)).toBe("");
  });

  it("strips markdown formatting down to plain text", () => {
    expect(toPlainText("# Heading\n\n- one\n- two")).toBe("Heading one two");
  });

  it("collapses whitespace and trims", () => {
    expect(toPlainText("line one\n\nline two")).toBe("line one line two");
  });
});
