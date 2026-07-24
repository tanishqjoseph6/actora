import { Resend } from "npm:resend@4.8.0";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-actora-email-secret",
};

type SendEmailBody = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  tags?: { name: string; value: string }[];
};

function decodeJwtRole(authHeader: string | null): string | null {
  if (!authHeader?.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
    return typeof payload?.role === "string" ? payload.role : null;
  } catch {
    return null;
  }
}

function isAuthorized(req: Request): boolean {
  const shared = Deno.env.get("SEND_EMAIL_SECRET")?.trim();
  if (shared) {
    const headerSecret = req.headers.get("x-actora-email-secret")?.trim();
    if (headerSecret && headerSecret === shared) return true;
  }

  const role = decodeJwtRole(req.headers.get("Authorization"));
  // Only service_role may send mail. Anon JWT must never be enough.
  return role === "service_role";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY is not configured in Edge Function secrets.",
          skipped: "missing_resend_api_key",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const from =
      Deno.env.get("EMAIL_FROM")?.trim() ||
      "Actora <onboarding@useactora.com>";

    const body = (await req.json()) as SendEmailBody;
    const recipients = Array.isArray(body.to) ? body.to : [body.to];

    if (!recipients.length || !recipients[0]?.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid recipient required." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!body.subject?.trim() || !body.html?.trim()) {
      return new Response(
        JSON.stringify({ error: "subject and html are required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: recipients,
      subject: body.subject.trim(),
      html: body.html,
      text: body.text,
      tags: body.tags,
    });

    if (error) {
      console.error("[send-email] Resend error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ sent: true, id: data?.id ?? null }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("[send-email] Unexpected error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Failed to send email.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
