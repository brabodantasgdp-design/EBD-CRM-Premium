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
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
