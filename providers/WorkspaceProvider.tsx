"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import type {
  WorkspacePermission,
  WorkspaceRole,
  WorkspaceSummary,
} from "@/lib/workspace/types";
import { ROLE_PERMISSIONS } from "@/lib/workspace/permissions";

export type ActiveWorkspaceClient = {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  icon: string;
  planId: string;
  role: WorkspaceRole;
  permissions: WorkspacePermission[];
  ownerUserId: string;
  createdAt: string;
};

type WorkspaceContextValue = {
  workspaces: WorkspaceSummary[];
  active: ActiveWorkspaceClient | null;
  loading: boolean;
  switching: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  switchWorkspace: (workspaceId: string) => Promise<boolean>;
  createWorkspace: (input: {
    name: string;
    icon?: string;
  }) => Promise<ActiveWorkspaceClient | null>;
  hasPermission: (permission: WorkspacePermission) => boolean;
  rolePermissions: typeof ROLE_PERMISSIONS;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [active, setActive] = useState<ActiveWorkspaceClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [switching, startSwitch] = useTransition();

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/workspaces", { credentials: "include" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Failed to load workspaces.");
      }
      const data = (await res.json()) as {
        workspaces: WorkspaceSummary[];
        active: ActiveWorkspaceClient | null;
        schemaPending?: boolean;
      };
      setWorkspaces(data.workspaces ?? []);
      setActive(data.active ?? null);
      setError(
        data.schemaPending
          ? "Workspace tables are not migrated yet. Apply supabase/migrations/020_workspaces.sql."
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load workspaces.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);

  const switchWorkspace = useCallback(
    async (workspaceId: string) => {
      if (active?.id === workspaceId) return true;
      let ok = false;
      startSwitch(() => {
        // transition marker
      });
      try {
        const res = await fetch("/api/workspaces/switch", {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ workspaceId }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error ?? "Switch failed.");
        }
        const data = (await res.json()) as { active: ActiveWorkspaceClient };
        setActive(data.active);
        setWorkspaces((prev) =>
          prev.map((w) =>
            w.id === data.active.id
              ? { ...w, role: data.active.role, planId: data.active.planId }
              : w
          )
        );
        ok = true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Switch failed.");
        ok = false;
      }
      return ok;
    },
    [active?.id]
  );

  const createWorkspaceFn = useCallback(
    async (input: { name: string; icon?: string }) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? "Create failed.");
      }
      const data = (await res.json()) as {
        workspace: {
          id: string;
          name: string;
          slug: string;
          logo_url: string | null;
          icon: string;
          plan_id: string;
          owner_user_id: string;
          created_at: string;
        };
      };
      await switchWorkspace(data.workspace.id);
      await refresh();
      return {
        id: data.workspace.id,
        name: data.workspace.name,
        slug: data.workspace.slug,
        logoUrl: data.workspace.logo_url,
        icon: data.workspace.icon,
        planId: data.workspace.plan_id,
        role: "owner" as const,
        permissions: [...ROLE_PERMISSIONS.owner],
        ownerUserId: data.workspace.owner_user_id,
        createdAt: data.workspace.created_at,
      };
    },
    [refresh, switchWorkspace]
  );

  const hasPermission = useCallback(
    (permission: WorkspacePermission) => {
      if (!active) return false;
      return active.permissions.includes(permission);
    },
    [active]
  );

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      workspaces,
      active,
      loading,
      switching,
      error,
      refresh,
      switchWorkspace,
      createWorkspace: createWorkspaceFn,
      hasPermission,
      rolePermissions: ROLE_PERMISSIONS,
    }),
    [
      workspaces,
      active,
      loading,
      switching,
      error,
      refresh,
      switchWorkspace,
      createWorkspaceFn,
      hasPermission,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }
  return ctx;
}

export function useWorkspaceOptional() {
  return useContext(WorkspaceContext);
}
