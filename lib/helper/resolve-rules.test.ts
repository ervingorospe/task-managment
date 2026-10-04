import { resolveRules } from "./resolve-rules";
import type { Rule } from "@/lib/types/rule/rule.type";

const ALL_RULES: Rule[] = [
  { id: 1, action: "ticket.view.all", name: "View all tickets", desc: "", categoryId: 1 },
  { id: 2, action: "ticket.create", name: "Create tickets", desc: "", categoryId: 1 },
  { id: 3, action: "project.view", name: "View projects", desc: "", categoryId: 2 },
];

it("returns only the rules whose ids are in the given list", () => {
  expect(resolveRules([1, 3], ALL_RULES)).toEqual([ALL_RULES[0], ALL_RULES[2]]);
});

it("returns an empty array when no ids match", () => {
  expect(resolveRules([999], ALL_RULES)).toEqual([]);
});

it("returns an empty array for an empty id list", () => {
  expect(resolveRules([], ALL_RULES)).toEqual([]);
});
