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
      application_details: {
        Row: {
          created_at: string
          date_of_birth: string | null
          desired_job: string | null
          district: string | null
          email: string | null
          father_status: string | null
          full_name: string | null
          gender: string | null
          has_passport: boolean | null
          id: string
          mother_status: string | null
          nationality: string | null
          next_of_kin_name: string | null
          next_of_kin_phone: string | null
          next_of_kin_relationship: string | null
          nin: string | null
          nin_issue: string | null
          passport_number: string | null
          passport_photo_path: string | null
          phone: string | null
          salary_expectation_ugx: number | null
          submitted: boolean
          updated_at: string
          user_id: string
          village: string | null
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          desired_job?: string | null
          district?: string | null
          email?: string | null
          father_status?: string | null
          full_name?: string | null
          gender?: string | null
          has_passport?: boolean | null
          id?: string
          mother_status?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          nin_issue?: string | null
          passport_number?: string | null
          passport_photo_path?: string | null
          phone?: string | null
          salary_expectation_ugx?: number | null
          submitted?: boolean
          updated_at?: string
          user_id: string
          village?: string | null
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          desired_job?: string | null
          district?: string | null
          email?: string | null
          father_status?: string | null
          full_name?: string | null
          gender?: string | null
          has_passport?: boolean | null
          id?: string
          mother_status?: string | null
          nationality?: string | null
          next_of_kin_name?: string | null
          next_of_kin_phone?: string | null
          next_of_kin_relationship?: string | null
          nin?: string | null
          nin_issue?: string | null
          passport_number?: string | null
          passport_photo_path?: string | null
          phone?: string | null
          salary_expectation_ugx?: number | null
          submitted?: boolean
          updated_at?: string
          user_id?: string
          village?: string | null
        }
        Relationships: []
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_by: string | null
          created_at: string
          id: string
          notes: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          application_id: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          application_id?: string
          changed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          admin_notes: string | null
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          subject?: string | null
        }
        Relationships: []
      }
      documents: {
        Row: {
          admin_notes: string | null
          created_at: string
          file_name: string | null
          file_path: string
          id: string
          status: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          file_name?: string | null
          file_path: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          type: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          file_name?: string | null
          file_path?: string
          id?: string
          status?: Database["public"]["Enums"]["document_status"]
          type?: Database["public"]["Enums"]["document_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_due: number
          amount_paid: number
          balance: number
          created_at: string
          created_by: string | null
          id: string
          invoice_number: string
          notes: string | null
          service: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_due?: number
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number: string
          notes?: string | null
          service: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number
          balance?: number
          created_at?: string
          created_by?: string | null
          id?: string
          invoice_number?: string
          notes?: string | null
          service?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          currency: string | null
          deadline: string | null
          description: string
          employer: string | null
          employment_type: Database["public"]["Enums"]["employment_type"] | null
          id: string
          is_active: boolean
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          slots: number | null
          title: string
          updated_at: string
        }
        Insert: {
          city?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deadline?: string | null
          description: string
          employer?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slots?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deadline?: string | null
          description?: string
          employer?: string | null
          employment_type?:
            | Database["public"]["Enums"]["employment_type"]
            | null
          id?: string
          is_active?: boolean
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          slots?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          application_id: string | null
          balance: number
          created_at: string
          created_by: string | null
          currency: string | null
          id: string
          method: string | null
          notes: string | null
          payment_type: Database["public"]["Enums"]["payment_type"]
          receipt_url: string | null
          reference: string | null
          service_description: string | null
          status: Database["public"]["Enums"]["payment_status"]
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          application_id?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          receipt_url?: string | null
          reference?: string | null
          service_description?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          application_id?: string | null
          balance?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          id?: string
          method?: string | null
          notes?: string | null
          payment_type?: Database["public"]["Enums"]["payment_type"]
          receipt_url?: string | null
          reference?: string | null
          service_description?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          applicant_code: string | null
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          district: string | null
          education_level: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          is_walk_in: boolean
          nationality: string | null
          phone: string | null
          profession: string | null
          updated_at: string
          years_experience: number | null
        }
        Insert: {
          address?: string | null
          applicant_code?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          is_walk_in?: boolean
          nationality?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Update: {
          address?: string | null
          applicant_code?: string | null
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          district?: string | null
          education_level?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          is_walk_in?: boolean
          nationality?: string | null
          phone?: string | null
          profession?: string | null
          updated_at?: string
          years_experience?: number | null
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string
          id: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
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
          role: Database["public"]["Enums"]["app_role"]
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
    }
    Enums: {
      app_role: "admin" | "applicant"
      application_status:
        | "registration_submitted"
        | "documents_pending"
        | "documents_verified"
        | "interview_scheduled"
        | "interview_passed"
        | "medical_check_pending"
        | "visa_processing"
        | "visa_approved"
        | "flight_scheduled"
        | "deployed_abroad"
        | "rejected"
      document_status: "pending" | "verified" | "rejected"
      document_type:
        | "passport"
        | "cv"
        | "national_id"
        | "passport_photo"
        | "medical"
      employment_type: "full_time" | "part_time" | "contract" | "temporary"
      payment_status: "pending" | "partial" | "paid" | "overdue" | "verified"
      payment_type:
        | "passport_processing"
        | "nin_assistance"
        | "recruitment_processing"
        | "other"
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
      app_role: ["admin", "applicant"],
      application_status: [
        "registration_submitted",
        "documents_pending",
        "documents_verified",
        "interview_scheduled",
        "interview_passed",
        "medical_check_pending",
        "visa_processing",
        "visa_approved",
        "flight_scheduled",
        "deployed_abroad",
        "rejected",
      ],
      document_status: ["pending", "verified", "rejected"],
      document_type: [
        "passport",
        "cv",
        "national_id",
        "passport_photo",
        "medical",
      ],
      employment_type: ["full_time", "part_time", "contract", "temporary"],
      payment_status: ["pending", "partial", "paid", "overdue", "verified"],
      payment_type: [
        "passport_processing",
        "nin_assistance",
        "recruitment_processing",
        "other",
      ],
    },
  },
} as const
