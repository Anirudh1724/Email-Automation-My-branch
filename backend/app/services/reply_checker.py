"""
Reply checker service with Redis
"""
from datetime import datetime
import imaplib
import email
from email.header import decode_header


async def check_replies(redis_db):
    """
    Check for email replies via IMAP using Redis storage.
    """
    results = []
    
    try:
        # Get active sending accounts with IMAP configured
        accounts = redis_db.get_all("sending_accounts")
        accounts = [a for a in accounts if a.get("status") == "active" and a.get("imap_host")]
        
        for account in accounts:
            try:
                # Connect to IMAP
                mail = imaplib.IMAP4_SSL(
                    account["imap_host"],
                    account.get("imap_port", 993)
                )
                
                mail.login(
                    account.get("imap_username") or account["email_address"],
                    account.get("imap_password_encrypted", "")
                )
                
                mail.select("INBOX")
                
                # Search for unread messages
                status, messages = mail.search(None, "UNSEEN")
                
                for msg_num in messages[0].split():
                    status, msg_data = mail.fetch(msg_num, "(RFC822)")
                    
                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])
                            
                            in_reply_to = msg.get("In-Reply-To", "")
                            if not in_reply_to:
                                continue
                            
                            reply_to_id = in_reply_to.strip("<>")
                            
                            # Find original sent event by message ID
                            all_events = redis_db.get_all("email_events")
                            original = next(
                                (e for e in all_events 
                                 if e.get("message_id") == reply_to_id and e.get("event_type") == "sent"),
                                None
                            )
                            
                            if not original:
                                continue
                            
                            # Record reply event
                            reply_event = redis_db.create("email_events", {
                                "campaign_id": original.get("campaign_id"),
                                "lead_id": original.get("lead_id"),
                                "sending_account_id": account["id"],
                                "sequence_id": original.get("sequence_id"),
                                "step_number": original.get("step_number"),
                                "event_type": "replied",
                                "occurred_at": datetime.utcnow().isoformat(),
                                "metadata": {
                                    "reply_to_message_id": reply_to_id,
                                    "subject": msg.get("Subject", "")
                                }
                            })
                            
                            # Index the event
                            if original.get("lead_id"):
                                redis_db.index_by_field("email_events", reply_event["id"], "lead_id", original["lead_id"])
                            if original.get("campaign_id"):
                                redis_db.index_by_field("email_events", reply_event["id"], "campaign_id", original["campaign_id"])
                            
                            # Update lead status
                            if original.get("lead_id"):
                                redis_db.update("leads", original["lead_id"], {
                                    "status": "replied",
                                    "replied_at": datetime.utcnow().isoformat()
                                })
                            
                            results.append({
                                "account": account["email_address"],
                                "status": "reply_detected",
                                "lead_id": original.get("lead_id")
                            })
                
                mail.logout()
                
            except Exception as e:
                results.append({
                    "account": account.get("email_address"),
                    "error": str(e)
                })
        
        return {"success": True, "results": results}
    
    except Exception as e:
        return {"success": False, "error": str(e)}
