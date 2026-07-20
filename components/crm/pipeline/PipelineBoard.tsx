"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
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

const COLUMNS: {
  id: CrmContactStatus;
  label: string;
  dot: string;
  accent: string;
}[] = [
  { id: "lead", label: "Leads", dot: "bg-[#71717A]", accent: "text-[#A1A1AA]" },
  { id: "active", label: "Active", dot: "bg-[#3B82F6]", accent: "text-[#3B82F6]" },
  { id: "inactive", label: "Inactive", dot: "bg-[#475569]", accent: "text-[#71717A]" },
];

export function PipelineBoard() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [search, setSearch] = useState("");
  const [company, setCompany] = useState("all");
  const [sort, setSort] = useState<CrmContactSort>("score-desc");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);

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

  function handleDragStart(event: DragStartEvent) {
    setActiveContactId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveContactId(null);
    const id = event.active.id as string;
    const overId = event.over?.id as string | undefined;
    if (!overId) return;
    const status = COLUMNS.find((c) => c.id === overId)?.id;
    if (!status) return;
    void moveContact(id, status);
  }

  const activeContact = activeContactId
    ? contacts.find((c) => c.id === activeContactId)
    : null;

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

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory premium-scrollbar lg:grid lg:grid-cols-3 lg:overflow-visible">
          {COLUMNS.map((col, i) => (
            <KanbanColumn
              key={col.id}
              id={col.id}
              title={col.label}
              dot={col.dot}
              accent={col.accent}
              contacts={byStatus[col.id] ?? []}
              onDelete={handleDelete}
              index={i}
            />
          ))}
        </div>

        <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0, 0, 1)" }}>
          {activeContact ? (
            <div className="rotate-[1.5deg] shadow-xl shadow-black/40 cursor-grabbing">
              <ContactListItem contact={activeContact} compact />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  id,
  title,
  dot,
  accent,
  contacts,
  onDelete,
  index,
}: {
  id: CrmContactStatus;
  title: string;
  dot: string;
  accent: string;
  contacts: CrmContact[];
  onDelete: (contact: { id: string; name: string }) => void;
  index: number;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex flex-col w-[min(72vw,280px)] lg:w-auto shrink-0 snap-start"
    >
      <div className={`${dashboard.cardBase} mb-3 px-3 py-2.5`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
            <h3 className="text-sm font-semibold text-white truncate">{title}</h3>
            <span className="text-xs text-[#71717A] tabular-nums shrink-0 px-1.5 py-0.5 rounded-md bg-[#0A0A0A] border border-white/[0.06]">
              {contacts.length}
            </span>
          </div>
          <span className={`text-xs font-medium tabular-nums shrink-0 ${accent}`}>
            {contacts.length > 0
              ? Math.round(
                  contacts.reduce((sum, c) => sum + c.aiLeadScore, 0) / contacts.length
                )
              : "—"}
            {contacts.length > 0 && <span className="text-[#71717A] font-normal ml-0.5">avg</span>}
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 min-h-[200px] rounded-[18px] p-2 space-y-2 transition-all duration-200
          bg-[#0A0A0A]/50 border border-white/[0.06]
          ${isOver ? "border-[#3B82F6]/50 bg-[#3B82F6]/5 ring-1 ring-[#2563EB]/20" : ""}
        `}
      >
        {contacts.map((c) => (
          <DraggableContact key={c.id} contact={c}>
            <ContactListItem contact={c} compact onDelete={onDelete} />
          </DraggableContact>
        ))}
        {contacts.length === 0 && (
          <div
            className={`
              flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl
              border border-dashed transition-colors duration-200
              ${isOver ? "border-[#3B82F6]/50 bg-[#3B82F6]/5" : "border-white/[0.06]"}
            `}
          >
            <p className={`text-xs ${isOver ? "text-[#93C5FD]" : dashboard.subtle}`}>
              {isOver ? "Drop contact here" : "Drag contacts here"}
            </p>
          </div>
        )}
      </div>
    </motion.div>
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
    opacity: isDragging ? 0.35 : 1,
    transition: isDragging ? undefined : "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging ? "cursor-grabbing" : "cursor-grab"} touch-none`}
    >
      {children}
    </div>
  );
}
