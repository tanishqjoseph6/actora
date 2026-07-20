"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import {
  filterAndSortContacts,
  type CrmContact,
  type CrmContactSort,
  type CrmContactStatus,
} from "@/lib/crm/live";
import { ContactListItem } from "@/components/crm/ContactListItem";
import { CrmSearchInput } from "@/components/crm/CrmSearchInput";
import { CrmSelectFilter } from "@/components/crm/CrmSelectFilter";

const COLUMNS: { id: CrmContactStatus; label: string }[] = [
  { id: "lead", label: "Leads" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
];

export function PipelineBoard() {
  const sensors = useSensors(useSensor(PointerSensor));
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [sort, setSort] = useState<CrmContactSort>("score-desc");

  useEffect(() => {
    void refresh();
  }, []);

  async function refresh() {
    const res = await fetch("/api/crm/contacts");
    const json = (await res.json()) as { contacts?: CrmContact[] };
    setContacts(json.contacts ?? []);
  }

  const companies = useMemo(
    () => Array.from(new Set(contacts.map((c) => c.companyName).filter(Boolean))).sort(),
    [contacts]
  );

  const visible = useMemo(
    () =>
      filterAndSortContacts(contacts, {
        search,
        status: "all",
        company,
        sort,
      }),
    [contacts, search, company, sort]
  );

  const byStatus = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => ({
          ...acc,
          [col.id]: visible.filter((c) => c.status === col.id),
        }),
        {} as Record<CrmContactStatus, CrmContact[]>
      ),
    [visible]
  );

  async function moveContact(contactId: string, status: CrmContactStatus) {
    await fetch(`/api/crm/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, status } : c))
    );
  }

  async function handleDelete(contact: { id: string; name: string }) {
    const confirmed = window.confirm(`Delete ${contact.name}?`);
    if (!confirmed) return;
    await fetch(`/api/crm/contacts/${contact.id}`, { method: "DELETE" });
    await refresh();
  }

  function handleDragEnd(event: DragEndEvent) {
    const id = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;
    const status = COLUMNS.find((c) => c.id === overId)?.id;
    if (!status) return;
    void moveContact(id, status);
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        <CrmSearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search contacts in pipeline..."
        />
        <CrmSelectFilter
          label="Company"
          value={company}
          onChange={setCompany}
          options={[
            { value: "all", label: "All companies" },
            ...companies.map((name) => ({ value: name, label: name })),
          ]}
        />
        <CrmSelectFilter
          label="Sort"
          value={sort}
          onChange={(v) => setSort(v as CrmContactSort)}
          options={[
            { value: "score-desc", label: "AI score" },
            { value: "name-asc", label: "Name A -> Z" },
            { value: "newest", label: "Newest" },
          ]}
        />
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.label}
              contacts={byStatus[col.id] ?? []}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  contacts,
  onDelete,
}: {
  id: CrmContactStatus;
  title: string;
  contacts: CrmContact[];
  onDelete: (contact: { id: string; name: string }) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`${dashboard.cardBase} p-3 ${isOver ? "ring-1 ring-[#2563EB]/50" : ""}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-[#71717A] tabular-nums">{contacts.length}</span>
      </div>
      <div className="space-y-2 min-h-[140px]">
        {contacts.map((c) => (
          <DraggableContact key={c.id} contact={c}>
            <ContactListItem contact={c} compact onDelete={onDelete} />
          </DraggableContact>
        ))}
        {contacts.length === 0 && (
          <p className="text-xs text-[#71717A] p-3 border border-dashed border-white/[0.06] rounded-lg">
            Drag contacts here
          </p>
        )}
      </div>
    </div>
  );
}

function DraggableContact({
  contact,
  children,
}: {
  contact: CrmContact;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: contact.id,
  });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children}
    </div>
  );
}
