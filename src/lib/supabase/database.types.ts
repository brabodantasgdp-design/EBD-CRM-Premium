export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; full_name: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; full_name?: string | null; avatar_url?: string | null; created_at?: string; updated_at?: string };
        Update: { full_name?: string | null; avatar_url?: string | null; updated_at?: string };
      };
      organizations: {
        Row: { id: string; name: string; slug: string | null; status: string; created_by: string | null; created_at: string; updated_at: string };
        Insert: { name: string; slug?: string | null; status?: string; created_by?: string | null };
        Update: { name?: string; slug?: string | null; status?: string; updated_at?: string };
      };
      organization_members: {
        Row: { id: string; organization_id: string; user_id: string; role: string; status: string; created_at: string; updated_at: string };
        Insert: { organization_id: string; user_id: string; role: string; status?: string };
        Update: { role?: string; status?: string; updated_at?: string };
      };
    };
    Functions: {
      create_initial_organization: { Args: { organization_name: string; organization_slug?: string }; Returns: string };
    };
  };
};
