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
    };
    Views: { [_ in never]: never };
    Functions: {
      create_initial_organization: { Args: { organization_name: string; organization_slug?: string }; Returns: string };
      is_active_member: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
      is_active_admin: { Args: { target_organization: string; target_user?: string }; Returns: boolean };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
