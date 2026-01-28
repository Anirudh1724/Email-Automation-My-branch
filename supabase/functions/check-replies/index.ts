import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import imaps from "imap-simple";



interface MessagePart {
  which: string;
  body: unknown;
}


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};


serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 1. Get active sending accounts that have IMAP configured
    const { data: accounts, error: accountsError } = await supabaseClient
      .from("sending_accounts")
      .select("*")
      .eq("status", "active")
      .not("imap_host", "is", null);

    if (accountsError) throw accountsError;

    const results = [];

    for (const account of accounts || []) {
      try {
        const config = {
          imap: {
            user: account.imap_username || account.username,
            password: account.imap_password_encrypted || account.password, // Ideally use decrypted
            host: account.imap_host,
            port: account.imap_port || 993,
            tls: true,
            authTimeout: 10000,
          },
        };

        const connection = await imaps.connect(config);
        await connection.openBox("INBOX");

        const searchCriteria = ["UNSEEN"];
        const fetchOptions = {
          bodies: ["HEADER", "TEXT"],
          markSeen: false,
        };

        const messages = await connection.search(searchCriteria, fetchOptions);

        for (const message of messages) {
          const headerPart = message.parts.find((part: MessagePart) => part.which === "HEADER");
          const headers = headerPart ? (headerPart.body as Record<string, string[]>) : {};

          if (!headerPart) continue;
           
           // Extract References / In-Reply-To
           const inReplyTo = headers["in-reply-to"] ? headers["in-reply-to"][0] : null;
           const references = headers["references"] ? headers["references"][0] : null;
           
           if (!inReplyTo && !references) continue;
           
           // Clean IDs (remove < >)
           const cleanId = (id: string | null) => id ? id.replace(/[<>]/g, "") : "";
           
           const replyToId = cleanId(inReplyTo);
           
           if (replyToId) {
             // Find original sent event
             const { data: originalEvent } = await supabaseClient
                .from("email_events")
                .select("*")
                .eq("message_id", replyToId)
                .eq("event_type", "sent")
                .single();
                
             if (originalEvent) {
                // Determine if we already logged this reply
                // Maybe check by message_id of the reply itself? 
                // Currently email_events.message_id stores the SENT message ID.
                // For 'replied' event, message_id could be the REPLY's ID.
                // Or we store original message_id in metadata.
                
                // Let's check if we already have a 'replied' event for this lead & campaign recently?
                // Better: check if this reply message ID is already logged? 
                // We don't store reply message IDs in a searchable way easily.
                
                // For now, let's just log it if we haven't logged a reply for this lead/campaign today?
                // Or just log it. Multiple replies are possible.
                
                await supabaseClient
                    .from("email_events")
                    .insert({
                        campaign_id: originalEvent.campaign_id,
                        lead_id: originalEvent.lead_id,
                        sending_account_id: account.id,
                        sequence_id: originalEvent.sequence_id,
                        step_number: originalEvent.step_number,
                        event_type: "replied",
                        occurred_at: new Date().toISOString(),
                        metadata: {
                           reply_to_message_id: replyToId,
                           subject: headers.subject ? headers.subject[0] : "No Subject"
                        } 
                    });
                    
                // Update Lead Status
                await supabaseClient
                    .from("leads")
                    .update({ 
                        status: "replied", 
                        replied_at: new Date().toISOString()
                    })
                    .eq("id", originalEvent.lead_id);
                    
                // Check stop_on_reply logic
                // Fetch campaign
                const { data: campaign } = await supabaseClient
                    .from("campaigns")
                    .select("stop_on_reply")
                    .eq("id", originalEvent.campaign_id)
                    .single();
                    
                if (campaign?.stop_on_reply) {
                    // Update lead status to 'completed' or just leave as 'replied' but stop sending?
                    // The system should exclude 'replied' leads from future sends.
                    // Also trigger might handle it.
                    console.log(`Lead ${originalEvent.lead_id} replied. Stop on reply active.`);
                }
                
                results.push({ account: account.email_address, status: "reply_detected", lead: originalEvent.lead_id });
             }
           }
        }
        
        connection.end();
      } catch (err) {
        console.error(`Error checking account ${account.email_address}:`, err);
        results.push({ account: account.email_address, error: (err as Error).message });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
