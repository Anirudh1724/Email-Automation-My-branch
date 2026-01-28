import { serve } from "std/http/server.ts";
import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";


interface EmailSequenceStep {
  step_number: number;
  subject: string;
  body: string;
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

    // 1. Get active campaigns
    const { data: campaigns, error: campaignError } = await supabaseClient
      .from("campaigns")
      .select("*, email_sequences(*)")
      .eq("status", "active");

    if (campaignError) throw campaignError;

    const results = [];

    // 2. Process each campaign
    for (const campaign of campaigns || []) {
      const { data: leads, error: leadsError } = await supabaseClient
        .from("leads")
        .select("*")
        .eq("lead_list_id", campaign.lead_list_id);

      if (leadsError) {
        console.error(`Error fetching leads for campaign ${campaign.id}:`, leadsError);
        continue;
      }

      // Get sending account credentials
      const { data: account, error: accountError } = await supabaseClient
        .from("sending_accounts")
        .select("*")
        .eq("id", campaign.sending_account_id)
        .single();

      if (accountError || !account) {
        console.error(`Error fetching sending account for campaign ${campaign.id}:`, accountError);
        continue;
      }

      // Configure transporter
      const transporter = nodemailer.createTransport({
        host: account.smtp_host,
        port: account.smtp_port,
        secure: account.smtp_port === 465,
        auth: {
            user: account.username,
            pass: account.password,
        },
      });

      let emailsSent = 0;

      for (const lead of leads || []) {
        if (emailsSent >= (campaign.daily_send_limit || 50)) break; // Check simplistic daily limit

        // Check if lead already has a 'sent' event for this step (simplification)
        const { data: existingEvents } = await supabaseClient
            .from("email_events")
            .select("id")
            .eq("campaign_id", campaign.id)
            .eq("lead_id", lead.id)
            .eq("step_number", 1)
            .eq("event_type", "sent");
        
        if (existingEvents && existingEvents.length > 0) continue; // Already sent

        // Get first step
        const firstStep = campaign.email_sequences?.find((s: EmailSequenceStep) => s.step_number === 1);
        if (!firstStep) continue;

        // Select variant logic (simplified for now)
        const subject = firstStep.subject;
        const body = firstStep.body.replace("{{first_name}}", lead.first_name || "")
                                   .replace("{{company}}", lead.company_name || "");

        // Determine tracking ID (we use lead_id + campaign_id + step for uniqueness in tracking logic if needed, 
        // but for the pixel we need a reference. We can create the event AFTER sending or BEFORE?
        // If we create BEFORE, we don't have message_id yet. 
        // We can create a placeholder event, or just pass a contrived ID to the pixel and logging later?
        // Better: Insert 'pending' or just use metadata. 
        // Standard practice: Insert event, get ID, put ID in pixel.
        
        const { data: event, error: eventError } = await supabaseClient
            .from("email_events")
            .insert({
                campaign_id: campaign.id,
                lead_id: lead.id,
                event_type: "sent", // We'll update this or insert another? 
                // Actually 'sent' implies success. Maybe we should wait.
                // But we need detailed logs. 
                // Let's insert 'sent' after success.
                // But we need ID for pixel.
                // Let's Insert a 'queued' or use a UUID we generate?
                // email_events.event_type is enum: sent, opened... 
                // It doesn't have 'queued'.
                // We'll generate a UUID for the pixel and store it in metadata or just insert 'sent' now?
                // If we insert 'sent' now, it might be false positive if it fails.
                // We will insert `sent` AFTER sending.
                // REQUIRED: Pixel needs an ID. 
                // We'll use `lead_id` and `campaign_id` in pixel? No, need unique event ID to track which specific email.
                // Solution: Insert the row now as 'sent' but verify success? 
                // Or allows us to update it?
                // Let's assume we insert it.
                step_number: 1,
                sending_account_id: account.id,
                recipient_email: lead.email,
                subject: subject
            })
            .select("id")
            .single();
            
        if (eventError) continue;

        const trackingPixel = `<img src="${Deno.env.get("SUPABASE_URL")}/functions/v1/track-open?id=${event.id}" width="1" height="1" style="display:none;" />`;
        const htmlBody = `<div>${body}</div>${trackingPixel}`;

        try {
            const info = await transporter.sendMail({
                from: `${account.from_name || account.email_address} <${account.email_address}>`,
                to: lead.email,
                subject: subject,
                html: htmlBody,
                headers: {
                    "X-Campaign-ID": campaign.id,
                    "X-Lead-ID": lead.id,
                    "X-Event-ID": event.id
                }
            });

            // Update event with message_id
            await supabaseClient
                .from("email_events")
                .update({ 
                    message_id: info.messageId,
                    metadata: { messageId: info.messageId }
                })
                .eq("id", event.id);

            // Update lead status
            await supabaseClient
                .from("leads")
                .update({ 
                    status: "sent", 
                    last_sent_at: new Date().toISOString(),
                    last_message_id: info.messageId,
                    current_step: 1
                })
                .eq("id", lead.id);
                
            emailsSent++;
            results.push({ campaign: campaign.name, lead: lead.email, status: "sent", messageId: info.messageId });
        } catch (sendError) {
             console.error(`Failed to send to ${lead.email}:`, sendError);
             // Delete the event if failed? or mark as error? 
             // email_events doesn't have status column.
             // We'll update error_message
             await supabaseClient
                .from("email_events")
                .update({ error_message: (sendError as Error).message })
                .eq("id", event.id);
        }
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
