"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Can } from "@/components/auth/can";
import { PERMISSIONS } from "@/lib/data/permissions";
import { Button } from "@/components/ui/button";
import TicketFormModal from "./ticket-form-modal";
import { TicketList } from "./ticket-list";
import TicketTagFilter from "./ticket-tag-filter";
import { useAuth } from "@/providers/auth-provider";
import { getOrganizationBySlug } from "@/lib/data/organization-detail";
import type { OrganizationDetail } from "@/lib/types/organization/organization-detail.type";
import type { TicketDetail } from "@/lib/types/ticket/ticket-detail.type";
import type { TagDetail } from "@/lib/types/organization/tag-detail.type";
import type { TicketFormValues } from "@/lib/schemas/ticket.schema";

interface TicketsPageClientProps {
  organization: OrganizationDetail;
}

export default function TicketsPageClient({
  organization,
}: TicketsPageClientProps) {
  const { currentUser } = useAuth();
  const { tags, members } = organization;
  const assignableMembers = members.filter(
    (m) => m.role?.roleName !== "Client",
  );

  const [tickets, setTickets] = useState<TicketDetail[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [tagFilter, setTagFilter] = useState<number | null>(null);

  // Every org the current user belongs to — needed so the create-ticket
  // form can offer switching organizations, not just the one this page
  // happens to be showing.
  const [allOrganizations, setAllOrganizations] = useState<
    OrganizationDetail[]
  >([organization]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;

    Promise.all(
      currentUser.memberships.map((m) =>
        getOrganizationBySlug(m.organization.settings.slug),
      ),
    ).then((results) => {
      if (!cancelled) {
        setAllOrganizations(
          results.filter((o): o is OrganizationDetail => o !== null),
        );
      }
    });

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const filteredTickets =
    tagFilter === null
      ? tickets
      : tickets.filter((t) => t.tag.id === tagFilter);

  function handleCreate(values: TicketFormValues) {
    const targetOrg =
      allOrganizations.find((o) => String(o.id) === values.organizationId) ??
      organization;
    const targetTodoTag =
      targetOrg.tags.find((t) => t.tagName === "To Do") ?? targetOrg.tags[0];
    if (!targetTodoTag) return;

    const newTicket: TicketDetail = {
      id: Date.now(),
      orgId: targetOrg.id,
      title: values.title,
      description: values.description || undefined,
      attachments: values.attachments.map((file, i) => ({
        id: Date.now() + i,
        name: file.name,
        // MOCK: object URLs only last this browser session — real version
        // uploads to storage and stores a persistent URL.
        url: URL.createObjectURL(file),
        size: file.size,
      })),
      tag: targetTodoTag,
      client:
        targetOrg.members.find((m) => String(m.id) === values.clientId) ?? null,
      assignees: targetOrg.members.filter((m) =>
        values.assigneeIds.includes(m.id),
      ),
      startDate: values.startDate || null,
      dueDate: values.dueDate || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (targetOrg.id === organization.id) {
      setTickets((prev) => [newTicket, ...prev]);
    }
    // TODO: POST /organizations/:orgId/tickets in the background, regardless
    // of which org was targeted. This page's local `tickets` state only
    // mirrors the CURRENT org, so a ticket created for a different org
    // won't visibly appear here — it'll show once the user navigates to
    // that org's own Tickets page.
  }

  function handleChangeTag(ticketId: number, tag: TagDetail) {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, tag } : t)),
    );
    // TODO: PATCH /tickets/:id { tag_id: tag.id }
  }

  function handleAssign(ticketId: number, memberIds: number[]) {
    setTickets((prev) =>
      prev.map((t) =>
        t.id === ticketId
          ? { ...t, assignees: members.filter((m) => memberIds.includes(m.id)) }
          : t,
      ),
    );
    // TODO: PATCH /tickets/:id { assignee_ids: memberIds }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Tickets</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Every ticket in {organization.organizationName}.
          </p>
        </div>
        <Can action={PERMISSIONS.TICKET_CREATE}>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} className="mr-1.5" /> Create ticket
          </Button>
        </Can>
      </div>

      <div className="mt-6 rounded border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-sm font-medium text-ink">Tickets</h2>
          <TicketTagFilter
            tags={tags}
            value={tagFilter}
            onChange={setTagFilter}
          />
        </div>
        <TicketList
          tickets={filteredTickets}
          availableTags={tags}
          assignableMembers={assignableMembers}
          onChangeTag={handleChangeTag}
          onAssign={handleAssign}
        />
      </div>

      <TicketFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
        organizations={allOrganizations}
        currentOrganizationId={organization.id}
      />
    </div>
  );
}
