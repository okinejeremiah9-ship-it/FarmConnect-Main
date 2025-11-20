import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const body = await req.json();
    const { user_id, subscription } = body;

    if (!user_id || !subscription) {
      throw new Error("Missing user_id or subscription");
    }

    const endpoint: string = subscription.endpoint;
    const p256dh: string = subscription.keys?.p256dh;
    const auth: string = subscription.keys?.auth;

    if (!endpoint || !p256dh || !auth) {
      throw new Error("Invalid subscription payload");
    }

    const { error } = await supabase
      .from("notification_subscriptions")
      .upsert(
        {
          user_id,
          endpoint,
          p256dh,
          auth,
        },
        {
          onConflict: "user_id,endpoint",
        }
      );

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("register-push-subscription error:", err);
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
