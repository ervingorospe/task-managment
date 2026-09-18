export interface MentionTrigger {
  /** Index of the "@" character in the text. */
  start: number;
  query: string;
}

/**
 * Looks backward from the cursor for an in-progress "@query" — only
 * triggers when the "@" starts a word (start of text or after whitespace),
 * so emails and the like don't accidentally open the mention list.
 */
export function detectMentionTrigger(
  text: string,
  cursor: number,
): MentionTrigger | null {
  const upToCursor = text.slice(0, cursor);
  const match = upToCursor.match(/(?:^|\s)@([a-zA-Z]*)$/);
  if (!match) return null;

  const query = match[1];
  return { start: upToCursor.length - query.length - 1, query };
}

/** Replaces the in-progress "@query" with the chosen mention. */
export function insertMention(
  text: string,
  trigger: MentionTrigger,
  name: string,
): string {
  const before = text.slice(0, trigger.start);
  const after = text.slice(trigger.start + 1 + trigger.query.length);
  return `${before}@${name} ${after}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Splits comment text on @mentions of known names, for highlighting. */
export function splitOnMentions(
  text: string,
  mentionableNames: string[],
): Array<{ text: string; isMention: boolean }> {
  if (mentionableNames.length === 0) return [{ text, isMention: false }];

  // Longest names first so "Jane Doe" doesn't get shadowed by a shorter
  // partial match from another mentionable name.
  const sortedNames = [...mentionableNames].sort(
    (a, b) => b.length - a.length,
  );
  const pattern = new RegExp(
    `@(${sortedNames.map(escapeRegExp).join("|")})\\b`,
    "g",
  );

  const parts: Array<{ text: string; isMention: boolean }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isMention: false });
    }
    parts.push({ text: `@${match[1]}`, isMention: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isMention: false });
  }

  return parts;
}
