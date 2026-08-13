/** Generated from the linked Supabase development schema with `supabase gen types typescript --linked`. */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.15" };
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      organizations: {
        Row: { id: string; name: string; slug: string | null; status: string; created_by: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; slug?: string | null; status?: string; created_by?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; name?: string; slug?: string | null; status?: string; created_by?: string | null; created_at?: string; updated_at?: string };
        Relationships: [];
      };
      organization_members: {
        Row: { id: string; organization_id: string; user_id: string; role: string; status: string; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; user_id: string; role: string; status?: string; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; user_id?: string; role?: string; status?: string; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "organization_members_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      organization_invites: {
        Row: { id: string; organization_id: string; email: string; role: string; status: string; token_hash: string; invited_by: string; expires_at: string; accepted_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; email: string; role: string; status?: string; token_hash: string; invited_by: string; expires_at: string; accepted_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; email?: string; role?: string; status?: string; token_hash?: string; invited_by?: string; expires_at?: string; accepted_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "organization_invites_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      audit_logs: {
        Row: { id: string; organization_id: string; actor_user_id: string; action: string; entity_type: string; entity_id: string | null; metadata: Json; created_at: string };
        Insert: { id?: string; organization_id: string; actor_user_id: string; action: string; entity_type: string; entity_id?: string | null; metadata?: Json; created_at?: string };
        Update: { id?: string; organization_id?: string; actor_user_id?: string; action?: string; entity_type?: string; entity_id?: string | null; metadata?: Json; created_at?: string };
        Relationships: [];
      };
      companies: {
        Row: { id: string; organization_id: string; name: string; legal_name: string | null; cnpj: string | null; domain: string | null; phone: string | null; email: string | null; segment: string; size: string; employee_count: string | null; estimated_revenue: string | null; status: string; owner_id: string | null; source: string | null; tags: string[]; address: Json | null; custom_fields: Json | null; created_by: string; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; name: string; legal_name?: string | null; cnpj?: string | null; domain?: string | null; phone?: string | null; email?: string | null; segment?: string; size?: string; employee_count?: string | null; estimated_revenue?: string | null; status?: string; owner_id?: string | null; source?: string | null; tags?: string[]; address?: Json | null; custom_fields?: Json | null; created_by: string; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; name?: string; legal_name?: string | null; cnpj?: string | null; domain?: string | null; phone?: string | null; email?: string | null; segment?: string; size?: string; employee_count?: string | null; estimated_revenue?: string | null; status?: string; owner_id?: string | null; source?: string | null; tags?: string[]; address?: Json | null; custom_fields?: Json | null; created_by?: string; archived_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "companies_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      contacts: {
        Row: { id: string; organization_id: string; first_name: string; last_name: string | null; full_name: string; email: string | null; phone: string | null; mobile_phone: string | null; job_title: string | null; company_id: string | null; owner_id: string | null; lifecycle_status: string; source: string | null; tags: string[]; custom_fields: Json | null; created_by: string; archived_at: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; organization_id: string; first_name?: string; last_name?: string | null; full_name: string; email?: string | null; phone?: string | null; mobile_phone?: string | null; job_title?: string | null; company_id?: string | null; owner_id?: string | null; lifecycle_status?: string; source?: string | null; tags?: string[]; custom_fields?: Json | null; created_by: string; archived_at?: string | null; created_at?: string; updated_at?: string };
        Update: { id?: string; organization_id?: string; first_name?: string; last_name?: string | null; full_name?: string; email?: string | null; phone?: string | null; mobile_phone?: string | null; job_title?: string | null; company_id?: string | null; owner_id?: string | null; lifecycle_status?: string; source?: string | null; tags?: string[]; custom_fields?: Json | null; created_by?: string; archived_at?: string | null; created_at?: string; updated_at?: string };
        Relationships: [{ foreignKeyName: "contacts_company_id_fkey"; columns: ["company_id"]; isOneToOne: false; referencedRelation: "companies"; referencedColumns: ["id"] }, { foreignKeyName: "contacts_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      pipelines: {
        Row: { id: string; organization_id: string; name: string; description: string | null; status: string; is_default: boolean; position: number; created_by: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; name: string; description?: string | null; status?: string; is_default?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; name?: string; description?: string | null; status?: string; is_default?: boolean; position?: number; created_by?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [{ foreignKeyName: "pipelines_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }];
      };
      pipeline_stages: {
        Row: { id: string; organization_id: string; pipeline_id: string; name: string; position: number; probability: number; color: string | null; stage_type: string; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; pipeline_id: string; name: string; position: number; probability: number; color?: string | null; stage_type?: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; pipeline_id?: string; name?: string; position?: number; probability?: number; color?: string | null; stage_type?: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [{ foreignKeyName: "pipeline_stages_pipeline_fk"; columns: ["pipeline_id", "organization_id"]; isOneToOne: false; referencedRelation: "pipelines"; referencedColumns: ["id", "organization_id"] }];
      };
      deals: {
        Row: { id: string; organization_id: string; name: string; company_id: string | null; contact_id: string | null; pipeline_id: string; stage_id: string; owner_id: string | null; value: number; currency: string; probability: number; status: string; expected_close_date: string | null; loss_reason: string | null; loss_note: string | null; won_at: string | null; lost_at: string | null; tags: string[]; custom_fields: Json; created_by: string; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; name: string; company_id?: string | null; contact_id?: string | null; pipeline_id: string; stage_id: string; owner_id?: string | null; value?: number; currency?: string; probability: number; status?: string; expected_close_date?: string | null; loss_reason?: string | null; loss_note?: string | null; won_at?: string | null; lost_at?: string | null; tags?: string[]; custom_fields?: Json; created_by: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; name?: string; company_id?: string | null; contact_id?: string | null; pipeline_id?: string; stage_id?: string; owner_id?: string | null; value?: number; currency?: string; probability?: number; status?: string; expected_close_date?: string | null; loss_reason?: string | null; loss_note?: string | null; won_at?: string | null; lost_at?: string | null; tags?: string[]; custom_fields?: Json; created_by?: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      leads: {
        Row: { id: string; organization_id: string; name: string; company_name: string | null; email: string | null; phone: string | null; status: string; source: string | null; owner_id: string | null; score: number | null; temperature: string | null; tags: string[]; custom_fields: Json; converted_at: string | null; converted_contact_id: string | null; converted_company_id: string | null; converted_deal_id: string | null; created_by: string; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; name: string; company_name?: string | null; email?: string | null; phone?: string | null; status?: string; source?: string | null; owner_id?: string | null; score?: number | null; temperature?: string | null; tags?: string[]; custom_fields?: Json; converted_at?: string | null; converted_contact_id?: string | null; converted_company_id?: string | null; converted_deal_id?: string | null; created_by: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; name?: string; company_name?: string | null; email?: string | null; phone?: string | null; status?: string; source?: string | null; owner_id?: string | null; score?: number | null; temperature?: string | null; tags?: string[]; custom_fields?: Json; converted_at?: string | null; converted_contact_id?: string | null; converted_company_id?: string | null; converted_deal_id?: string | null; created_by?: string; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      tasks: {
        Row: { id: string; organization_id: string; title: string; description: string | null; status: string; priority: string | null; due_date: string | null; due_at: string | null; completed_at: string | null; owner_id: string | null; created_by: string; entity_type: string | null; entity_id: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; title: string; description?: string | null; status?: string; priority?: string | null; due_date?: string | null; due_at?: string | null; completed_at?: string | null; owner_id?: string | null; created_by: string; entity_type?: string | null; entity_id?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; title?: string; description?: string | null; status?: string; priority?: string | null; due_date?: string | null; due_at?: string | null; completed_at?: string | null; owner_id?: string | null; created_by?: string; entity_type?: string | null; entity_id?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      activities: {
        Row: { id: string; organization_id: string; type: string; title: string; description: string | null; status: string; start_at: string; end_at: string | null; owner_id: string | null; created_by: string; entity_type: string | null; entity_id: string | null; created_at: string; updated_at: string; archived_at: string | null };
        Insert: { id?: string; organization_id: string; type: string; title: string; description?: string | null; status?: string; start_at: string; end_at?: string | null; owner_id?: string | null; created_by: string; entity_type?: string | null; entity_id?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Update: { id?: string; organization_id?: string; type?: string; title?: string; description?: string | null; status?: string; start_at?: string; end_at?: string | null; owner_id?: string | null; created_by?: string; entity_type?: string | null; entity_id?: string | null; created_at?: string; updated_at?: string; archived_at?: string | null };
        Relationships: [];
      };
      deal_stage_history: {
        Row: { id: string; organization_id: string; deal_id: string; from_pipeline_id: string | null; from_stage_id: string | null; to_pipeline_id: string; to_stage_id: string; changed_by: string | null; note: string | null; created_at: string };
        Insert: { id?: string; organization_id: string; deal_id: string; from_pipeline_id?: string | null; from_stage_id?: string | null; to_pipeline_id: string; to_stage_id: string; changed_by?: string | null; note?: string | null; created_at?: string };
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      create_initial_organization: { Args: { organization_name: string; organization_slug?: string }; Returns: string };
      is_active_member: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      is_active_admin: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      can_manage_members: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      create_audit_log: { Args: { target_org: string; target_action: string; target_entity_type: string; target_entity_id?: string | null; target_metadata?: Json }; Returns: undefined };
      create_organization_invite: { Args: { target_org: string; target_email: string; target_role: string; target_token_hash: string; target_expires_at: string }; Returns: string };
      change_member_role: { Args: { target_member: string; target_role: string }; Returns: boolean };
      set_member_status: { Args: { target_member: string; target_status: string }; Returns: boolean };
      revoke_organization_invite: { Args: { target_invite: string }; Returns: boolean };
      accept_organization_invite: { Args: { target_hash: string }; Returns: string };
      can_write_commercial: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      can_view_profile: { Args: { target_user: string; viewer?: string }; Returns: boolean };
      can_manage_pipeline: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      can_operate_deal: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      entity_belongs_to_org: { Args: { target_org: string; target_type: string; target_id: string }; Returns: boolean };
      can_operate_task_activity: { Args: { target_org: string; target_user?: string }; Returns: boolean };
      move_deal_stage: { Args: { target_deal: string; target_pipeline: string; target_stage: string; target_note?: string | null }; Returns: Database["public"]["Tables"]["deals"]["Row"] };
      mark_deal_won: { Args: { target_deal: string; target_stage?: string | null }; Returns: Database["public"]["Tables"]["deals"]["Row"] };
      mark_deal_lost: { Args: { target_deal: string; target_reason: string; target_note?: string | null; target_stage?: string | null }; Returns: Database["public"]["Tables"]["deals"]["Row"] };
      reopen_deal: { Args: { target_deal: string; target_pipeline: string; target_stage: string }; Returns: Database["public"]["Tables"]["deals"]["Row"] };
      archive_deal: { Args: { target_deal: string }; Returns: Database["public"]["Tables"]["deals"]["Row"] };
      can_operate_lead: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      convert_lead: { Args: { target_lead: string; target_pipeline: string; target_stage: string; target_company_name?: string | null; target_contact_name?: string | null; target_deal_name?: string | null; target_value?: number }; Returns: Json };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
