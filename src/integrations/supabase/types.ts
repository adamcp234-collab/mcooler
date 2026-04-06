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
      ec_order_head: {
        Row: {
          booking_date: string
          booking_time: string
          cancel_reason: string | null
          completion_notes: string | null
          created_at: string | null
          cust_address_detail: string | null
          cust_email: string | null
          cust_latitude: number | null
          cust_longitude: number | null
          cust_name: string
          cust_whatsapp: string
          mitra_id: string | null
          notes: string | null
          order_id: string
          selected_services: Json
          status: Database["public"]["Enums"]["order_status"]
        }
        Insert: {
          booking_date: string
          booking_time: string
          cancel_reason?: string | null
          completion_notes?: string | null
          created_at?: string | null
          cust_address_detail?: string | null
          cust_email?: string | null
          cust_latitude?: number | null
          cust_longitude?: number | null
          cust_name: string
          cust_whatsapp: string
          mitra_id?: string | null
          notes?: string | null
          order_id: string
          selected_services?: Json
          status?: Database["public"]["Enums"]["order_status"]
        }
        Update: {
          booking_date?: string
          booking_time?: string
          cancel_reason?: string | null
          completion_notes?: string | null
          created_at?: string | null
          cust_address_detail?: string | null
          cust_email?: string | null
          cust_latitude?: number | null
          cust_longitude?: number | null
          cust_name?: string
          cust_whatsapp?: string
          mitra_id?: string | null
          notes?: string | null
          order_id?: string
          selected_services?: Json
          status?: Database["public"]["Enums"]["order_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ec_order_head_mitra_id_fkey"
            columns: ["mitra_id"]
            isOneToOne: false
            referencedRelation: "ms_mitra_det"
            referencedColumns: ["mitra_id"]
          },
        ]
      }
      master_services: {
        Row: {
          created_at: string
          id: string
          service_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_name: string
        }
        Update: {
          created_at?: string
          id?: string
          service_name?: string
        }
        Relationships: []
      }
      mitra_doc: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          id: string
          is_required: boolean | null
          mitra_id: string
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          id?: string
          is_required?: boolean | null
          mitra_id: string
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          id?: string
          is_required?: boolean | null
          mitra_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitra_doc_mitra_id_fkey"
            columns: ["mitra_id"]
            isOneToOne: false
            referencedRelation: "ms_mitra_det"
            referencedColumns: ["mitra_id"]
          },
        ]
      }
      ms_mitra_det: {
        Row: {
          address_full: string | null
          company_name: string
          created_at: string | null
          email: string | null
          is_active: boolean | null
          latitude: number | null
          longitude: number | null
          mitra_id: string
          operational_hours: Json | null
          registration_status: Database["public"]["Enums"]["vendor_reg_status"]
          slug: string
          updated_at: string | null
          whatsapp_number: string
        }
        Insert: {
          address_full?: string | null
          company_name: string
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mitra_id: string
          operational_hours?: Json | null
          registration_status?: Database["public"]["Enums"]["vendor_reg_status"]
          slug: string
          updated_at?: string | null
          whatsapp_number: string
        }
        Update: {
          address_full?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          is_active?: boolean | null
          latitude?: number | null
          longitude?: number | null
          mitra_id?: string
          operational_hours?: Json | null
          registration_status?: Database["public"]["Enums"]["vendor_reg_status"]
          slug?: string
          updated_at?: string | null
          whatsapp_number?: string
        }
        Relationships: []
      }
      ms_service_det: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          master_service_id: string
          mitra_id: string
          price: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          master_service_id: string
          mitra_id: string
          price?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          master_service_id?: string
          mitra_id?: string
          price?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ms_service_det_master_service_id_fkey"
            columns: ["master_service_id"]
            isOneToOne: false
            referencedRelation: "master_services"
            referencedColumns: ["id"]
          },
        ]
      }
      order_completion_photo: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          order_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          order_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_completion_photo_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ec_order_head"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_ratings: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_ratings_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "ec_order_head"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_reschedules: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          new_date: string
          new_time: string
          old_date: string
          old_time: string
          order_id: string
          reason: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string
          id?: string
          new_date: string
          new_time: string
          old_date: string
          old_time: string
          order_id: string
          reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          new_date?: string
          new_time?: string
          old_date?: string
          old_time?: string
          order_id?: string
          reason?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reschedules_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ec_order_head"
            referencedColumns: ["order_id"]
          },
        ]
      }
      order_status_log: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes: string | null
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Insert: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["order_status"]
          notes?: string | null
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_status_log_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ec_order_head"
            referencedColumns: ["order_id"]
          },
        ]
      }
      service_reminders: {
        Row: {
          created_at: string | null
          cust_name: string
          cust_whatsapp: string
          id: string
          is_sent: boolean
          mitra_id: string
          notes: string | null
          order_id: string
          reminder_date: string
          reminder_days: number
          sent_at: string | null
          service_summary: string
        }
        Insert: {
          created_at?: string | null
          cust_name: string
          cust_whatsapp: string
          id?: string
          is_sent?: boolean
          mitra_id: string
          notes?: string | null
          order_id: string
          reminder_date: string
          reminder_days?: number
          sent_at?: string | null
          service_summary: string
        }
        Update: {
          created_at?: string | null
          cust_name?: string
          cust_whatsapp?: string
          id?: string
          is_sent?: boolean
          mitra_id?: string
          notes?: string | null
          order_id?: string
          reminder_date?: string
          reminder_days?: number
          sent_at?: string | null
          service_summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "ec_order_head"
            referencedColumns: ["order_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_photos: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          id: string
          is_required: boolean
          mitra_id: string
          photo_type: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          id?: string
          is_required?: boolean
          mitra_id: string
          photo_type: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          id?: string
          is_required?: boolean
          mitra_id?: string
          photo_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_mitra_id_for_order: { Args: { _order_id: string }; Returns: string }
      get_mitra_id_for_user: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_vendor: { Args: never; Returns: boolean }
      is_vendor_owner: { Args: { _mitra_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "vendor"
      order_status:
        | "pending"
        | "confirmed"
        | "on_progress"
        | "done"
        | "cancelled"
      vendor_reg_status: "pending_verification" | "verified" | "rejected"
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
      app_role: ["admin", "vendor"],
      order_status: [
        "pending",
        "confirmed",
        "on_progress",
        "done",
        "cancelled",
      ],
      vendor_reg_status: ["pending_verification", "verified", "rejected"],
    },
  },
} as const
