export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      campaigns: {
        Row: {
          bounced_count: number | null
          completed_at: string | null
          created_at: string
          daily_send_limit: number | null
          description: string | null
          end_time: string | null
          id: string
          lead_list_id: string | null
          name: string
          opened_count: number | null
          randomize_timing: boolean | null
          replied_count: number | null
          scheduled_start_at: string | null
          send_gap_seconds: number | null
          sending_account_id: string | null
          sent_count: number | null
          start_time: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          timezone: string | null
          total_leads: number | null
          updated_at: string
          user_id: string
          weekdays_only: boolean | null
        }
        Insert: {
          bounced_count?: number | null
          completed_at?: string | null
          created_at?: string
          daily_send_limit?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          lead_list_id?: string | null
          name: string
          opened_count?: number | null
          randomize_timing?: boolean | null
          replied_count?: number | null
          scheduled_start_at?: string | null
          send_gap_seconds?: number | null
          sending_account_id?: string | null
          sent_count?: number | null
          start_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          timezone?: string | null
          total_leads?: number | null
          updated_at?: string
          user_id: string
          weekdays_only?: boolean | null
        }
        Update: {
          bounced_count?: number | null
          completed_at?: string | null
          created_at?: string
          daily_send_limit?: number | null
          description?: string | null
          end_time?: string | null
          id?: string
          lead_list_id?: string | null
          name?: string
          opened_count?: number | null
          randomize_timing?: boolean | null
          replied_count?: number | null
          scheduled_start_at?: string | null
          send_gap_seconds?: number | null
          sending_account_id?: string | null
          sent_count?: number | null
          start_time?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          timezone?: string | null
          total_leads?: number | null
          updated_at?: string
          user_id?: string
          weekdays_only?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_lead_list_id_fkey"
            columns: ["lead_list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_sending_account_id_fkey"
            columns: ["sending_account_id"]
            isOneToOne: false
            referencedRelation: "sending_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      domain_blacklist: {
        Row: {
          created_at: string
          domain: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      domains: {
        Row: {
          created_at: string
          domain: string
          id: string
          status: string
          updated_at: string
          user_id: string
          verification_token: string | null
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          domain: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          domain?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          verification_token?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      email_events: {
        Row: {
          campaign_id: string
          error_message: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id: string
          lead_id: string
          message_id: string | null
          metadata: Json | null
          occurred_at: string
          recipient_email: string | null
          sending_account_id: string | null
          sequence_id: string | null
          step_number: number | null
          subject: string | null
        }
        Insert: {
          campaign_id: string
          error_message?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          id?: string
          lead_id: string
          message_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          recipient_email?: string | null
          sending_account_id?: string | null
          sequence_id?: string | null
          step_number?: number | null
          subject?: string | null
        }
        Update: {
          campaign_id?: string
          error_message?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          id?: string
          lead_id?: string
          message_id?: string | null
          metadata?: Json | null
          occurred_at?: string
          recipient_email?: string | null
          sending_account_id?: string | null
          sequence_id?: string | null
          step_number?: number | null
          subject?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_sending_account_id_fkey"
            columns: ["sending_account_id"]
            isOneToOne: false
            referencedRelation: "sending_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_events_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "email_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      email_sequences: {
        Row: {
          body: string
          campaign_id: string
          created_at: string
          delay_days: number | null
          delay_hours: number | null
          delay_minutes: number | null
          id: string
          is_reply: boolean | null
          step_number: number
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          campaign_id: string
          created_at?: string
          delay_days?: number | null
          delay_hours?: number | null
          delay_minutes?: number | null
          id?: string
          is_reply?: boolean | null
          step_number?: number
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          campaign_id?: string
          created_at?: string
          delay_days?: number | null
          delay_hours?: number | null
          delay_minutes?: number | null
          id?: string
          is_reply?: boolean | null
          step_number?: number
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_sequences_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          name: string
          subject: string
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          name: string
          subject: string
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          name?: string
          subject?: string
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      lead_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_count: number | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_count?: number | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_count?: number | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          bounced_at: string | null
          campaign_id: string
          company: string | null
          created_at: string
          current_step: number | null
          custom_fields: Json | null
          email: string
          first_name: string | null
          first_sent_at: string | null
          id: string
          last_message_id: string | null
          last_name: string | null
          last_sent_at: string | null
          lead_list_id: string | null
          next_send_at: string | null
          opened_at: string | null
          replied_at: string | null
          status: Database["public"]["Enums"]["lead_status"]
          thread_id: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bounced_at?: string | null
          campaign_id: string
          company?: string | null
          created_at?: string
          current_step?: number | null
          custom_fields?: Json | null
          email: string
          first_name?: string | null
          first_sent_at?: string | null
          id?: string
          last_message_id?: string | null
          last_name?: string | null
          last_sent_at?: string | null
          lead_list_id?: string | null
          next_send_at?: string | null
          opened_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          thread_id?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string
          company?: string | null
          created_at?: string
          current_step?: number | null
          custom_fields?: Json | null
          email?: string
          first_name?: string | null
          first_sent_at?: string | null
          id?: string
          last_message_id?: string | null
          last_name?: string | null
          last_sent_at?: string | null
          lead_list_id?: string | null
          next_send_at?: string | null
          opened_at?: string | null
          replied_at?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          thread_id?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_lead_list_id_fkey"
            columns: ["lead_list_id"]
            isOneToOne: false
            referencedRelation: "lead_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          company: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sending_accounts: {
        Row: {
          created_at: string
          daily_send_limit: number | null
          display_name: string | null
          email_address: string
          id: string
          imap_host: string | null
          imap_password_encrypted: string | null
          imap_port: number | null
          imap_username: string | null
          last_error: string | null
          last_sync_at: string | null
          oauth_access_token: string | null
          oauth_expires_at: string | null
          oauth_refresh_token: string | null
          provider: Database["public"]["Enums"]["provider_type"]
          sent_today: number | null
          smtp_host: string | null
          smtp_password_encrypted: string | null
          smtp_port: number | null
          smtp_username: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
          user_id: string
          warmup_enabled: boolean | null
          warmup_progress: number | null
        }
        Insert: {
          created_at?: string
          daily_send_limit?: number | null
          display_name?: string | null
          email_address: string
          id?: string
          imap_host?: string | null
          imap_password_encrypted?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          provider?: Database["public"]["Enums"]["provider_type"]
          sent_today?: number | null
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id: string
          warmup_enabled?: boolean | null
          warmup_progress?: number | null
        }
        Update: {
          created_at?: string
          daily_send_limit?: number | null
          display_name?: string | null
          email_address?: string
          id?: string
          imap_host?: string | null
          imap_password_encrypted?: string | null
          imap_port?: number | null
          imap_username?: string | null
          last_error?: string | null
          last_sync_at?: string | null
          oauth_access_token?: string | null
          oauth_expires_at?: string | null
          oauth_refresh_token?: string | null
          provider?: Database["public"]["Enums"]["provider_type"]
          sent_today?: number | null
          smtp_host?: string | null
          smtp_password_encrypted?: string | null
          smtp_port?: number | null
          smtp_username?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
          user_id?: string
          warmup_enabled?: boolean | null
          warmup_progress?: number | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          end_date: string | null
          id: string
          plan: string
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          id?: string
          plan?: string
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          member_email: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          member_email: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          member_email?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      unsubscribe_list: {
        Row: {
          created_at: string
          email: string
          id: string
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_campaign_owner: { Args: { _campaign_id: string }; Returns: boolean }
      is_lead_owner: { Args: { _lead_id: string }; Returns: boolean }
      is_owner: { Args: { _user_id: string }; Returns: boolean }
      is_sending_account_owner: {
        Args: { _account_id: string }
        Returns: boolean
      }
      reset_daily_send_counts: { Args: never; Returns: undefined }
    }
    Enums: {
      account_status: "active" | "paused" | "error" | "warming"
      app_role: "admin" | "member" | "viewer"
      campaign_status: "draft" | "active" | "paused" | "completed"
      event_type:
        | "sent"
        | "opened"
        | "clicked"
        | "replied"
        | "bounced"
        | "unsubscribed"
      lead_status:
        | "active"
        | "sent"
        | "opened"
        | "replied"
        | "bounced"
        | "unsubscribed"
        | "completed"
      provider_type: "google" | "outlook" | "smtp"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_status: ["active", "paused", "error", "warming"],
      app_role: ["admin", "member", "viewer"],
      campaign_status: ["draft", "active", "paused", "completed"],
      event_type: [
        "sent",
        "opened",
        "clicked",
        "replied",
        "bounced",
        "unsubscribed",
      ],
      lead_status: [
        "active",
        "sent",
        "opened",
        "replied",
        "bounced",
        "unsubscribed",
        "completed",
      ],
      provider_type: ["google", "outlook", "smtp"],
    },
  },
} as const
