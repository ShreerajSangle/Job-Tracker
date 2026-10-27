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
      application_stages: {
        Row: {
          application_id: string
          completed_at: string | null
          created_at: string
          id: string
          name: string
          position: number
          stage_type: string
          started_at: string | null
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          position?: number
          stage_type?: string
          started_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          application_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          position?: number
          stage_type?: string
          started_at?: string | null
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      application_stage_events: {
        Row: {
          application_id: string
          event_type: string
          from_status: string | null
          id: string
          notes: string | null
          occurred_at: string
          stage_id: string | null
          stage_name_snapshot: string | null
          to_status: string | null
          user_id: string
        }
        Insert: {
          application_id: string
          event_type: string
          from_status?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          stage_id?: string | null
          stage_name_snapshot?: string | null
          to_status?: string | null
          user_id: string
        }
        Update: {
          application_id?: string
          event_type?: string
          from_status?: string | null
          id?: string
          notes?: string | null
          occurred_at?: string
          stage_id?: string | null
          stage_name_snapshot?: string | null
          to_status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          applied_on: string
          company: string
          created_at: string
          ever_interviewed: boolean
          id: string
          jd_text: string | null
          legacy_job_id: string | null
          location: string | null
          notes: string | null
          rejected_at: string | null
          rejected_stage_name: string | null
          resume_version_id: string | null
          role: string
          source: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          url: string | null
          user_id: string
        }
        Insert: {
          applied_on?: string
          company: string
          created_at?: string
          ever_interviewed?: boolean
          id?: string
          jd_text?: string | null
          legacy_job_id?: string | null
          location?: string | null
          notes?: string | null
          rejected_at?: string | null
          rejected_stage_name?: string | null
          resume_version_id?: string | null
          role: string
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Update: {
          applied_on?: string
          company?: string
          created_at?: string
          ever_interviewed?: boolean
          id?: string
          jd_text?: string | null
          legacy_job_id?: string | null
          location?: string | null
          notes?: string | null
          rejected_at?: string | null
          rejected_stage_name?: string | null
          resume_version_id?: string | null
          role?: string
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_resume_version_id_user_id_fkey"
            columns: ["resume_version_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resume_versions"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      resume_versions: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          resume_id: string
          user_id: string
          version: number
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          resume_id: string
          user_id?: string
          version: number
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          resume_id?: string
          user_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "resume_versions_resume_id_user_id_fkey"
            columns: ["resume_id", "user_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id", "user_id"]
          },
        ]
      }
      resumes: {
        Row: {
          archived_at: string | null
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name: string
          user_id?: string
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string
          daily_goal: number
          monthly_analysis_enabled: boolean
          portfolio_public: boolean
          portfolio_slug: string | null
          search_ends_on: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          monthly_analysis_enabled?: boolean
          portfolio_public?: boolean
          portfolio_slug?: string | null
          search_ends_on?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          monthly_analysis_enabled?: boolean
          portfolio_public?: boolean
          portfolio_slug?: string | null
          search_ends_on?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      application_stats: {
        Row: {
          applied: number | null
          interviews: number | null
          offers: number | null
          rejections: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_resume_version: {
        Args: { p_name: string; p_path: string; p_resume: string; p_size: number }
        Returns: Database["public"]["Tables"]["resume_versions"]["Row"]
      }
    }
    Enums: {
      application_status: "bookmarked" | "applied" | "interviewing" | "offer" | "rejected" | "withdrawn" | "ghosted"
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
      application_status: ["bookmarked", "applied", "interviewing", "offer", "rejected", "withdrawn", "ghosted"],
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
