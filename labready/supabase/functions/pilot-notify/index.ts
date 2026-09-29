// Supabase Edge Function: emails Elie when someone submits the pilot form on labreadypro.com.
// Called by the database trigger in ../../pilot-notify.sql with the new row's id; the function
// reads the row itself with the service role, so nothing in the call body is trusted.
//
// Settings (same sources as competency-reminders): the function's environment first, then
// Supabase Vault through public.reminder_settings().
//   CRON_SECRET     shared secret sent in the x-cron-secret header (Vault: labready_cron_secret)
//   RESEND_API_KEY  API key from resend.com (Vault: labready_resend_key)
//   PILOT_NOTIFY_TO who gets the alert; default elie.c@flowmaxpros.com
//   FROM_EMAIL      verified sender; default "LabReady Pro <reminders@labreadypro.com>"

import { createClient } from "npm:@supabase/supabase-js@2";

const env = (k: string) => Deno.env.get(k) ?? "";
const clean = (v: string | null | undefined) => (v ?? "").trim().replace(/^["']+|["']+$/g, "").trim();
const esc = (s: unknown) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const DEFAULT_TO = "elie.c@flowmaxpros.com";
const DEFAULT_FROM = "LabReady Pro <reminders@labreadypro.com>";

Deno.serve(async (req) => {
    const sb = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    let vault: Record<string, string | null> = {};
    if (!env("CRON_SECRET") || !env("RESEND_API_KEY")) {
        const { data } = await sb.rpc("reminder_settings");
        vault = (data ?? {}) as Record<string, string | null>;
    }
    const secret = env("CRON_SECRET") || vault.cron_secret || "";
    if (!secret || req.headers.get("x-cron-secret") !== secret) {
        return new Response("Unauthorized", { status: 401 });
    }
    const resendKey = clean(env("RESEND_API_KEY") || vault.resend_key);
    const to = clean(env("PILOT_NOTIFY_TO")) || DEFAULT_TO;
    const from = env("FROM_EMAIL") || DEFAULT_FROM;

    const { id } = await req.json().catch(() => ({ id: null }));
    if (!Number.isInteger(id)) return Response.json({ error: "missing id" }, { status: 400 });

    const { data: r, error } = await sb.from("labready_pilot_requests")
        .select("id, created_at, name, role, email, lab, size, analyzers, pain, source").eq("id", id).maybeSingle();
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!r) return Response.json({ error: "not found" }, { status: 404 });
    if (!resendKey) return Response.json({ error: "No Resend API key set" }, { status: 503 });

    const rows: [string, unknown][] = [
        ["Name", r.name], ["Role", r.role], ["Email", r.email], ["Laboratory", r.lab],
        ["Testing staff", r.size], ["Analysers", r.analyzers], ["Hardest part right now", r.pain],
        ["Received", new Date(r.created_at).toUTCString()],
    ];
    const text = [
        `New founding-lab pilot request from ${r.name} (${r.lab}).`, "",
        ...rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`), "",
        "Reply to this email to answer them directly. The site promises a reply within two business days.",
    ].join("\n");
    const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0b1f2e;max-width:600px">` +
        `<p style="font-size:16px"><b>New founding-lab pilot request</b></p>` +
        `<table style="border-collapse:collapse;font-size:14px;width:100%">` +
        rows.filter(([, v]) => v).map(([k, v]) =>
            `<tr><td style="padding:6px 10px 6px 0;color:#5f7482;vertical-align:top;white-space:nowrap">${esc(k)}</td>` +
            `<td style="padding:6px 0;border-bottom:1px solid #dde6ec;white-space:pre-wrap">${esc(v)}</td></tr>`).join("") +
        `</table><p style="color:#5f7482;font-size:13px;margin-top:18px">Reply to this email to answer them directly. The site promises a reply within two business days.</p></div>`;

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            from, to: [to], reply_to: r.email,
            subject: `Pilot request: ${String(r.lab).slice(0, 80)} (${String(r.name).slice(0, 60)})`,
            text, html,
        }),
    });
    return Response.json({ ok: res.ok, status: res.status, detail: res.ok ? undefined : await res.text() }, { status: res.ok ? 200 : 502 });
});
