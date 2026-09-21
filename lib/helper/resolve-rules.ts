import type { Rule } from "@/lib/types/rule/rule.type";

export function resolveRules(ids: number[], allRules: Rule[]): Rule[] {
  return allRules.filter((rule) => ids.includes(rule.id));
}
