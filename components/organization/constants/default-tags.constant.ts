import { OrgTag } from "@/lib/types/organization.type";

export const defaultTags: OrgTag[] = [
  {
    id: "backlog",
    name: "Backlog",
    color: "#94A39D",
    isDefault: true,
  },
  {
    id: "todo",
    name: "To Do",
    color: "#64748B",
    isDefault: true,
  },
  {
    id: "in-progress",
    name: "In-Progress",
    color: "#3B82C4",
    isDefault: true,
  },
  {
    id: "in-review",
    name: "In Review",
    color: "#8B5CF6",
    isDefault: true,
  },
  {
    id: "blocked",
    name: "Blocked",
    color: "#E5484D",
    isDefault: true,
  },
  {
    id: "cancelled",
    name: "Cancelled",
    color: "#94A39D",
    isDefault: true,
  },
  {
    id: "done",
    name: "Done",
    color: "#28A428",
    isDefault: true,
  },
];
