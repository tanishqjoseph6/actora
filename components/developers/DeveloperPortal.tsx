"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen, Bot, Code2, ExternalLink, Gauge, KeyRound, Play, Webhook, type LucideIcon } from "lucide-react";

const sections: Array<[string, string, LucideIcon]> = [
  ["overview", "Overview", BookOpen],
  ["authentication", "Authentication", KeyRound],
  ["reference", "REST API Reference", Code2],
  ["roxx", "Roxx AI API", Bot],
  ["webhooks", "Webhooks", Webhook],
  ["sdk", "SDK Examples", Code2],
  ["playground", "API Playground", Play],
  ["limits", "Rate Limits", Gauge],
];

const examples = {
  JavaScript: `const response = await fetch("https://useactora.com/api/v1/tasks", {
  headers: { Authorization: \`Bearer \${process.env.ACTORA_API_KEY}\` }
});
const { data } = await response.json();`,
  TypeScript: `import { Actora } from "@actora/sdk";
const actora = new Actora({ apiKey: process.env.ACTORA_API_KEY });
const tasks = await actora.tasks.list({ limit: 20 });`,
  Python: `from actora import Actora
client = Actora(api_key=os.environ["ACTORA_API_KEY"])
tasks = client.tasks.list(limit=20)`,
  Go: `client := actora.NewClient(os.Getenv("ACTORA_API_KEY"))
tasks, err := client.Tasks.List(ctx, &actora.ListOptions{Limit: 20})`,
  cURL: `curl https://useactora.com/api/v1/tasks \\
  -H "Authorization: Bearer $ACTORA_API_KEY"`,
};

export function DeveloperPortal({ docsOnly = false }: { docsOnly?: boolean }) {
  const [language, setLanguage] = useState<keyof typeof examples>("JavaScript");
  const [endpoint, setEndpoint] = useState("/api/v1/tasks");
  const [apiKey, setApiKey] = useState("");
  const [result, setResult] = useState("");
  const [running, setRunning] = useState(false);

  async function runPlayground() {
    setRunning(true);
    try {
      const response = await fetch(endpoint, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
      });
      setResult(JSON.stringify(await response.json(), null, 2));
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] pb-24 pt-28 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#3B82F6]">Actora platform</p>
            <nav className="space-y-1" aria-label="Developer portal sections">
              {sections.map(([id, label, Icon]) => (
                <a key={String(id)} href={`#${id}`} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#A1A1AA] transition hover:bg-white/[0.05] hover:text-white">
                  <Icon className="h-4 w-4" /> {label}
                </a>
              ))}
              <Link href="/swagger" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-[#A1A1AA] transition hover:bg-white/[0.05] hover:text-white">
                <ExternalLink className="h-4 w-4" /> OpenAPI / Swagger
              </Link>
            </nav>
          </div>
        </aside>

        <div className="min-w-0">
          <section id="overview" className="scroll-mt-28 border-b border-white/[0.06] pb-14">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#60A5FA]">Actora Developers</p>
            <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">Build on the operating system for modern work.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#A1A1AA]">Connect your apps to Tasks, CRM, Calendar, Inbox, and Roxx AI with a secure, workspace-scoped REST API.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#authentication" className="rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-medium hover:bg-[#1D4ED8]">Read the docs</a>
              <Link href="/api/v1/openapi.json" className="rounded-xl border border-white/[0.1] px-5 py-3 text-sm text-[#D4D4D8] hover:border-[#3B82F6]/50">View OpenAPI JSON</Link>
            </div>
            {!docsOnly && <p className="mt-5 text-sm text-[#71717A]">Developer Portal · API keys, usage, webhooks, SDKs, and testing in one place.</p>}
          </section>

          <section id="authentication" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="Start here" title="Authentication" description="Every request is authenticated with a workspace-scoped Bearer API key. Create keys from the Developers area in your Actora workspace." />
            <CodeBlock code={`curl https://useactora.com/api/v1/tasks \\
  -H "Authorization: Bearer actora_live_your_key"`} />
            <p className="mt-4 text-sm text-[#A1A1AA]">Keys are hashed at rest and shown only once. Never commit a key to source control; store it in an environment variable.</p>
          </section>

          <section id="reference" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="REST API v1" title="REST API Reference" description="Predictable JSON endpoints with pagination, filtering, search, sorting, and workspace isolation." />
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["GET", "/tasks", "List and filter tasks"],
                ["POST", "/tasks", "Create a task"],
                ["GET", "/tasks/:id", "Retrieve a task"],
                ["POST", "/roxx/chat", "Stream a Roxx conversation"],
              ].map(([method, path, description]) => (
                <div key={`${method}${path}`} className="rounded-xl border border-white/[0.08] bg-[#111111] p-4">
                  <span className="mr-2 rounded bg-[#3B82F6]/15 px-2 py-1 text-xs font-bold text-[#93C5FD]">{method}</span>
                  <code className="text-sm text-white">{path}</code>
                  <p className="mt-3 text-sm text-[#71717A]">{description}</p>
                </div>
              ))}
            </div>
          </section>

          <section id="roxx" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="Roxx AI" title="AI-native APIs" description="Use Roxx as an execution layer for your own products. Send context, receive structured results, and keep authorization workspace-scoped." />
            <CodeBlock code={`POST /api/v1/roxx/chat
POST /api/v1/roxx/execute
POST /api/v1/roxx/workflows`} />
          </section>

          <section id="webhooks" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="Events" title="Webhooks" description="Receive signed events when work changes in Actora. Configure delivery URLs, event subscriptions, and retry behavior from the developer portal." />
            <div className="flex flex-wrap gap-2">{["task.created", "task.completed", "contact.created", "meeting.created", "workflow.completed", "ai.execution.completed"].map((event) => <code key={event} className="rounded-lg border border-white/[0.08] bg-[#111111] px-3 py-2 text-xs text-[#93C5FD]">{event}</code>)}</div>
          </section>

          <section id="sdk" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="Quickstarts" title="SDK examples" description="Copy a working request in the language your team already uses." />
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111111]">
              <div className="flex flex-wrap gap-1 border-b border-white/[0.08] p-2">{(Object.keys(examples) as Array<keyof typeof examples>).map((name) => <button key={name} onClick={() => setLanguage(name)} className={`rounded-lg px-3 py-2 text-xs ${language === name ? "bg-[#2563EB] text-white" : "text-[#A1A1AA] hover:bg-white/[0.05]"}`}>{name}</button>)}</div>
              <CodeBlock code={examples[language]} />
            </div>
          </section>

          <section id="playground" className="scroll-mt-28 border-b border-white/[0.06] py-14">
            <SectionTitle eyebrow="Try it live" title="API Playground" description="Test a read-only API request from your browser. Your key is used only for this request and is never stored." />
            <div className="rounded-2xl border border-white/[0.08] bg-[#111111] p-5">
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <select className="rounded-lg border border-white/[0.1] bg-[#0A0A0A] px-3 py-2 text-sm text-white" aria-label="HTTP method" defaultValue="GET"><option>GET</option></select>
                <input value={endpoint} onChange={(event) => setEndpoint(event.target.value)} className="rounded-lg border border-white/[0.1] bg-[#0A0A0A] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#3B82F6]" aria-label="API endpoint" />
              </div>
              <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder="Optional Bearer API key" type="password" className="mt-3 w-full rounded-lg border border-white/[0.1] bg-[#0A0A0A] px-3 py-2 font-mono text-sm text-white outline-none focus:border-[#3B82F6]" />
              <button onClick={runPlayground} disabled={running} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-medium disabled:opacity-50"><Play className="h-4 w-4" /> {running ? "Sending…" : "Send request"}</button>
              {result && <pre className="mt-4 max-h-72 overflow-auto rounded-lg bg-black/50 p-4 text-xs leading-6 text-[#93C5FD]">{result}</pre>}
            </div>
          </section>

          <section id="limits" className="scroll-mt-28 py-14">
            <SectionTitle eyebrow="Reliability" title="Rate limits and changelog" description="Limits are applied per API key and workspace. Responses include Retry-After when a limit is reached." />
            <div className="grid gap-3 sm:grid-cols-3">{[["Free", "250 calls / month", "20 requests / minute"], ["Pro", "1,500 calls / month", "300 requests / minute"], ["Team", "5,000 calls / month", "500 requests / minute"]].map(([plan, calls, rate]) => <div key={plan} className="rounded-xl border border-white/[0.08] bg-[#111111] p-4"><p className="font-medium text-white">{plan}</p><p className="mt-3 text-sm text-[#A1A1AA]">{calls}</p><p className="mt-1 text-sm text-[#60A5FA]">{rate}</p></div>)}</div>
            <div className="mt-10 rounded-xl border border-white/[0.08] bg-[#111111] p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">Changelog · v1.0</p><p className="mt-3 text-sm text-[#D4D4D8]">Public API foundation: API keys, Tasks endpoints, Roxx AI entrypoint, OpenAPI 3.1, usage tracking, and plan-aware rate limits.</p></div>
          </section>
        </div>
      </div>
    </main>
  );
}

function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#3B82F6]">{eyebrow}</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">{title}</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-[#A1A1AA]">{description}</p></div>;
}

function CodeBlock({ code }: { code: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-black/50 p-4 text-xs leading-6 text-[#93C5FD]"><code>{code}</code></pre>;
}
