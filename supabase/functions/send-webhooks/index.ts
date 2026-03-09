import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSign(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Missing authorization" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const adminClient = createClient(supabaseUrl, serviceKey);

    let body: any;
    try { body = await req.json(); } catch { return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }); }

    const { event_type, alerts } = body;
    if (!event_type || !alerts?.length) {
      return new Response(JSON.stringify({ error: "Missing event_type or alerts" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Get active webhooks subscribed to this event type
    const { data: webhooks } = await userClient
      .from("webhook_configs")
      .select("*")
      .eq("is_active", true)
      .contains("events", [event_type]);

    if (!webhooks?.length) {
      return new Response(JSON.stringify({ sent: 0, message: "No active webhooks for this event" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    const errors: string[] = [];

    for (const wh of webhooks) {
      try {
        const payload = JSON.stringify({
          event: event_type,
          timestamp: new Date().toISOString(),
          alerts,
        });

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (wh.secret) {
          headers["X-Webhook-Signature"] = await hmacSign(wh.secret, payload);
        }

        const response = await fetch(wh.url, {
          method: "POST",
          headers,
          body: payload,
        });

        if (response.ok) {
          sent++;
          await adminClient.from("webhook_configs").update({
            last_triggered_at: new Date().toISOString(),
            failure_count: 0,
          }).eq("id", wh.id);
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (e: any) {
        errors.push(`${wh.name}: ${e.message}`);
        await adminClient.from("webhook_configs").update({
          failure_count: (wh.failure_count || 0) + 1,
        }).eq("id", wh.id);
      }
    }

    return new Response(JSON.stringify({ sent, total: webhooks.length, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-webhooks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
