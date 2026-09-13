import { TagDetail } from "../types/organization/tag-detail.type";

export const mockDefaultTags: TagDetail[] = [
  { id: 1, tag_name: "Backlog", color: "#94A39D", isDefault: true },
  { id: 2, tag_name: "To Do", color: "#64748B", isDefault: true },
  { id: 3, tag_name: "In-Progress", color: "#3B82C4", isDefault: true },
  { id: 4, tag_name: "In Review", color: "#8B5CF6", isDefault: true },
  { id: 5, tag_name: "Blocked", color: "#E5484D", isDefault: true },
  { id: 6, tag_name: "Cancelled", color: "#94A39D", isDefault: true },
  { id: 7, tag_name: "Done", color: "#28A428", isDefault: true },
];
