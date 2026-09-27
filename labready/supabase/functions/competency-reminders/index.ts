// Supabase Edge Function: weekly competency reminder emails for LabReady Pro.
// Triggered by pg_cron (see ../../reminders-cron.sql). Sends through Resend.
//
// Settings. Each is read from the function's environment (Edge Functions > Secrets)
// first, then from Supabase Vault through public.reminder_settings(), which only the
// service role can call. The cron secret is created in Vault by reminders-cron.sql.
//   CRON_SECRET     shared secret the cron job sends in the x-cron-secret header (Vault: labready_cron_secret)
//   RESEND_API_KEY  API key from resend.com (Vault: labready_resend_key)
//   FROM_EMAIL      verified sender; default "LabReady Pro <reminders@labreadypro.com>"
//   APP_URL         default https://labreadypro.com/labready/app/
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided by Supabase automatically.
//
// Call with ?dry_run=1 to get the emails back as JSON without sending them.

import { createClient } from "npm:@supabase/supabase-js@2";
import { buildDigests } from "./digest.js";

const env = (k: string) => Deno.env.get(k) ?? "";

const DEFAULT_FROM = "LabReady Pro <reminders@labreadypro.com>";
const DEFAULT_APP_URL = "https://labreadypro.com/labready/app/";

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
    const resendKey = env("RESEND_API_KEY") || vault.resend_key || "";
    const fromEmail = env("FROM_EMAIL") || DEFAULT_FROM;
    const appUrl = env("APP_URL") || DEFAULT_APP_URL;

    if (!secret || req.headers.get("x-cron-secret") !== secret) {
        return new Response("Unauthorized", { status: 401 });
    }
    const dryRun = new URL(req.url).searchParams.get("dry_run") === "1";

    const today = new Date().toISOString().slice(0, 10);
    const horizon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);

    const q = async (p: PromiseLike<{ data: unknown; error: { message: string } | null }>) => {
        const { data, error } = await p;
        if (error) throw new Error(error.message);
        return data as any[];
    };

    try {
        const [labs, members, staff, systems, competencies] = await Promise.all([
            q(sb.from("labs").select("id, name")),
            q(sb.from("lab_members").select("lab_id, user_id, role, display_name, email_reminders")
                .in("role", ["admin", "supervisor"]).eq("email_reminders", true)),
            q(sb.from("staff").select("id, lab_id, name, active")),
            q(sb.from("test_systems").select("id, lab_id, name, instrument")),
            q(sb.from("competencies").select("id, lab_id, staff_id, test_system_id, kind, due_date, completed_at")
                .is("completed_at", null).lte("due_date", horizon)),
        ]);

        // Member emails live in auth.users; look each one up once.
        const emails = new Map<string, string>();
        for (const id of new Set(members.map((m) => m.user_id))) {
            const { data } = await sb.auth.admin.getUserById(id);
            if (data?.user?.email) emails.set(id, data.user.email);
        }

        const digests = buildDigests({
            today,
            appUrl,
            labs,
            members: members.map((m) => ({ ...m, email: emails.get(m.user_id) })),
            staff,
            systems,
            competencies,
        });

        if (dryRun) return Response.json({ today, emailReady: !!resendKey, digests });
        if (!resendKey && digests.length) return Response.json({ today, error: "No Resend API key set; nothing sent", wouldSend: digests.length }, { status: 503 });

        const results = [];
        for (const d of digests) {
            const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
                body: JSON.stringify({ from: fromEmail, to: d.to, subject: d.subject, html: d.html, text: d.text }),
            });
            results.push({ lab: d.labName, recipients: d.to.length, ok: res.ok, status: res.status });
        }
        return Response.json({ today, sent: results });
    } catch (e) {
        return Response.json({ error: (e as Error).message }, { status: 500 });
    }
});
