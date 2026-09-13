import { rules as allRules } from "@/lib/data/default-rules";

export function resolveRules(ids: number[]) {
  return allRules.filter((rule) => ids.includes(rule.id));
}
