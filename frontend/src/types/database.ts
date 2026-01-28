import { Database } from "@/integrations/supabase/types";

// Database types
export type Tables = Database["public"]["Tables"];

// Enums
export type AppRole = "admin" | "member" | "viewer";
export type ProviderType = "google" | "outlook" | "smtp";
export type AccountStatus = "active" | "paused" | "error" | "warming";
export type CampaignStatus = "draft" | "active" | "paused" | "completed";
export type LeadStatus = "active" | "sent" | "opened" | "replied" | "bounced" | "unsubscribed" | "completed";
export type EventType = "sent" | "opened" | "clicked" | "replied" | "bounced" | "unsubscribed";

// Profile
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

// Sending Account
export interface SendingAccount {
  id: string;
  user_id: string;
  email_address: string;
  display_name: string | null;
  provider: ProviderType;
  oauth_access_token: string | null;
  oauth_refresh_token: string | null;
  oauth_expires_at: string | null;
  smtp_host: string | null;
  smtp_port: number;
  smtp_username: string | null;
  smtp_password_encrypted: string | null;
  imap_host: string | null;
  imap_port: number;
  imap_username: string | null;
  imap_password_encrypted: string | null;
  daily_send_limit: number;
  sent_today: number;
  warmup_enabled: boolean;
  warmup_progress: number;
  status: AccountStatus;
  last_sync_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

// Campaign
export interface Campaign {
  id: string;
  user_id: string;
  sending_account_id: string | null;
  lead_list_id: string | null;
  name: string;
  description: string | null;
  status: CampaignStatus;
  daily_send_limit: number;
  send_gap_seconds: number;
  randomize_timing: boolean;
  weekdays_only: boolean;
  start_time: string;
  end_time: string;
  timezone: string;
  total_leads: number;
  sent_count: number;
  opened_count: number;
  replied_count: number;
  bounced_count: number;
  scheduled_start_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  stop_on_reply: boolean;
  created_at: string;
  updated_at: string;
}

// Lead List
export interface LeadList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  lead_count: number;
  created_at: string;
  updated_at: string;
}

// Email Sequence (step in a campaign)
export interface EmailSequence {
  id: string;
  campaign_id: string;
  step_number: number;
  subject: string;
  body: string;
  delay_days: number;
  delay_hours: number;
  delay_minutes: number;
  is_reply: boolean;
  created_at: string;
  updated_at: string;
}

// Lead
export interface Lead {
  id: string;
  campaign_id: string | null;
  lead_list_id: string | null;
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  custom_fields: Record<string, unknown>;
  status: LeadStatus;
  thread_id: string | null;
  last_message_id: string | null;
  current_step: number;
  next_send_at: string | null;
  first_sent_at: string | null;
  last_sent_at: string | null;
  opened_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
  unsubscribed_at: string | null;
  created_at: string;
  updated_at: string;
}

// Email Event
export interface EmailEvent {
  id: string;
  lead_id: string;
  campaign_id: string;
  sequence_id: string | null;
  sending_account_id: string | null;
  event_type: EventType;
  step_number: number | null;
  message_id: string | null;
  subject: string | null;
  recipient_email: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  occurred_at: string;
  // Joined data
  lead?: Lead;
  campaign?: Campaign;
}

// Email Template
export interface EmailTemplate {
  id: string;
  user_id: string;
  name: string;
  subject: string;
  body: string;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

// Unsubscribe entry
export interface UnsubscribeEntry {
  id: string;
  user_id: string;
  email: string;
  reason: string | null;
  created_at: string;
}

// Subscription
export interface Subscription {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Domain
export interface Domain {
  id: string;
  user_id: string;
  domain: string;
  status: string;
  verification_token: string | null;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Team Member
export interface TeamMember {
  id: string;
  user_id: string;
  member_email: string;
  role: string;
  status: string;
  invited_at: string;
  accepted_at: string | null;
  created_at: string;
}

// Domain Blacklist
export interface DomainBlacklist {
  id: string;
  user_id: string;
  domain: string;
  created_at: string;
}

// Create/Update types
export type CreateSendingAccount = Omit<SendingAccount, "id" | "user_id" | "created_at" | "updated_at" | "sent_today">;
export type UpdateSendingAccount = Partial<CreateSendingAccount>;

export interface CreateCampaignInput {
  name: string;
  description?: string | null;
  sending_account_id?: string | null;
  lead_list_id?: string | null;
  status?: CampaignStatus;
  stop_on_reply?: boolean;
  daily_send_limit?: number;
  send_gap_seconds?: number;
  randomize_timing?: boolean;
  weekdays_only?: boolean;
  start_time?: string;
  end_time?: string;
  timezone?: string;
  scheduled_start_at?: string | null;
}

export interface UpdateCampaign extends Partial<CreateCampaignInput> {}

// Email Sequence Variant (A/B testing)
export interface EmailSequenceVariant {
  id: string;
  sequence_id: string;
  subject: string;
  body: string;
  weight: number;
  sent_count: number;
  opened_count: number;
  replied_count: number;
  clicked_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateSequenceInput {
  step_number?: number;
  subject?: string;
  body?: string;
  delay_days?: number;
  delay_hours?: number;
  delay_minutes?: number;
  is_reply?: boolean;
  variants?: Array<{
    subject: string;
    body: string;
    weight?: number;
  }>;
}

export interface CreateLeadListInput {
  name: string;
  description?: string | null;
}

export type UpdateLeadList = Partial<CreateLeadListInput>;

export type CreateLead = Omit<Lead, "id" | "user_id" | "created_at" | "updated_at" | "thread_id" | "last_message_id" | "current_step" | "next_send_at" | "first_sent_at" | "last_sent_at" | "opened_at" | "replied_at" | "bounced_at" | "unsubscribed_at">;
export type UpdateLead = Partial<CreateLead>;

export type CreateEmailTemplate = Omit<EmailTemplate, "id" | "user_id" | "created_at" | "updated_at" | "usage_count">;
export type UpdateEmailTemplate = Partial<CreateEmailTemplate>;
