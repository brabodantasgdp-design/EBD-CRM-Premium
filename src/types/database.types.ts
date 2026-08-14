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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string
          description: string | null
          end_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          owner_id: string | null
          start_at: string
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          start_at: string
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          end_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          start_at?: string
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_logs: {
        Row: {
          context_summary: Json
          created_at: string
          entity_id: string | null
          entity_type: string | null
          feature: string
          id: string
          input_tokens: number | null
          latency_ms: number | null
          model: string
          organization_id: string
          output_tokens: number | null
          provider: string
          status: string
          user_id: string
        }
        Insert: {
          context_summary?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feature: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model: string
          organization_id: string
          output_tokens?: number | null
          provider: string
          status: string
          user_id: string
        }
        Update: {
          context_summary?: Json
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          feature?: string
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          model?: string
          organization_id?: string
          output_tokens?: number | null
          provider?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organization_id: string
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organization_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_runs: {
        Row: {
          attempt: number
          automation_id: string
          context: Json
          created_at: string
          depth: number
          error_code: string | null
          error_message_sanitized: string | null
          event_chain_id: string
          event_type: string
          finished_at: string | null
          id: string
          idempotency_key: string
          organization_id: string
          result: Json
          started_at: string | null
          status: string
          trigger_entity_id: string
          trigger_entity_type: string
        }
        Insert: {
          attempt?: number
          automation_id: string
          context?: Json
          created_at?: string
          depth?: number
          error_code?: string | null
          error_message_sanitized?: string | null
          event_chain_id: string
          event_type: string
          finished_at?: string | null
          id?: string
          idempotency_key: string
          organization_id: string
          result?: Json
          started_at?: string | null
          status?: string
          trigger_entity_id: string
          trigger_entity_type: string
        }
        Update: {
          attempt?: number
          automation_id?: string
          context?: Json
          created_at?: string
          depth?: number
          error_code?: string | null
          error_message_sanitized?: string | null
          event_chain_id?: string
          event_type?: string
          finished_at?: string | null
          id?: string
          idempotency_key?: string
          organization_id?: string
          result?: Json
          started_at?: string | null
          status?: string
          trigger_entity_id?: string
          trigger_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_runs_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automation_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      automations: {
        Row: {
          actions: Json
          archived_at: string | null
          conditions: Json
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          status: string
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          archived_at?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          status?: string
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          archived_at?: string | null
          conditions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          status?: string
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "automations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          address: Json | null
          archived_at: string | null
          cnpj: string | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          domain: string | null
          email: string | null
          employee_count: string | null
          estimated_revenue: string | null
          id: string
          legal_name: string | null
          name: string
          organization_id: string
          owner_id: string | null
          phone: string | null
          segment: string
          size: string
          source: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          address?: Json | null
          archived_at?: string | null
          cnpj?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          domain?: string | null
          email?: string | null
          employee_count?: string | null
          estimated_revenue?: string | null
          id?: string
          legal_name?: string | null
          name: string
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          segment?: string
          size?: string
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          address?: Json | null
          archived_at?: string | null
          cnpj?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          domain?: string | null
          email?: string | null
          employee_count?: string | null
          estimated_revenue?: string | null
          id?: string
          legal_name?: string | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          segment?: string
          size?: string
          source?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          archived_at: string | null
          company_id: string | null
          created_at: string
          created_by: string
          custom_fields: Json | null
          email: string | null
          first_name: string
          full_name: string
          id: string
          job_title: string | null
          last_name: string | null
          lifecycle_status: string
          mobile_phone: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          source: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string
          full_name: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          lifecycle_status?: string
          mobile_phone?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json | null
          email?: string | null
          first_name?: string
          full_name?: string
          id?: string
          job_title?: string | null
          last_name?: string | null
          lifecycle_status?: string
          mobile_phone?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deal_stage_history: {
        Row: {
          changed_by: string | null
          created_at: string
          deal_id: string
          from_pipeline_id: string | null
          from_stage_id: string | null
          id: string
          note: string | null
          organization_id: string
          to_pipeline_id: string
          to_stage_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          deal_id: string
          from_pipeline_id?: string | null
          from_stage_id?: string | null
          id?: string
          note?: string | null
          organization_id: string
          to_pipeline_id: string
          to_stage_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          deal_id?: string
          from_pipeline_id?: string | null
          from_stage_id?: string | null
          id?: string
          note?: string | null
          organization_id?: string
          to_pipeline_id?: string
          to_stage_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deal_history_deal_org_fk"
            columns: ["deal_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "deal_history_to_stage_fk"
            columns: ["to_stage_id", "to_pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id", "pipeline_id"]
          },
          {
            foreignKeyName: "deal_stage_history_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deal_stage_history_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          custom_fields?: Json
          expected_close_date?: string | null
          id?: string
          loss_note?: string | null
          loss_reason?: string | null
          lost_at?: string | null
          name: string
          organization_id: string
          owner_id?: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status?: string
          tags?: string[]
          updated_at?: string
          value?: number
          won_at?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          custom_fields?: Json
          expected_close_date?: string | null
          id?: string
          loss_note?: string | null
          loss_reason?: string | null
          lost_at?: string | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          pipeline_id?: string
          probability?: number
          stage_id?: string
          status?: string
          tags?: string[]
          updated_at?: string
          value?: number
          won_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_company_fk"
            columns: ["company_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "deals_contact_fk"
            columns: ["contact_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_pipeline_fk"
            columns: ["pipeline_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "deals_stage_fk"
            columns: ["stage_id", "pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_stages"
            referencedColumns: ["id", "pipeline_id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          archived_at: string | null
          automation_id: string | null
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          entity_id: string
          entity_type: string
          id: string
          organization_id: string
          owner_id: string | null
          payload: Json
          processed_at: string | null
          processing_attempts: number
          scheduled_for: string
          source: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          automation_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          entity_id: string
          entity_type: string
          id?: string
          organization_id: string
          owner_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_attempts?: number
          scheduled_for: string
          source?: string
          status?: string
          type: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          automation_id?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          entity_id?: string
          entity_type?: string
          id?: string
          organization_id?: string
          owner_id?: string | null
          payload?: Json
          processed_at?: string | null
          processing_attempts?: number
          scheduled_for?: string
          source?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_automation_id_fkey"
            columns: ["automation_id"]
            isOneToOne: false
            referencedRelation: "automations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follow_ups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          archived_at: string | null
          company_name: string | null
          converted_at: string | null
          converted_company_id: string | null
          converted_contact_id: string | null
          converted_deal_id: string | null
          created_at: string
          created_by: string
          custom_fields: Json
          email: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string | null
          phone: string | null
          score: number | null
          source: string | null
          status: string
          tags: string[]
          temperature: string | null
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          company_name?: string | null
          converted_at?: string | null
          converted_company_id?: string | null
          converted_contact_id?: string | null
          converted_deal_id?: string | null
          created_at?: string
          created_by: string
          custom_fields?: Json
          email?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string
          tags?: string[]
          temperature?: string | null
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          company_name?: string | null
          converted_at?: string | null
          converted_company_id?: string | null
          converted_contact_id?: string | null
          converted_deal_id?: string | null
          created_at?: string
          created_by?: string
          custom_fields?: Json
          email?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          score?: number | null
          source?: string | null
          status?: string
          tags?: string[]
          temperature?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_ai_settings: {
        Row: {
          created_at: string
          created_by: string | null
          enabled: boolean
          encrypted_api_key: string
          id: string
          key_last_four: string | null
          model: string
          organization_id: string
          provider: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          encrypted_api_key: string
          id?: string
          key_last_four?: string | null
          model: string
          organization_id: string
          provider: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          enabled?: boolean
          encrypted_api_key?: string
          id?: string
          key_last_four?: string | null
          model?: string
          organization_id?: string
          provider?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_ai_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          role: string
          status: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          role: string
          status?: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: string
          status?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_stages: {
        Row: {
          archived_at: string | null
          color: string | null
          created_at: string
          id: string
          name: string
          organization_id: string
          pipeline_id: string
          position: number
          probability: number
          stage_type: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name: string
          organization_id: string
          pipeline_id: string
          position: number
          probability: number
          stage_type?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          color?: string | null
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          pipeline_id?: string
          position?: number
          probability?: number
          stage_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pipeline_stages_pipeline_fk"
            columns: ["pipeline_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "pipelines"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      pipelines: {
        Row: {
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_default: boolean
          name: string
          organization_id: string
          position: number
          status: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          organization_id: string
          position?: number
          status?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          organization_id?: string
          position?: number
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipelines_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          sku: string | null
          status: string
          unit: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          sku?: string | null
          status?: string
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          sku?: string | null
          status?: string
          unit?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      proposal_items: {
        Row: {
          created_at: string
          description: string
          discount: number
          id: string
          line_total: number
          organization_id: string
          position: number
          product_id: string | null
          proposal_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          discount?: number
          id?: string
          line_total: number
          organization_id: string
          position?: number
          product_id?: string | null
          proposal_id: string
          quantity: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          discount?: number
          id?: string
          line_total?: number
          organization_id?: string
          position?: number
          product_id?: string | null
          proposal_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_items_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_number_counters: {
        Row: {
          next_number: number
          organization_id: string
        }
        Insert: {
          next_number?: number
          organization_id: string
        }
        Update: {
          next_number?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_number_counters_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proposals: {
        Row: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          deal_id: string
          discount: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          status: string
          subtotal: number
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by: string
          currency?: string
          deal_id: string
          discount?: number
          id?: string
          notes?: string | null
          number: string
          organization_id: string
          status?: string
          subtotal?: number
          title: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          archived_at?: string | null
          company_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string
          currency?: string
          deal_id?: string
          discount?: number
          id?: string
          notes?: string | null
          number?: string
          organization_id?: string
          status?: string
          subtotal?: number
          title?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          archived_at: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_at: string | null
          due_date: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          organization_id: string
          owner_id: string | null
          priority: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          priority?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_at?: string | null
          due_date?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          priority?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invite: {
        Args: { target_hash: string }
        Returns: string
      }
      archive_deal: {
        Args: { target_deal: string }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      can_manage_automations: {
        Args: { target_org: string; target_user?: string }
        Returns: boolean
      }
      can_manage_members: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      can_manage_pipeline: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      can_operate_deal: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      can_operate_lead: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      can_operate_task_activity: {
        Args: { target_org: string; target_user?: string }
        Returns: boolean
      }
      can_view_profile: {
        Args: { target_user: string; viewer?: string }
        Returns: boolean
      }
      can_write_commercial: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      change_member_role: {
        Args: { target_member: string; target_role: string }
        Returns: boolean
      }
      convert_lead: {
        Args: {
          target_company_name?: string
          target_contact_name?: string
          target_deal_name?: string
          target_lead: string
          target_pipeline: string
          target_stage: string
          target_value?: number
        }
        Returns: Json
      }
      create_audit_log: {
        Args: {
          target_action: string
          target_entity_id?: string
          target_entity_type: string
          target_metadata?: Json
          target_org: string
        }
        Returns: undefined
      }
      create_initial_organization: {
        Args: { organization_name: string; organization_slug?: string }
        Returns: string
      }
      create_organization_invite: {
        Args: {
          target_email: string
          target_expires_at: string
          target_org: string
          target_role: string
          target_token_hash: string
        }
        Returns: string
      }
      create_proposal: {
        Args: {
          target_company?: string
          target_contact?: string
          target_currency: string
          target_deal: string
          target_discount: number
          target_items?: Json
          target_notes: string
          target_org: string
          target_title: string
          target_valid_until: string
        }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          deal_id: string
          discount: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          status: string
          subtotal: number
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        SetofOptions: {
          from: "*"
          to: "proposals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      entity_belongs_to_org: {
        Args: { target_id: string; target_org: string; target_type: string }
        Returns: boolean
      }
      is_active_admin: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      is_active_member: {
        Args: { target_organization: string; target_user?: string }
        Returns: boolean
      }
      mark_deal_lost: {
        Args: {
          target_deal: string
          target_note?: string
          target_reason: string
          target_stage?: string
        }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_deal_won: {
        Args: { target_deal: string; target_stage?: string }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      move_deal_stage: {
        Args: {
          target_deal: string
          target_note?: string
          target_pipeline: string
          target_stage: string
        }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      reopen_deal: {
        Args: {
          target_deal: string
          target_pipeline: string
          target_stage: string
        }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          custom_fields: Json
          expected_close_date: string | null
          id: string
          loss_note: string | null
          loss_reason: string | null
          lost_at: string | null
          name: string
          organization_id: string
          owner_id: string | null
          pipeline_id: string
          probability: number
          stage_id: string
          status: string
          tags: string[]
          updated_at: string
          value: number
          won_at: string | null
        }
        SetofOptions: {
          from: "*"
          to: "deals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      replace_proposal_items: {
        Args: {
          target_items: Json
          target_org: string
          target_proposal: string
        }
        Returns: {
          archived_at: string | null
          company_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string
          currency: string
          deal_id: string
          discount: number
          id: string
          notes: string | null
          number: string
          organization_id: string
          status: string
          subtotal: number
          title: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        SetofOptions: {
          from: "*"
          to: "proposals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_organization_invite: {
        Args: { target_invite: string }
        Returns: boolean
      }
      seed_default_pipeline: {
        Args: { target_organization: string; target_user?: string }
        Returns: string
      }
      set_member_status: {
        Args: { target_member: string; target_status: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
