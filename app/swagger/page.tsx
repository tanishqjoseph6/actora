import Link from "next/link";

export default function SwaggerPage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-16 text-white sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Actora Developers</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Public API v1</h1>
        <p className="mt-4 max-w-2xl text-[#A1A1AA]">Authenticate with a workspace-scoped bearer API key. Secrets are displayed once when created and are never stored in plain text.</p>
        <div className="mt-10 rounded-2xl border border-white/[0.08] bg-[#111111] p-6">
          <h2 className="text-lg font-medium">OpenAPI specification</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-black/40 p-4 text-sm text-[#93C5FD]">{`curl https://useactora.com/api/v1/openapi.json`}</pre>
          <Link className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#2563EB] px-4 text-sm font-medium hover:bg-[#1D4ED8]" href="/api/v1/openapi.json">Open OpenAPI JSON</Link>
        </div>
      </div>
    </main>
  );
}
