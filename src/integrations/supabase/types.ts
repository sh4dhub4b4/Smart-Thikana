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
      agreements: {
        Row: {
          agreed_price: number
          conversation_id: string
          created_at: string
          id: string
          landlord_id: string
          listing_id: string
          status: Database["public"]["Enums"]["agreement_status"]
          tenant_id: string
          updated_at: string
        }
        Insert: {
          agreed_price: number
          conversation_id: string
          created_at?: string
          id?: string
          landlord_id: string
          listing_id: string
          status?: Database["public"]["Enums"]["agreement_status"]
          tenant_id: string
          updated_at?: string
        }
        Update: {
          agreed_price?: number
          conversation_id?: string
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          status?: Database["public"]["Enums"]["agreement_status"]
          tenant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agreements_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agreements_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          landlord_id: string
          listing_id: string
          tenant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          landlord_id: string
          listing_id: string
          tenant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          area_sqft: number | null
          bathrooms: number
          bedrooms: number
          created_at: string
          description: string
          id: string
          images: string[]
          is_active: boolean
          landlord_id: string
          location: string
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          title: string
          updated_at: string
        }
        Insert: {
          area_sqft?: number | null
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          landlord_id: string
          location: string
          price: number
          property_type?: Database["public"]["Enums"]["property_type"]
          title: string
          updated_at?: string
        }
        Update: {
          area_sqft?: number | null
          bathrooms?: number
          bedrooms?: number
          created_at?: string
          description?: string
          id?: string
          images?: string[]
          is_active?: boolean
          landlord_id?: string
          location?: string
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          agreement_id: string
          amount: number
          created_at: string
          id: string
          invoice_id: string | null
          landlord_id: string
          listing_id: string
          receipt_number: string
          status: Database["public"]["Enums"]["payment_status"]
          tax_deducted: boolean
          tenant_id: string
        }
        Insert: {
          agreement_id: string
          amount: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          landlord_id: string
          listing_id: string
          receipt_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tax_deducted?: boolean
          tenant_id: string
        }
        Update: {
          agreement_id?: string
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          landlord_id?: string
          listing_id?: string
          receipt_number?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tax_deducted?: boolean
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "agreements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          preferences: Json | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string
          id: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          preferences?: Json | null
          updated_at?: string
        }
        Relationships: []
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
      feedback: {
        Row: {
          author_id: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment: string | null
          created_at: string
          id: string
          rating: number
          subject_id: string
        }
        Insert: {
          author_id: string
          author_role: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          subject_id: string
        }
        Update: {
          author_id?: string
          author_role?: Database["public"]["Enums"]["app_role"]
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          subject_id?: string
        }
        Relationships: []
      }
      kyc: {
        Row: {
          created_at: string
          id: string
          nid_back_url: string | null
          nid_front_url: string | null
          nid_number: string | null
          notes: string | null
          selfie_url: string | null
          status: Database["public"]["Enums"]["kyc_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nid_back_url?: string | null
          nid_front_url?: string | null
          nid_number?: string | null
          notes?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nid_back_url?: string | null
          nid_front_url?: string | null
          nid_number?: string | null
          notes?: string | null
          selfie_url?: string | null
          status?: Database["public"]["Enums"]["kyc_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ledger_entries: {
        Row: {
          created_at: string
          credit: number | null
          debit: number | null
          description: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id: string
          payment_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_type: Database["public"]["Enums"]["entry_type"]
          id?: string
          payment_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          entry_type?: Database["public"]["Enums"]["entry_type"]
          id?: string
          payment_id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      rent_invoices: {
        Row: {
          agreement_id: string
          amount_due: number
          billing_month: string
          created_at: string
          due_date: string
          id: string
          landlord_id: string
          listing_id: string
          status: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          type: string
        }
        Insert: {
          agreement_id: string
          amount_due: number
          billing_month: string
          created_at?: string
          due_date: string
          id?: string
          landlord_id: string
          listing_id: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id: string
          type?: string
        }
        Update: {
          agreement_id?: string
          amount_due?: number
          billing_month?: string
          created_at?: string
          due_date?: string
          id?: string
          landlord_id?: string
          listing_id?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          tenant_id?: string
          type?: string
        }
        Relationships: []
      }
      tax_transactions: {
        Row: {
          advance_tax_amount: number
          created_at: string
          gross_rent: number
          id: string
          landlord_id: string
          net_to_landlord: number
          payment_id: string
          platform_fee: number
          tax_year: string
          tds_amount: number
        }
        Insert: {
          advance_tax_amount?: number
          created_at?: string
          gross_rent: number
          id?: string
          landlord_id: string
          net_to_landlord?: number
          payment_id: string
          platform_fee?: number
          tax_year: string
          tds_amount?: number
        }
        Update: {
          advance_tax_amount?: number
          created_at?: string
          gross_rent?: number
          id?: string
          landlord_id?: string
          net_to_landlord?: number
          payment_id?: string
          platform_fee?: number
          tax_year?: string
          tds_amount?: number
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
      agreement_status: "pending" | "accepted" | "rejected" | "active"
      app_role: "tenant" | "landlord"
      entry_type: "debit" | "credit"
      invoice_status: "paid" | "unpaid"
      kyc_status: "pending" | "verified" | "rejected"
      payment_status: "pending" | "completed" | "failed"
      property_type: "apartment" | "house" | "studio" | "room" | "commercial"
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
      agreement_status: ["pending", "accepted", "rejected", "active"],
      app_role: ["tenant", "landlord"],
      entry_type: ["debit", "credit"],
      invoice_status: ["paid", "unpaid"],
      kyc_status: ["pending", "verified", "rejected"],
      payment_status: ["pending", "completed", "failed"],
      property_type: ["apartment", "house", "studio", "room", "commercial"],
    },
  },
} as const
