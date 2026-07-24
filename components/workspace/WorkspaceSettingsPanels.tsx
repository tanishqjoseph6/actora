"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Trash2, UserPlus } from "lucide-react";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { useWorkspace } from "@/providers/WorkspaceProvider";
import { WORKSPACE_ICONS } from "@/lib/workspace/types";
import { ROLE_PERMISSIONS } from "@/lib/workspace/permissions";
import type {
  WorkspaceInvitationRecord,
  WorkspaceMemberRecord,
  WorkspaceRole,
} from "@/lib/workspace/types";
import { AiCreditsCard } from "@/components/subscription/AiCreditsCard";
import { usePlanGate } from "@/components/subscription/PlanGateProvider";
import { ProductionAlert } from "@/components/ui/ProductionAlert";
import { SkeletonListRows } from "@/components/ui/Skeleton";
import { friendlyError, friendlyErrorMessage } from "@/lib/errors/friendly";
import Link from "next/link";

const ROLE_OPTIONS: { value: WorkspaceRole; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
  { value: "viewer", label: "Viewer" },
];

export function WorkspaceGeneralSection() {
  const { active, hasPermission, refresh } = useWorkspace();
  const [name, setName] = useState(active?.name ?? "");
  const [icon, setIcon] = useState(active?.icon ?? "spark");
  const [logoUrl, setLogoUrl] = useState<string | null>(active?.logoUrl ?? null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setName(active?.name ?? "");
    setIcon(active?.icon ?? "spark");
    setLogoUrl(active?.logoUrl ?? null);
  }, [active]);

  if (!active) return null;
  const canEdit = hasPermission("settings");

  async function save() {
    if (!canEdit) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/workspaces/${active!.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon, logoUrl }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed.");
      await refresh();
      setMessage("Workspace updated.");
    } catch (err) {
      setMessage(friendlyErrorMessage(err, "workspace"));
    } finally {
      setSaving(false);
    }
  }

  function onLogoFile(file: File | null) {
    if (!file || !canEdit) return;
    if (file.size > 400_000) {
      setMessage("Logo must be under 400KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-[auto_1fr] gap-4 items-start">
        <div className="flex flex-col items-center gap-2">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="h-16 w-16 rounded-xl object-cover border border-white/[0.08]"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-xl text-[#93C5FD]">
              {name.charAt(0).toUpperCase() || "W"}
            </div>
          )}
          {canEdit && (
            <label className="cursor-pointer text-xs text-[#60A5FA] hover:underline">
              Upload logo
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => onLogoFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
        <div className="space-y-4">
          <label className="block">
            <span className={`text-xs ${dashboard.subtle}`}>Name</span>
            <input
              value={name}
              disabled={!canEdit}
              onChange={(e) => setName(e.target.value)}
              className={`mt-1 w-full rounded-xl border ${dashboard.border} bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50 disabled:opacity-60`}
            />
          </label>
          <div>
            <p className={`text-xs ${dashboard.subtle} mb-2`}>Icon</p>
            <div className="flex flex-wrap gap-2">
              {WORKSPACE_ICONS.map((id) => (
                <button
                  key={id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => setIcon(id)}
                  className={`rounded-lg border px-2.5 py-1.5 text-xs capitalize transition ${
                    icon === id
                      ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-white"
                      : "border-white/[0.08] text-[#A1A1AA] hover:text-white"
                  } disabled:opacity-50`}
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className={dashboard.subtle}>Slug</dt>
              <dd className="text-white mt-0.5 font-mono">{active.slug}</dd>
            </div>
            <div>
              <dt className={dashboard.subtle}>Created</dt>
              <dd className="text-white mt-0.5">
                {new Date(active.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className={dashboard.subtle}>Plan</dt>
              <dd className="text-white mt-0.5 capitalize">{active.planId}</dd>
            </div>
            <div>
              <dt className={dashboard.subtle}>Your role</dt>
              <dd className="text-white mt-0.5 capitalize">{active.role}</dd>
            </div>
          </dl>
        </div>
      </div>
      {canEdit && (
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className={`${dashboard.btnPrimary} px-4 py-2 text-sm inline-flex items-center gap-2`}
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Save changes
        </button>
      )}
      {message && <p className={`text-xs ${dashboard.subtle}`}>{message}</p>}
    </div>
  );
}

export function WorkspaceMembersSection() {
  const { active, hasPermission, refresh } = useWorkspace();
  const [members, setMembers] = useState<WorkspaceMemberRecord[]>([]);
  const [invites, setInvites] = useState<WorkspaceInvitationRecord[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<WorkspaceRole>("member");
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canManage = hasPermission("members");

  const load = useCallback(async () => {
    if (!active) return;
    setLoading(true);
    try {
      const [mRes, iRes] = await Promise.all([
        fetch(`/api/workspaces/${active.id}/members`, { credentials: "include" }),
        canManage
          ? fetch(`/api/workspaces/${active.id}/invitations`, {
              credentials: "include",
            })
          : Promise.resolve(null),
      ]);
      const mData = (await mRes.json()) as {
        members?: WorkspaceMemberRecord[];
        error?: string;
      };
      if (!mRes.ok) throw new Error(mData.error ?? "Failed to load members.");
      setMembers(mData.members ?? []);
      if (iRes) {
        const iData = (await iRes.json()) as {
          invitations?: WorkspaceInvitationRecord[];
        };
        setInvites(iData.invitations ?? []);
      }
      setError(null);
    } catch (err) {
      setError(friendlyErrorMessage(err, "workspace"));
    } finally {
      setLoading(false);
    }
  }, [active, canManage]);

  useEffect(() => {
    void load();
  }, [load]);

  // Accept invite from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("invite");
    if (!token) return;
    void (async () => {
      const res = await fetch("/api/workspaces/invitations/accept", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        await refresh();
        await load();
        window.history.replaceState({}, "", "/dashboard/settings#workspace-members");
      }
    })();
  }, [load, refresh]);

  async function invite() {
    if (!active || !canManage) return;
    setError(null);
    const res = await fetch(`/api/workspaces/${active.id}/invitations`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role }),
    });
    const data = (await res.json()) as {
      error?: string;
      inviteUrl?: string;
    };
    if (!res.ok) {
      setError(friendlyErrorMessage(data.error ?? "Invite failed.", "workspace"));
      return;
    }
    setInviteUrl(data.inviteUrl ?? null);
    setEmail("");
    await load();
  }

  if (!active) return null;

  return (
    <div className="space-y-5">
      {canManage && (
        <div className={`rounded-xl border ${dashboard.border} ${dashboard.surface} p-4`}>
          <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-[#60A5FA]" />
            Invite by email
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className={`flex-1 rounded-xl border ${dashboard.border} bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-[#3B82F6]/50`}
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as WorkspaceRole)}
              className={`rounded-xl border ${dashboard.border} bg-black/30 px-3 py-2 text-sm text-white`}
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void invite()}
              className={`${dashboard.btnPrimary} px-4 py-2 text-sm`}
            >
              Send invite
            </button>
          </div>
          {inviteUrl && (
            <button
              type="button"
              className="mt-3 flex items-center gap-2 text-xs text-[#60A5FA]"
              onClick={() => void navigator.clipboard.writeText(inviteUrl)}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy invite link
            </button>
          )}
        </div>
      )}

      {loading ? (
        <SkeletonListRows rows={4} className="rounded-xl border border-white/[0.06] bg-[#111111] p-4" />
      ) : members.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#111111] px-4 py-10 text-center">
          <UserPlus className="mx-auto h-5 w-5 text-[#52525B]" />
          <p className="mt-2 text-sm text-white">No members yet</p>
          <p className={`mt-1 text-xs ${dashboard.subtle}`}>
            Invite teammates to collaborate in this workspace.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {members.map((m) => (
            <li
              key={m.id}
              className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border ${dashboard.border} ${dashboard.surface} px-3 py-2.5`}
            >
              <div>
                <p className="text-sm text-white">{m.user_id}</p>
                <p className={`text-xs ${dashboard.subtle} capitalize`}>
                  {m.role_id} · joined {new Date(m.joined_at).toLocaleDateString()}
                </p>
              </div>
              {canManage && m.role_id !== "owner" && (
                <div className="flex items-center gap-2">
                  <select
                    value={m.role_id}
                    onChange={async (e) => {
                      await fetch(`/api/workspaces/${active.id}/members`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: m.user_id,
                          role: e.target.value,
                          action: "update_role",
                        }),
                      });
                      await load();
                    }}
                    className={`rounded-lg border ${dashboard.border} bg-black/30 px-2 py-1 text-xs text-white`}
                  >
                    {ROLE_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="rounded-lg border border-red-500/30 p-1.5 text-red-300 hover:bg-red-500/10"
                    aria-label="Remove member"
                    onClick={async () => {
                      await fetch(`/api/workspaces/${active.id}/members`, {
                        method: "PATCH",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          userId: m.user_id,
                          action: "remove",
                        }),
                      });
                      await load();
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {canManage && invites.length > 0 && (
        <div>
          <p className="text-sm font-medium text-white mb-2">Invitations</p>
          <ul className="space-y-2">
            {invites.map((inv) => (
              <li
                key={inv.id}
                className={`flex items-center justify-between gap-3 rounded-xl border ${dashboard.border} px-3 py-2 text-sm`}
              >
                <div>
                  <p className="text-white">{inv.email}</p>
                  <p className={`text-xs ${dashboard.subtle} capitalize`}>
                    {inv.role_id} · {inv.status}
                  </p>
                </div>
                {inv.status === "pending" && (
                  <button
                    type="button"
                    className="text-xs text-red-300 hover:underline"
                    onClick={async () => {
                      await fetch(
                        `/api/workspaces/${active.id}/invitations?invitationId=${inv.id}`,
                        { method: "DELETE", credentials: "include" }
                      );
                      await load();
                    }}
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      {error && (
        <ProductionAlert
          variant="error"
          title={friendlyError(error, "workspace").title}
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
}

export function WorkspacePermissionsSection() {
  const { active } = useWorkspace();
  const roles: WorkspaceRole[] = ["owner", "admin", "member", "viewer"];

  return (
    <div className="overflow-x-auto">
      <p className={`text-sm ${dashboard.subtle} mb-4`}>
        Permissions are enforced on the server for every request. Your role:{" "}
        <span className="text-white capitalize">{active?.role ?? "—"}</span>
      </p>
      <table className="w-full min-w-[640px] text-left text-xs">
        <thead>
          <tr className="border-b border-white/[0.06] text-[#71717A]">
            <th className="py-2 pr-3 font-medium">Permission</th>
            {roles.map((r) => (
              <th key={r} className="py-2 px-2 font-medium capitalize">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {(
            [
              "billing",
              "analytics",
              "crm",
              "inbox",
              "calendar",
              "tasks",
              "automations",
              "roxx_ai",
              "settings",
              "members",
              "credits",
            ] as const
          ).map((perm) => (
            <tr key={perm} className="border-b border-white/[0.04]">
              <td className="py-2.5 pr-3 text-white capitalize">
                {perm.replace("_", " ")}
              </td>
              {roles.map((r) => {
                const allowed = ROLE_PERMISSIONS[r].includes(perm);
                return (
                  <td key={r} className="py-2.5 px-2">
                    <span
                      className={
                        allowed ? "text-emerald-400" : "text-[#52525B]"
                      }
                    >
                      {allowed ? "✓" : "—"}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function WorkspaceBillingSection() {
  const { hasPermission } = useWorkspace();
  if (!hasPermission("billing")) {
    return (
      <p className={`text-sm ${dashboard.subtle}`}>
        Only the workspace owner can manage billing.
      </p>
    );
  }
  return (
    <div className={`rounded-xl border ${dashboard.border} ${dashboard.surface} p-4 space-y-3`}>
      <p className="text-sm text-white">
        Subscription, credit packs, payment history, and invoices are managed at
        the workspace level.
      </p>
      <Link
        href="/dashboard/billing"
        className={`${dashboard.btnPrimary} inline-flex px-4 py-2 text-sm`}
      >
        Open billing
      </Link>
    </div>
  );
}

export function WorkspaceCreditsSection() {
  const { subscription, loading } = usePlanGate();
  const { hasPermission } = useWorkspace();
  return (
    <div className="space-y-4">
      <AiCreditsCard subscription={subscription} loading={loading} detailed />
      {hasPermission("credits") ? (
        <Link
          href="/dashboard/billing#buy-credits"
          className="text-sm text-[#60A5FA] hover:underline"
        >
          Purchase credit packs →
        </Link>
      ) : (
        <p className={`text-xs ${dashboard.subtle}`}>
          Only owners and admins can purchase additional credits. All members
          consume from this workspace pool.
        </p>
      )}
    </div>
  );
}

export function WorkspaceDangerZone() {
  const { active, hasPermission, workspaces, switchWorkspace, refresh } =
    useWorkspace();
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!active) return null;
  const isOwner = active.role === "owner";

  async function deleteWorkspace() {
    if (!active || !isOwner) return;
    if (confirm !== active.name) {
      setError("Type the workspace name to confirm.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/workspaces/${active.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Delete failed.");
      const next = workspaces.find((w) => w.id !== active.id);
      if (next) await switchWorkspace(next.id);
      await refresh();
    } catch (err) {
      setError(friendlyErrorMessage(err, "workspace"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {!isOwner ? (
        <p className={`text-sm ${dashboard.subtle}`}>
          Only the workspace owner can delete this workspace.
        </p>
      ) : (
        <>
          <p className="text-sm text-red-200/90">
            Deleting <span className="font-medium text-white">{active.name}</span>{" "}
            soft-deletes the workspace. Members lose access immediately.
          </p>
          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder={`Type “${active.name}” to confirm`}
            className={`w-full rounded-xl border border-red-500/30 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-red-400/50`}
          />
          <button
            type="button"
            disabled={busy || !hasPermission("settings")}
            onClick={() => void deleteWorkspace()}
            className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-200 hover:bg-red-500/20 disabled:opacity-50"
          >
            {busy ? "Deleting…" : "Delete workspace"}
          </button>
        </>
      )}
      {error && (
        <ProductionAlert
          variant="error"
          title={friendlyError(error, "workspace").title}
          message={error}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
}

export function WorkspaceActivitySection() {
  const { active, hasPermission } = useWorkspace();
  const [rows, setRows] = useState<
    { id: string; action: string; actor_user_id: string | null; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!active || (!hasPermission("settings") && !hasPermission("members"))) return;
    void (async () => {
      const res = await fetch(`/api/workspaces/${active.id}/activity`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as {
        activity?: {
          id: string;
          action: string;
          actor_user_id: string | null;
          created_at: string;
        }[];
      };
      setRows(data.activity ?? []);
    })();
  }, [active, hasPermission]);

  if (!active) return null;
  if (!hasPermission("settings") && !hasPermission("members")) {
    return (
      <p className={`text-sm ${dashboard.subtle}`}>
        Audit log is available to owners and admins.
      </p>
    );
  }

  return (
    <ul className="space-y-2 max-h-72 overflow-y-auto premium-scrollbar">
      {rows.length === 0 ? (
        <li className={`text-sm ${dashboard.subtle}`}>No activity yet.</li>
      ) : (
        rows.map((r) => (
          <li
            key={r.id}
            className={`rounded-lg border ${dashboard.border} px-3 py-2 text-xs`}
          >
            <p className="text-white">{r.action}</p>
            <p className={dashboard.subtle}>
              {r.actor_user_id ?? "system"} ·{" "}
              {new Date(r.created_at).toLocaleString()}
            </p>
          </li>
        ))
      )}
    </ul>
  );
}
