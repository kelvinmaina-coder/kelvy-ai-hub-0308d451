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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details_json: Json | null
          id: number
          ip_address: string | null
          resource: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details_json?: Json | null
          id?: number
          ip_address?: string | null
          resource?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details_json?: Json | null
          id?: number
          ip_address?: string | null
          resource?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      broadcast_notices: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: number
          message: string
          priority: string
          target_roles: string[] | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: number
          message: string
          priority?: string
          target_roles?: string[] | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: number
          message?: string
          priority?: string
          target_roles?: string[] | null
          title?: string
        }
        Relationships: []
      }
      calls: {
        Row: {
          call_type: string | null
          caller_id: string
          conversation_id: number | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: number
          receiver_id: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          call_type?: string | null
          caller_id: string
          conversation_id?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: number
          receiver_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          call_type?: string | null
          caller_id?: string
          conversation_id?: number | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: number
          receiver_id?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_history: {
        Row: {
          content: string | null
          created_at: string
          id: number
          image_url: string | null
          model: string | null
          role: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          model?: string | null
          role: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: number
          image_url?: string | null
          model?: string | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          contract_value: number | null
          created_at: string
          created_by: string | null
          email: string | null
          id: number
          mpesa_number: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          mpesa_number?: string | null
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          contract_value?: number | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: number
          mpesa_number?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversation_participants: {
        Row: {
          conversation_id: number
          id: number
          joined_at: string
          last_read_at: string | null
          muted: boolean
          role: string
          user_id: string
        }
        Insert: {
          conversation_id: number
          id?: number
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id: string
        }
        Update: {
          conversation_id?: number
          id?: number
          joined_at?: string
          last_read_at?: string | null
          muted?: boolean
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          created_by: string | null
          id: number
          name: string | null
          type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          type?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: number
          name?: string | null
          type?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          assigned_to: string | null
          client_id: number | null
          close_date: string | null
          created_at: string
          created_by: string | null
          id: number
          notes: string | null
          probability: number | null
          stage: string | null
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          client_id?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          probability?: number | null
          stage?: string | null
          title: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          client_id?: number | null
          close_date?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          notes?: string | null
          probability?: number | null
          stage?: string | null
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      dismissed_notices: {
        Row: {
          dismissed_at: string
          id: number
          notice_id: number
          user_id: string
        }
        Insert: {
          dismissed_at?: string
          id?: number
          notice_id: number
          user_id: string
        }
        Update: {
          dismissed_at?: string
          id?: number
          notice_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_notices_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "broadcast_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number | null
          approved_by: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expense_date: string | null
          id: number
          receipt_url: string | null
          vendor: string | null
        }
        Insert: {
          amount?: number | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          id?: number
          receipt_url?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number | null
          approved_by?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expense_date?: string | null
          id?: number
          receipt_url?: string | null
          vendor?: string | null
        }
        Relationships: []
      }
      interactions: {
        Row: {
          ai_summary: string | null
          client_id: number | null
          content: string | null
          created_at: string
          created_by: string | null
          id: number
          type: string
        }
        Insert: {
          ai_summary?: string | null
          client_id?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          type: string
        }
        Update: {
          ai_summary?: string | null
          client_id?: number | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: number
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          client_id: number | null
          created_at: string
          created_by: string | null
          due_date: string | null
          id: number
          invoice_number: string | null
          mpesa_ref: string | null
          paid_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: number
          invoice_number?: string | null
          mpesa_ref?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          due_date?: string | null
          id?: number
          invoice_number?: string | null
          mpesa_ref?: string | null
          paid_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          id: number
          joined_at: string | null
          meeting_id: number | null
          rsvp_status: string | null
          user_id: string
        }
        Insert: {
          id?: number
          joined_at?: string | null
          meeting_id?: number | null
          rsvp_status?: string | null
          user_id: string
        }
        Update: {
          id?: number
          joined_at?: string | null
          meeting_id?: number | null
          rsvp_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          host_id: string
          id: number
          meeting_link: string | null
          scheduled_at: string
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_id: string
          id?: number
          meeting_link?: string | null
          scheduled_at: string
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          host_id?: string
          id?: number
          meeting_link?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
        }
        Relationships: []
      }
      message_reads: {
        Row: {
          id: number
          message_id: number
          read_at: string
          user_id: string
        }
        Insert: {
          id?: number
          message_id: number
          read_at?: string
          user_id: string
        }
        Update: {
          id?: number
          message_id?: number
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string | null
          conversation_id: number
          created_at: string
          file_type: string | null
          file_url: string | null
          id: number
          is_deleted: boolean
          is_edited: boolean
          reply_to_id: number | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          conversation_id: number
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_deleted?: boolean
          is_edited?: boolean
          reply_to_id?: number | null
          sender_id: string
        }
        Update: {
          content?: string | null
          conversation_id?: number
          created_at?: string
          file_type?: string | null
          file_url?: string | null
          id?: number
          is_deleted?: boolean
          is_edited?: boolean
          reply_to_id?: number | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          browser_enabled: boolean
          digest_frequency: string
          email_enabled: boolean
          id: number
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          sms_enabled: boolean
          updated_at: string
          user_id: string
          whatsapp_enabled: boolean
        }
        Insert: {
          browser_enabled?: boolean
          digest_frequency?: string
          email_enabled?: boolean
          id?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
          whatsapp_enabled?: boolean
        }
        Update: {
          browser_enabled?: boolean
          digest_frequency?: string
          email_enabled?: boolean
          id?: number
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: number
          is_archived: boolean
          is_read: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: number
          is_archived?: boolean
          is_read?: boolean
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: number
          is_archived?: boolean
          is_read?: boolean
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          id: number
          invoice_id: number | null
          method: string | null
          mpesa_ref: string | null
          notes: string | null
        }
        Insert: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          id?: number
          invoice_id?: number | null
          method?: string | null
          mpesa_ref?: string | null
          notes?: string | null
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          id?: number
          invoice_id?: number | null
          method?: string | null
          mpesa_ref?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approved: boolean
          avatar_url: string | null
          company: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          approved?: boolean
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          approved?: boolean
          avatar_url?: string | null
          company?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          budget: number | null
          client_id: number | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          id: number
          name: string
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: number
          name: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: number
          name?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      push_tokens: {
        Row: {
          created_at: string
          device_type: string | null
          id: number
          last_used: string | null
          token: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          id?: number
          last_used?: string | null
          token: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_type?: string | null
          id?: number
          last_used?: string | null
          token?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          ai_analysis: string | null
          args: Json | null
          created_at: string
          created_by: string | null
          id: number
          raw_output: string | null
          severity: string | null
          target: string | null
          tool: string
        }
        Insert: {
          ai_analysis?: string | null
          args?: Json | null
          created_at?: string
          created_by?: string | null
          id?: number
          raw_output?: string | null
          severity?: string | null
          target?: string | null
          tool: string
        }
        Update: {
          ai_analysis?: string | null
          args?: Json | null
          created_at?: string
          created_by?: string | null
          id?: number
          raw_output?: string | null
          severity?: string | null
          target?: string | null
          tool?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          created_at: string
          description: string | null
          event_type: string | null
          id: number
          severity: string | null
          source_ip: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          id?: number
          severity?: string | null
          source_ip?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string | null
          id?: number
          severity?: string | null
          source_ip?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      service_request_updates: {
        Row: {
          actor_id: string
          created_at: string
          id: string
          note: string | null
          request_id: string
          status_from: string | null
          status_to: string | null
        }
        Insert: {
          actor_id: string
          created_at?: string
          id?: string
          note?: string | null
          request_id: string
          status_from?: string | null
          status_to?: string | null
        }
        Update: {
          actor_id?: string
          created_at?: string
          id?: string
          note?: string | null
          request_id?: string
          status_from?: string | null
          status_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_request_updates_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          admin_notes: string | null
          assigned_technician: string | null
          attachments: Json | null
          budget_kes: number | null
          category: string
          client_id: string
          completed_at: string | null
          created_at: string
          description: string
          feedback: string | null
          id: string
          location: string | null
          priority: string
          rating: number | null
          status: string
          technician_notes: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          assigned_technician?: string | null
          attachments?: Json | null
          budget_kes?: number | null
          category?: string
          client_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          feedback?: string | null
          id?: string
          location?: string | null
          priority?: string
          rating?: number | null
          status?: string
          technician_notes?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          assigned_technician?: string | null
          attachments?: Json | null
          budget_kes?: number | null
          category?: string
          client_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          feedback?: string | null
          id?: string
          location?: string | null
          priority?: string
          rating?: number | null
          status?: string
          technician_notes?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: number
          priority: string | null
          project_id: number | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string | null
          project_id?: number | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: number
          priority?: string | null
          project_id?: number | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      technician_profiles: {
        Row: {
          activated_at: string | null
          active: boolean
          availability: string
          bio: string | null
          created_at: string
          id: string
          invited_at: string
          invited_by: string | null
          jobs_completed: number
          rating: number
          specialty: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          active?: boolean
          availability?: string
          bio?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          jobs_completed?: number
          rating?: number
          specialty?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activated_at?: string | null
          active?: boolean
          availability?: string
          bio?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          jobs_completed?: number
          rating?: number
          specialty?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tickets: {
        Row: {
          assigned_to: string | null
          client_id: number | null
          created_at: string
          created_by: string | null
          description: string | null
          id: number
          priority: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          priority?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: number
          priority?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      user_conversation_ids: { Args: { _user_id: string }; Returns: number[] }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "manager"
        | "security_analyst"
        | "technician"
        | "client"
        | "guest"
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
      app_role: [
        "super_admin",
        "manager",
        "security_analyst",
        "technician",
        "client",
        "guest",
      ],
    },
  },
} as const
