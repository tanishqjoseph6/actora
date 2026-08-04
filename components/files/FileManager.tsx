"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Download, File, FileImage, FolderOpen, Search, Trash2, UploadCloud } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { dashboard } from "@/components/dashboard/premium/dashboard-tokens";
import { formatBytes } from "@/lib/storage/limits";

type WorkspaceFile = {
  id: string;
  name: string;
  folder_path: string;
  mime_type: string;
  size_bytes: number;
  status: string;
  created_at: string;
};

type Usage = { usedBytes: number; reservedBytes: number; fileCount: number; limitBytes: number };

export function FileManager() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [search, setSearch] = useState("");
  const [folder, setFolder] = useState("/");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ folder });
      if (search) query.set("search", search);
      const response = await fetch(`/api/files?${query}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Could not load files.");
      setFiles(body.files ?? []);
      setUsage(body.usage ?? null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not load files.");
    } finally {
      setLoading(false);
    }
  }, [folder, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadFiles(), 150);
    return () => window.clearTimeout(timer);
  }, [loadFiles]);

  const usagePercent = useMemo(() => {
    if (!usage || !Number.isFinite(usage.limitBytes) || usage.limitBytes <= 0) return 0;
    return Math.min(100, ((usage.usedBytes + usage.reservedBytes) / usage.limitBytes) * 100);
  }, [usage]);
  const isFull = usagePercent >= 100;

  async function uploadFiles(selected: FileList | File[]) {
    const items = Array.from(selected);
    if (!items.length || isFull) return;
    setUploading(true);
    setMessage("");
    try {
      const client = getSupabaseBrowserClient();
      for (const file of items) {
        const initResponse = await fetch("/api/files/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: file.name, mimeType: file.type, sizeBytes: file.size, folderPath: folder }),
        });
        const init = await initResponse.json();
        if (!initResponse.ok) throw new Error(init.error ?? "Could not initialize upload.");
        const upload = await client.storage.from("workspace-files").uploadToSignedUrl(init.path, init.token, file);
        if (upload.error) throw new Error(upload.error.message);
        const finalizeResponse = await fetch("/api/files/finalize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileId: init.id, actualSize: file.size }),
        });
        const finalized = await finalizeResponse.json();
        if (!finalizeResponse.ok) throw new Error(finalized.error ?? "Could not finalize upload.");
      }
      await loadFiles();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed. Please retry.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function downloadFile(file: WorkspaceFile) {
    const response = await fetch(`/api/files/${file.id}`);
    const body = await response.json();
    if (response.ok && body.url) window.open(body.url, "_blank", "noopener,noreferrer");
    else setMessage(body.error ?? "Could not create download link.");
  }

  async function deleteFile(file: WorkspaceFile) {
    if (!window.confirm(`Delete ${file.name}?`)) return;
    const response = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json();
      setMessage(body.error ?? "Could not delete file.");
      return;
    }
    await loadFiles();
  }

  return (
    <div className="space-y-5">
      <div className={`${dashboard.cardLg} p-5 sm:p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Workspace storage</p>
            <h1 className={`${dashboard.pageTitle} mt-2`}>Files</h1>
            <p className={`mt-2 ${dashboard.pageSubtitle}`}>Secure files for your workspace, with private signed downloads.</p>
          </div>
          <button type="button" disabled={uploading || isFull} onClick={() => inputRef.current?.click()} className={`${dashboard.btnPrimary} min-h-11 gap-2 px-4 text-sm disabled:cursor-not-allowed disabled:opacity-50`}>
            <UploadCloud className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload files"}
          </button>
          <input ref={inputRef} type="file" multiple className="hidden" onChange={(event) => event.target.files && void uploadFiles(event.target.files)} />
        </div>
        {usage && (
          <div className="mt-6">
            <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="text-white">Storage</span><span className={dashboard.muted}>{formatBytes(usage.usedBytes)} / {formatBytes(usage.limitBytes)}</span></div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/[0.08]"><div className={`h-full rounded-full transition-all ${usagePercent >= 80 ? "bg-amber-400" : "bg-gradient-to-r from-[#2563EB] to-[#60A5FA]"}`} style={{ width: `${usagePercent}%` }} /></div>
            <p className="mt-2 text-xs text-[#71717A]">{formatBytes(Math.max(0, usage.limitBytes - usage.usedBytes - usage.reservedBytes))} remaining · {usagePercent.toFixed(0)}% used</p>
          </div>
        )}
      </div>

      {usagePercent >= 80 && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-amber-100">{isFull ? "Storage is full. Upgrade your plan to upload more files." : "You are using more than 80% of your storage."}</p>
          <a href="/billing#pricing" className="text-sm font-medium text-amber-200 underline underline-offset-4">View upgrade options</a>
        </div>
      )}
      {message && <p role="alert" className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{message}</p>}

      <div className={`${dashboard.cardLg} overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="flex items-center gap-2 text-sm text-[#A1A1AA]"><FolderOpen className="h-4 w-4 text-[#3B82F6]" /><button type="button" onClick={() => setFolder("/")} className="hover:text-white">All files</button>{folder !== "/" && <span>/ {folder}</span>}</div>
          <label className="flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-[#0A0A0A] px-3"><Search className="h-4 w-4 text-[#71717A]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search files" className="w-full bg-transparent text-sm text-white outline-none placeholder:text-[#71717A]" /></label>
        </div>
        <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); void uploadFiles(event.dataTransfer.files); }} className="p-4 sm:p-5">
          <div className="mb-4 rounded-xl border border-dashed border-white/[0.12] bg-white/[0.015] p-5 text-center text-sm text-[#71717A]">Drop files here to upload, or use the Upload files button.</div>
          {loading ? <p className="py-10 text-center text-sm text-[#71717A]">Loading files…</p> : files.length === 0 ? <p className="py-10 text-center text-sm text-[#71717A]">No files in this folder yet.</p> : <div className="divide-y divide-white/[0.06]">{files.map((file) => <div key={file.id} className="flex items-center gap-3 py-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#3B82F6]/10 text-[#60A5FA]">{file.mime_type.startsWith("image/") ? <FileImage className="h-5 w-5" /> : <File className="h-5 w-5" />}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="text-xs text-[#71717A]">{formatBytes(file.size_bytes)} · {file.status}</p></div><button type="button" onClick={() => void downloadFile(file)} className="rounded-lg p-2 text-[#71717A] hover:bg-white/[0.05] hover:text-white" aria-label={`Download ${file.name}`}><Download className="h-4 w-4" /></button><button type="button" onClick={() => void deleteFile(file)} className="rounded-lg p-2 text-[#71717A] hover:bg-red-400/10 hover:text-red-200" aria-label={`Delete ${file.name}`}><Trash2 className="h-4 w-4" /></button></div>)}</div>}
        </div>
      </div>
    </div>
  );
}
