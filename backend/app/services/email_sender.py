"""
Email sending service with Redis
"""
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


async def send_email(
    smtp_host: str,
    smtp_port: int,
    username: str,
    password: str,
    from_email: str,
    from_name: str,
    to_email: str,
    subject: str,
    html_body: str,
    headers: dict = None
) -> dict:
    """Send a single email via SMTP"""
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = f"{from_name} <{from_email}>"
    msg['To'] = to_email
    
    if headers:
        for key, value in headers.items():
            msg.add_header(key, value)
    
    html_part = MIMEText(html_body, 'html')
    msg.attach(html_part)
    
    try:
        logger.info(f"Sending email to {to_email} via {smtp_host}:{smtp_port}")
        await aiosmtplib.send(
            msg,
            hostname=smtp_host,
            port=smtp_port,
            username=username,
            password=password,
            start_tls=True
        )
        logger.info(f"Email sent successfully to {to_email}")
        return {"success": True, "message_id": msg.get('Message-ID', '')}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_campaign_emails(redis_db, campaign_id: str = None):
    """
    Process and send campaign emails using Redis storage.
    """
    results = []
    
    try:
        logger.info(f"Starting email send for campaign_id={campaign_id}")
        
        # Get active campaigns
        campaigns = redis_db.get_all("campaigns")
        campaigns = [c for c in campaigns if c.get("status") == "active"]
        
        if campaign_id:
            campaigns = [c for c in campaigns if c.get("id") == campaign_id]
        
        logger.info(f"Found {len(campaigns)} active campaign(s) to process")
        
        for campaign in campaigns:
            logger.info(f"Processing campaign: {campaign.get('name')}")
            
            # Get leads for this campaign's lead list
            if not campaign.get("lead_list_id"):
                logger.warning(f"Campaign {campaign.get('name')} has no lead_list_id")
                continue
            
            leads = redis_db.get_by_field("leads", "lead_list_id", campaign["lead_list_id"])
            leads = [l for l in leads if l.get("status") == "active"]
            logger.info(f"Found {len(leads)} active leads")
            
            # Get sending account
            if not campaign.get("sending_account_id"):
                logger.warning(f"Campaign {campaign.get('name')} has no sending_account_id")
                continue
            
            account = redis_db.get("sending_accounts", campaign["sending_account_id"])
            if not account:
                logger.warning(f"Sending account not found for campaign {campaign.get('name')}")
                continue
            
            logger.info(f"Using sending account: {account.get('email_address')}")
            
            # Get sequences
            sequences = redis_db.get_by_field("email_sequences", "campaign_id", campaign["id"])
            sequences.sort(key=lambda x: x.get("step_number", 0))
            
            first_step = sequences[0] if sequences else None
            if not first_step:
                logger.warning(f"No email sequences found for campaign {campaign.get('name')}")
                continue
            
            logger.info(f"Using sequence step 1: {first_step.get('subject')}")
            
            emails_sent = 0
            daily_limit = campaign.get("daily_send_limit", 50)
            
            for lead in leads:
                if emails_sent >= daily_limit:
                    logger.info(f"Daily limit of {daily_limit} reached")
                    break
                
                # Check if already sent
                events = redis_db.get_by_field("email_events", "lead_id", lead["id"])
                already_sent = any(
                    e.get("campaign_id") == campaign["id"] and 
                    e.get("step_number") == 1 and 
                    e.get("event_type") == "sent" 
                    for e in events
                )
                
                if already_sent:
                    continue
                
                # Variable substitution
                subject = first_step.get("subject", "")
                body = first_step.get("body", "")
                subject = subject.replace("{{first_name}}", lead.get("first_name") or "")
                subject = subject.replace("{{last_name}}", lead.get("last_name") or "")
                subject = subject.replace("{{company}}", lead.get("company") or "")
                subject = subject.replace("{{email}}", lead.get("email") or "")
                body = body.replace("{{first_name}}", lead.get("first_name") or "")
                body = body.replace("{{last_name}}", lead.get("last_name") or "")
                body = body.replace("{{company}}", lead.get("company") or "")
                body = body.replace("{{email}}", lead.get("email") or "")
                
                # Create event record
                event = redis_db.create("email_events", {
                    "campaign_id": campaign["id"],
                    "lead_id": lead["id"],
                    "sequence_id": first_step["id"],
                    "event_type": "sent",
                    "step_number": 1,
                    "sending_account_id": account["id"],
                    "recipient_email": lead["email"],
                    "subject": subject,
                    "occurred_at": datetime.utcnow().isoformat()
                })
                
                # Index the event
                redis_db.index_by_field("email_events", event["id"], "lead_id", lead["id"])
                redis_db.index_by_field("email_events", event["id"], "campaign_id", campaign["id"])
                
                # Add tracking pixel
                tracking_base = "http://localhost:8000"
                tracking_pixel = f'<img src="{tracking_base}/api/email-events/track-open?id={event["id"]}" width="1" height="1" style="display:none;" />'
                html_body = f"<div>{body}</div>{tracking_pixel}"
                
                # Get password - try multiple field names
                smtp_password = account.get("smtp_password") or account.get("smtp_password_encrypted") or ""
                
                # Send email
                result = await send_email(
                    smtp_host=account.get("smtp_host", "smtp.zoho.in"),
                    smtp_port=account.get("smtp_port", 587),
                    username=account.get("smtp_username") or account.get("email_address"),
                    password=smtp_password,
                    from_email=account["email_address"],
                    from_name=account.get("display_name") or account["email_address"],
                    to_email=lead["email"],
                    subject=subject,
                    html_body=html_body
                )
                
                if result["success"]:
                    # Update event with message ID
                    redis_db.update("email_events", event["id"], {
                        "message_id": result.get("message_id")
                    })
                    
                    # Update lead status
                    redis_db.update("leads", lead["id"], {
                        "status": "sent",
                        "last_sent_at": datetime.utcnow().isoformat(),
                        "current_step": 1
                    })
                    
                    # Update campaign sent count
                    redis_db.update("campaigns", campaign["id"], {
                        "sent_count": campaign.get("sent_count", 0) + 1
                    })
                    
                    emails_sent += 1
                    results.append({
                        "campaign": campaign.get("name"),
                        "lead": lead["email"],
                        "status": "sent"
                    })
                    logger.info(f"Successfully sent email to {lead['email']}")
                else:
                    redis_db.update("email_events", event["id"], {
                        "error_message": result.get("error")
                    })
                    results.append({
                        "campaign": campaign.get("name"),
                        "lead": lead["email"],
                        "status": "error",
                        "error": result.get("error")
                    })
                    logger.error(f"Failed to send to {lead['email']}: {result.get('error')}")
            
            logger.info(f"Sent {emails_sent} emails for campaign {campaign.get('name')}")
        
        return {"success": True, "results": results}
    
    except Exception as e:
        logger.exception(f"Error in send_campaign_emails: {str(e)}")
        return {"success": False, "error": str(e)}

