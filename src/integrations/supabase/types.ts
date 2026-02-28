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
      job_documents: {
        Row: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_primary: boolean | null
          job_id: string
          uploaded_at: string | null
          user_id: string
        }
        Insert: {
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          job_id: string
          uploaded_at?: string | null
          user_id: string
        }
        Update: {
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          job_id?: string
          uploaded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_notes: {
        Row: {
          category: Database["public"]["Enums"]["note_category"] | null
          content: string
          created_at: string | null
          id: string
          job_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["note_category"] | null
          content: string
          created_at?: string | null
          id?: string
          job_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["note_category"] | null
          content?: string
          created_at?: string | null
          id?: string
          job_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_notes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_status_history: {
        Row: {
          changed_at: string | null
          from_status: Database["public"]["Enums"]["job_status"] | null
          id: string
          job_id: string
          reason: string | null
          to_status: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Insert: {
          changed_at?: string | null
          from_status?: Database["public"]["Enums"]["job_status"] | null
          id?: string
          job_id: string
          reason?: string | null
          to_status: Database["public"]["Enums"]["job_status"]
          user_id: string
        }
        Update: {
          changed_at?: string | null
          from_status?: Database["public"]["Enums"]["job_status"] | null
          id?: string
          job_id?: string
          reason?: string | null
          to_status?: Database["public"]["Enums"]["job_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_status_history_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applied_date: string | null
          company_name: string
          created_at: string | null
          currency: string | null
          deadline_date: string | null
          id: string
          job_description: string | null
          job_title: string
          job_url: string | null
          location: string | null
          notes: string | null
          salary_max: number | null
          salary_min: number | null
          source: Database["public"]["Enums"]["job_source"] | null
          status: Database["public"]["Enums"]["job_status"] | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          applied_date?: string | null
          company_name: string
          created_at?: string | null
          currency?: string | null
          deadline_date?: string | null
          id?: string
          job_description?: string | null
          job_title: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: Database["public"]["Enums"]["job_source"] | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          applied_date?: string | null
          company_name?: string
          created_at?: string | null
          currency?: string | null
          deadline_date?: string | null
          id?: string
          job_description?: string | null
          job_title?: string
          job_url?: string | null
          location?: string | null
          notes?: string | null
          salary_max?: number | null
          salary_min?: number | null
          source?: Database["public"]["Enums"]["job_source"] | null
          status?: Database["public"]["Enums"]["job_status"] | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      document_type:
        | "resume"
        | "cover_letter"
        | "offer_letter"
        | "assessment"
        | "feedback"
        | "other"
      job_source:
        | "linkedin"
        | "indeed"
        | "referral"
        | "company_site"
        | "recruiter"
        | "other"
      job_status:
        | "saved"
        | "applied"
        | "interviewing"
        | "offered"
        | "accepted"
        | "rejected"
        | "withdrawn"
      note_category: "general" | "call" | "email" | "feedback" | "reminder"
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
      document_type: [
        "resume",
        "cover_letter",
        "offer_letter",
        "assessment",
        "feedback",
        "other",
      ],
      job_source: [
        "linkedin",
        "indeed",
        "referral",
        "company_site",
        "recruiter",
        "other",
      ],
      job_status: [
        "saved",
        "applied",
        "interviewing",
        "offered",
        "accepted",
        "rejected",
        "withdrawn",
      ],
      note_category: ["general", "call", "email", "feedback", "reminder"],
    },
  },
} as const
