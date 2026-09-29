import {
  Inbox,
  Shield,
  Tag as TagIcon,
  Ticket,
  Users,
  FolderKanban,
  type LucideProps,
} from "lucide-react";
import type { ComponentType } from "react";
import type { ActivityModule } from "@/lib/types/activity/activity-log-entry.type";

export const ACTIVITY_MODULE_META: Record<
  ActivityModule,
  { label: string; icon: ComponentType<LucideProps>; color: string }
> = {
  ticket: { label: "Tickets", icon: Ticket, color: "#3B82C4" },
  request: { label: "Requests", icon: Inbox, color: "#E2A03F" },
  member: { label: "Members", icon: Users, color: "#28A428" },
  role: { label: "Roles", icon: Shield, color: "#8B5CF6" },
  tag: { label: "Tags", icon: TagIcon, color: "#94A39D" },
  project: { label: "Projects", icon: FolderKanban, color: "#E67E22" },
};

export const ACTIVITY_MODULES = Object.keys(
  ACTIVITY_MODULE_META,
) as ActivityModule[];
