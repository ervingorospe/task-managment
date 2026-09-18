import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

// Ticket descriptions come from the MarkdownEditor (Tiptap, saved as HTML)
// but some (seed/mock, or a future API) arrive as plain markdown — running
// both through `marked` normalizes either into HTML, since raw HTML blocks
// pass through the parser unchanged.
marked.setOptions({ breaks: true, gfm: true });

export function renderDescription(description?: string | null): string {
  const trimmed = description?.trim();
  if (!trimmed) return "";

  const html = marked.parse(trimmed, { async: false }) as string;
  return DOMPurify.sanitize(html);
}
