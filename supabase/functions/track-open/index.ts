import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const TRANSPARENT_GIF = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00,
  0x80, 0x00, 0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x2c,
  0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0x02,
  0x02, 0x44, 0x01, 0x00, 0x3b
]);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const logId = url.searchParams.get("id");

    if (logId) {
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      // Fetch the original sent event to get context
      const { data: sentEvent, error: fetchError } = await supabaseClient
        .from("email_events")
        .select("campaign_id, lead_id, sending_account_id, sequence_id, step_number")
        .eq("id", logId)
        .single();
        
      if (sentEvent && !fetchError) {
          // Record the open event
          await supabaseClient
            .from("email_events")
            .insert({
                campaign_id: sentEvent.campaign_id,
                lead_id: sentEvent.lead_id,
                sending_account_id: sentEvent.sending_account_id,
                sequence_id: sentEvent.sequence_id,
                step_number: sentEvent.step_number,
                event_type: "opened",
                occurred_at: new Date().toISOString()
            });
            
          // Update lead status
          await supabaseClient
            .from("leads")
            .update({ 
                status: "opened",
                opened_at: new Date().toISOString()
            })
            .eq("id", sentEvent.lead_id);
            
          console.log(`Open tracked for lead ${sentEvent.lead_id}`);
      }
    }

    return new Response(TRANSPARENT_GIF, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    console.error("Error tracking open:", error);
    // Return tracking pixel anyway to avoid broken image icon
    return new Response(TRANSPARENT_GIF, {
      headers: { ...corsHeaders, "Content-Type": "image/gif" },
    });
  }
});
