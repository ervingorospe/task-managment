"use client";

import { useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  MessageSquare,
  Paperclip,
  Pencil,
  RefreshCw,
  Send,
  Ticket as TicketIcon,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import type { LucideProps } from "lucide-react";
import BackButton from "@/components/ui/buttons/button-back";
import Card from "@/components/ui/card";
import Avatar from "@/components/ui/avatar";
import { SectionHeading } from "@/components/ticket/section-heading";
import { TimelineStep } from "@/components/ui/timeline-step";
import { Button } from "@/components/ui/buttons/button";
import TicketFormModal from "@/components/ticket/ticket-form-modal";
import { RejectRequestModal } from "./reject-request-modal";
import { PERMISSIONS } from "@/lib/data/permissions";
import { usePermission } from "@/providers/auth-provider";
import { useToast } from "@/providers/toast-provider";
import { useActivityLog } from "@/providers/activity-log-provider";
import { useLogActivity } from "@/hooks/use-log-activity";
import { formatReferenceId } from "@/lib/helper/reference-id";
import { renderDescription } from "@/lib/helper/render-description";
import { formatDate, formatRelative } from "@/lib/helper/format-date";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type {
  TicketRequest,
  TicketRequestStatus,
} from "@/lib/types/ticket/ticket-request.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TicketFormValues } from "@/lib/schemas/ticket.schema";

interface RequestDetailClientProps {
  request: TicketRequest;
  organization: OrganizationDetail;
}

const ACTIVITY_ACTION_ICON: Record<string, ComponentType<LucideProps>> = {
  created: Send,
  approved: CheckCircle2,
  rejected: XCircle,
  commented: MessageSquare,
  edited: Pencil,
  removed: Trash2,
};

const STATUS_STYLE: Record<
  TicketRequestStatus,
  {
    icon: ComponentType<LucideProps>;
    text: string;
    bg: string;
    ring: string;
    label: string;
  }
> = {
  pending: {
    icon: Clock,
    text: "text-warning",
    bg: "bg-warning-subtle",
    ring: "ring-warning/20",
    label: "Waiting on a decision",
  },
  approved: {
    icon: CheckCircle2,
    text: "text-accent-text",
    bg: "bg-accent-subtle",
    ring: "ring-accent/20",
    label: "Approved and turned into a ticket",
  },
  rejected: {
    icon: XCircle,
    text: "text-danger",
    bg: "bg-danger-subtle",
    ring: "ring-danger/20",
    label: "Rejected",
  },
};

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function RequestDetailClient({
  request: initialRequest,
  organization,
}: RequestDetailClientProps) {
  const toast = useToast();
  const canCreateTicket = usePermission(PERMISSIONS.TICKET_CREATE);
  const { entries } = useActivityLog();
  const logRequestActivity = useLogActivity("request");
  const logTicketActivity = useLogActivity("ticket");

  const [request, setRequest] = useState(initialRequest);
  const [tickets, setTickets] = useState<TicketDetail[]>(
    organization.tickets ?? [],
  );
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);

  const slug = organization.settings?.slug;
  const requestsHref = slug
    ? `/dashboard/organizations/${slug}/requests`
    : "/dashboard";

  const linkedTicket = tickets.find((t) => t.id === request.ticketId);
  const status = STATUS_STYLE[request.status];
  const StatusIcon = status.icon;

  const requestEntries = useMemo(
    () =>
      entries
        .filter((e) => e.module === "request" && e.entityId === request.id)
        .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1)),
    [entries, request.id],
  );

  const activitySteps = useMemo(() => {
    const steps: {
      key: string;
      icon: ComponentType<LucideProps>;
      label: string;
      date?: string;
      tone: "done" | "active" | "upcoming" | "danger";
    }[] = requestEntries.map((entry) => ({
      key: `entry-${entry.id}`,
      icon: ACTIVITY_ACTION_ICON[entry.action] ?? RefreshCw,
      label: `${entry.actorName} ${entry.description}`,
      date: `${formatDate(entry.createdAt)} · ${formatRelative(entry.createdAt)}`,
      tone: entry.action === "rejected" ? "danger" : "done",
    }));

    if (request.status === "pending") {
      steps.push({
        key: "awaiting",
        icon: Eye,
        label: "Awaiting review",
        tone: "active",
      });
    }

    return steps;
  }, [requestEntries, request.status]);

  function handleReject(remarks: string) {
    setRequest((prev) => ({
      ...prev,
      status: "rejected",
      remarks,
      updatedAt: new Date().toISOString(),
    }));
    logRequestActivity({
      orgId: organization.id,
      action: "rejected",
      entityId: request.id,
      entityLabel: request.title,
      referenceId: request.referenceId,
      involvedUserIds: [request.client.user?.id],
      description: `rejected request "${request.title}": ${remarks}`,
    });
    toast(`Request "${request.title}" rejected`, "error");
    // TODO: PATCH /ticket-requests/:id { status: "rejected", remarks }
  }

  function handleApprove(values: TicketFormValues) {
    const targetTodoTag =
      organization.tags.find((t) => t.tagName === "To Do") ??
      organization.tags[0];
    if (!targetTodoTag) return;

    const newAttachments = values.attachments.map((file, i) => ({
      id: Date.now() + i,
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
    }));

    const newTicket: TicketDetail = {
      id: Date.now(),
      referenceId: formatReferenceId("tckt", tickets.length + 1),
      orgId: organization.id,
      title: values.title,
      description: values.description || undefined,
      attachments: [...request.attachments, ...newAttachments],
      tag: targetTodoTag,
      client:
        organization.members.find((m) => String(m.id) === values.clientId) ??
        request.client,
      assignees: organization.members.filter((m) =>
        values.assigneeIds.includes(m.id),
      ),
      dueDate: values.dueDate || null,
      starred: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTickets((prev) => [newTicket, ...prev]);
    setRequest((prev) => ({
      ...prev,
      status: "approved",
      ticketId: newTicket.id,
      updatedAt: new Date().toISOString(),
    }));
    logRequestActivity({
      orgId: organization.id,
      action: "approved",
      entityId: request.id,
      entityLabel: request.title,
      referenceId: request.referenceId,
      involvedUserIds: [request.client.user?.id],
      description: `approved request "${request.title}"`,
    });
    logTicketActivity({
      orgId: organization.id,
      action: "created",
      entityId: newTicket.id,
      entityLabel: newTicket.title,
      referenceId: newTicket.referenceId,
      involvedUserIds: [
        newTicket.client?.user?.id,
        ...newTicket.assignees.map((a) => a.user?.id),
      ],
      description: `created ticket "${newTicket.title}" from a request`,
    });
    toast(`Request approved — ticket "${newTicket.title}" created`);
    setApproveOpen(false);
    // TODO: POST /organizations/:orgId/tickets (from request), then
    // PATCH /ticket-requests/:id { status: "approved", ticket_id }
  }

  return (
    <div>
      <BackButton />

      {/* Header — colored by status so the state reads at a glance */}
      <div
        className={`relative overflow-hidden rounded-lg border border-line bg-surface p-5 ring-1 ${status.ring}`}
      >
        <div
          className={`absolute inset-x-0 top-0 h-1 ${
            request.status === "approved"
              ? "bg-accent"
              : request.status === "rejected"
                ? "bg-danger"
                : "bg-warning"
          }`}
        />

        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${status.bg}`}
            >
              <StatusIcon size={20} className={status.text} />
            </span>

            <div className="min-w-0">
              <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
                <Link href={requestsHref} className="hover:text-ink">
                  {organization.organizationName}
                </Link>
                <ChevronRight size={12} />
                <span>Requests</span>
              </nav>

              <div className="mt-1 flex items-center gap-2">
                <span className="font-mono text-xs text-ink-faint">
                  {request.referenceId}
                </span>
                <span className={`text-xs font-medium ${status.text}`}>
                  {status.label}
                </span>
              </div>

              <h1 className="mt-1 text-lg font-semibold text-ink">
                {request.title}
              </h1>
            </div>
          </div>

          {canCreateTicket && request.status === "pending" && (
            <div className="flex shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setApproveOpen(true)}
              >
                <Check size={14} className="mr-1.5" /> Approve
              </Button>
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                <X size={14} className="mr-1.5" /> Reject
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Main column */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <SectionHeading icon={FileText}>Description</SectionHeading>
            <div className="mt-3">
              {request.description ? (
                <div
                  className="ticket-description"
                  dangerouslySetInnerHTML={{
                    __html: renderDescription(request.description),
                  }}
                />
              ) : (
                <p className="text-sm text-ink-faint">
                  No description provided.
                </p>
              )}
            </div>
          </Card>

          {request.attachments.length > 0 && (
            <Card>
              <SectionHeading icon={Paperclip}>
                Attachments · {request.attachments.length}
              </SectionHeading>
              <ul className="mt-3 space-y-2">
                {request.attachments.map((file) => (
                  <li key={file.id}>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 rounded border border-line px-3 py-2 text-sm text-ink transition-colors hover:border-accent-text hover:bg-accent-subtle"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-canvas">
                        <Paperclip size={14} className="text-ink-faint" />
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {file.name}
                      </span>
                      <span className="shrink-0 text-xs text-ink-faint">
                        {formatSize(file.size)}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {request.status === "rejected" && request.remarks && (
            <Card>
              <SectionHeading icon={XCircle}>Rejection reason</SectionHeading>
              <p className="mt-3 rounded border border-danger-subtle bg-danger-subtle px-3 py-2.5 text-sm text-danger">
                {request.remarks}
              </p>
            </Card>
          )}

          {request.status === "approved" && linkedTicket && (
            <Card>
              <SectionHeading icon={TicketIcon}>
                Ticket created from this request
              </SectionHeading>
              <Link
                href={`/dashboard/tickets/${linkedTicket.id}`}
                className="mt-3 flex items-center gap-3 rounded border border-line px-3 py-3 transition-colors hover:border-accent-text hover:bg-accent-subtle"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: linkedTicket.tag.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-ink-faint">
                    {linkedTicket.referenceId}
                  </p>
                  <p className="truncate text-sm font-medium text-ink">
                    {linkedTicket.title}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-ink-faint" />
              </Link>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <SectionHeading icon={Clock}>Activity</SectionHeading>
            <ol className="mt-4">
              {activitySteps.map((step, i) => (
                <TimelineStep
                  key={step.key}
                  icon={step.icon}
                  label={step.label}
                  date={step.date}
                  tone={step.tone}
                  isLast={i === activitySteps.length - 1}
                />
              ))}
            </ol>
          </Card>

          <Card>
            <SectionHeading icon={FileText}>Requested by</SectionHeading>
            <div className="mt-3 flex items-center gap-3">
              <Avatar
                firstName={request.client.firstName}
                lastName={request.client.lastName}
                size="md"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {request.client.firstName} {request.client.lastName}
                </p>
                <p className="truncate text-xs text-ink-faint">
                  {request.client.email}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <TicketFormModal
        open={approveOpen}
        onClose={() => setApproveOpen(false)}
        onSubmit={handleApprove}
        organizations={[organization]}
        currentOrganizationId={organization.id}
        title="Approve request"
        initialValues={{
          title: request.title,
          description: request.description ?? "",
          clientId: String(request.client.id),
        }}
        existingAttachments={request.attachments}
      />

      <RejectRequestModal
        request={rejectOpen ? request : null}
        onClose={() => setRejectOpen(false)}
        onConfirm={handleReject}
      />
    </div>
  );
}
