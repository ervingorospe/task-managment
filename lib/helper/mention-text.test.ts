import { detectMentionTrigger, insertMention, splitOnMentions } from "./mention-text";

describe("detectMentionTrigger", () => {
  it("triggers on an '@' at the very start of the text", () => {
    expect(detectMentionTrigger("@ja", 3)).toEqual({ start: 0, query: "ja" });
  });

  it("triggers on an '@' after whitespace", () => {
    expect(detectMentionTrigger("Hey @ja", 7)).toEqual({ start: 4, query: "ja" });
  });

  it("does not trigger mid-word (e.g. an email address)", () => {
    expect(detectMentionTrigger("jane@acmestudio", 15)).toBeNull();
  });

  it("does not trigger when there's no '@' before the cursor", () => {
    expect(detectMentionTrigger("just some text", 14)).toBeNull();
  });

  it("triggers with an empty query right after typing '@'", () => {
    expect(detectMentionTrigger("Hey @", 5)).toEqual({ start: 4, query: "" });
  });
});

describe("insertMention", () => {
  it("replaces the in-progress @query with the chosen name, adding a trailing space", () => {
    const result = insertMention("Hey @ja, check this out", { start: 4, query: "ja" }, "Jane Doe");
    expect(result).toBe("Hey @Jane Doe , check this out");
  });
});

describe("splitOnMentions", () => {
  it("returns the whole text unmentioned when there are no mentionable names", () => {
    expect(splitOnMentions("Hey @Jane", [])).toEqual([
      { text: "Hey @Jane", isMention: false },
    ]);
  });

  it("splits out a mention in the middle of the text", () => {
    expect(splitOnMentions("Hey @Jane Doe, thanks!", ["Jane Doe"])).toEqual([
      { text: "Hey ", isMention: false },
      { text: "@Jane Doe", isMention: true },
      { text: ", thanks!", isMention: false },
    ]);
  });

  it("prefers the longest matching name so a shorter name doesn't shadow it", () => {
    expect(splitOnMentions("@Jane Doe", ["Jane", "Jane Doe"])).toEqual([
      { text: "@Jane Doe", isMention: true },
    ]);
  });

  it("returns the text unchanged when no mention matches", () => {
    expect(splitOnMentions("No mentions here", ["Jane Doe"])).toEqual([
      { text: "No mentions here", isMention: false },
    ]);
  });

  it("handles a mention at the very end of the text", () => {
    expect(splitOnMentions("Thanks @Jane", ["Jane"])).toEqual([
      { text: "Thanks ", isMention: false },
      { text: "@Jane", isMention: true },
    ]);
  });
});
