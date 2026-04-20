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
      ai_runs: {
        Row: {
          assessment_id: string
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          model: string | null
          stage: string
          status: string
        }
        Insert: {
          assessment_id: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          model?: string | null
          stage: string
          status?: string
        }
        Update: {
          assessment_id?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          model?: string | null
          stage?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          client_name: string
          created_at: string
          created_by: string
          current_tools: string | null
          employee_count: number | null
          id: string
          industry: Database["public"]["Enums"]["industry_template"]
          locations: number | null
          notes: string | null
          status: Database["public"]["Enums"]["assessment_status"]
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          created_by: string
          current_tools?: string | null
          employee_count?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_template"]
          locations?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          created_by?: string
          current_tools?: string | null
          employee_count?: number | null
          id?: string
          industry?: Database["public"]["Enums"]["industry_template"]
          locations?: number | null
          notes?: string | null
          status?: Database["public"]["Enums"]["assessment_status"]
          updated_at?: string
        }
        Relationships: []
      }
      intake_responses: {
        Row: {
          answer: string | null
          assessment_id: string
          created_at: string
          id: string
          question_key: string
          question_label: string
          updated_at: string
        }
        Insert: {
          answer?: string | null
          assessment_id: string
          created_at?: string
          id?: string
          question_key: string
          question_label: string
          updated_at?: string
        }
        Update: {
          answer?: string | null
          assessment_id?: string
          created_at?: string
          id?: string
          question_key?: string
          question_label?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "intake_responses_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      pain_points: {
        Row: {
          assessment_id: string
          categories: Database["public"]["Enums"]["pain_category"][]
          confidence: number
          created_at: string
          description: string | null
          ease_of_fix: number
          evidence: string | null
          frequency: number
          friction: number
          id: string
          position: number
          priority: number | null
          revenue_impact: number
          root_cause: string | null
          severity: number
          time_waste: number
          title: string
          updated_at: string
        }
        Insert: {
          assessment_id: string
          categories?: Database["public"]["Enums"]["pain_category"][]
          confidence?: number
          created_at?: string
          description?: string | null
          ease_of_fix?: number
          evidence?: string | null
          frequency?: number
          friction?: number
          id?: string
          position?: number
          priority?: number | null
          revenue_impact?: number
          root_cause?: string | null
          severity?: number
          time_waste?: number
          title: string
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          categories?: Database["public"]["Enums"]["pain_category"][]
          confidence?: number
          created_at?: string
          description?: string | null
          ease_of_fix?: number
          evidence?: string | null
          frequency?: number
          friction?: number
          id?: string
          position?: number
          priority?: number | null
          revenue_impact?: number
          root_cause?: string | null
          severity?: number
          time_waste?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pain_points_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          assessment_id: string
          confidence: number | null
          created_at: string
          description: string
          effort_level: string | null
          estimated_impact: string | null
          id: string
          pain_point_id: string | null
          position: number
          rationale: string | null
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
          title: string
          tool_category: string | null
          tool_name: string | null
          updated_at: string
        }
        Insert: {
          assessment_id: string
          confidence?: number | null
          created_at?: string
          description: string
          effort_level?: string | null
          estimated_impact?: string | null
          id?: string
          pain_point_id?: string | null
          position?: number
          rationale?: string | null
          recommendation_type: Database["public"]["Enums"]["recommendation_type"]
          title: string
          tool_category?: string | null
          tool_name?: string | null
          updated_at?: string
        }
        Update: {
          assessment_id?: string
          confidence?: number | null
          created_at?: string
          description?: string
          effort_level?: string | null
          estimated_impact?: string | null
          id?: string
          pain_point_id?: string | null
          position?: number
          rationale?: string | null
          recommendation_type?: Database["public"]["Enums"]["recommendation_type"]
          title?: string
          tool_category?: string | null
          tool_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_pain_point_id_fkey"
            columns: ["pain_point_id"]
            isOneToOne: false
            referencedRelation: "pain_points"
            referencedColumns: ["id"]
          },
        ]
      }
      transcripts: {
        Row: {
          assessment_id: string
          content: string
          created_at: string
          id: string
          source: Database["public"]["Enums"]["transcript_source"]
        }
        Insert: {
          assessment_id: string
          content: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["transcript_source"]
        }
        Update: {
          assessment_id?: string
          content?: string
          created_at?: string
          id?: string
          source?: Database["public"]["Enums"]["transcript_source"]
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
      upsell_opportunities: {
        Row: {
          assessment_id: string
          created_at: string
          id: string
          linked_pain_point_titles: string[] | null
          offer_name: string
          scope: string | null
          suggested_price_range: string | null
          updated_at: string
          why_it_fits: string
        }
        Insert: {
          assessment_id: string
          created_at?: string
          id?: string
          linked_pain_point_titles?: string[] | null
          offer_name: string
          scope?: string | null
          suggested_price_range?: string | null
          updated_at?: string
          why_it_fits: string
        }
        Update: {
          assessment_id?: string
          created_at?: string
          id?: string
          linked_pain_point_titles?: string[] | null
          offer_name?: string
          scope?: string | null
          suggested_price_range?: string | null
          updated_at?: string
          why_it_fits?: string
        }
        Relationships: [
          {
            foreignKeyName: "upsell_opportunities_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      assessment_status:
        | "draft"
        | "intake"
        | "transcript"
        | "analyzing"
        | "review"
        | "complete"
      industry_template:
        | "retail"
        | "local_service"
        | "medical"
        | "dental_medspa"
        | "salon_barber"
        | "real_estate"
        | "home_services"
        | "other"
      pain_category: "process" | "people" | "tool" | "strategy"
      recommendation_type: "process" | "training" | "tool" | "phased"
      transcript_source: "paste" | "notes" | "zoom" | "voice_ai" | "other"
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
      assessment_status: [
        "draft",
        "intake",
        "transcript",
        "analyzing",
        "review",
        "complete",
      ],
      industry_template: [
        "retail",
        "local_service",
        "medical",
        "dental_medspa",
        "salon_barber",
        "real_estate",
        "home_services",
        "other",
      ],
      pain_category: ["process", "people", "tool", "strategy"],
      recommendation_type: ["process", "training", "tool", "phased"],
      transcript_source: ["paste", "notes", "zoom", "voice_ai", "other"],
    },
  },
} as const
