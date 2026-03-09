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
      agent_events: {
        Row: {
          agent_id: string
          created_at: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_learnings: {
        Row: {
          agent_id: string
          confidence_score: number | null
          created_at: string
          domain: string | null
          embedding_summary: string
          id: string
          learning_type: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          confidence_score?: number | null
          created_at?: string
          domain?: string | null
          embedding_summary: string
          id?: string
          learning_type?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          confidence_score?: number | null
          created_at?: string
          domain?: string | null
          embedding_summary?: string
          id?: string
          learning_type?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_learnings_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          created_at: string
          description: string | null
          domain: string | null
          id: string
          name: string
          performance_score: number | null
          shared_learnings: number
          status: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name: string
          performance_score?: number | null
          shared_learnings?: number
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          domain?: string | null
          id?: string
          name?: string
          performance_score?: number | null
          shared_learnings?: number
          status?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_templates: {
        Row: {
          agent_id: string | null
          config: Json | null
          created_at: string
          decision_type: string
          description: string | null
          id: string
          is_active: boolean
          metrics: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          config?: Json | null
          created_at?: string
          decision_type: string
          description?: string | null
          id?: string
          is_active?: boolean
          metrics?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          config?: Json | null
          created_at?: string
          decision_type?: string
          description?: string | null
          id?: string
          is_active?: boolean
          metrics?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_templates_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_partner_onboarding: {
        Row: {
          company_name: string
          created_at: string
          deployment_timeline: string
          id: string
          primary_use_case: string
          source: string
          status: string
          team_size: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          deployment_timeline: string
          id?: string
          primary_use_case: string
          source?: string
          status?: string
          team_size: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          deployment_timeline?: string
          id?: string
          primary_use_case?: string
          source?: string
          status?: string
          team_size?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      feedback_events: {
        Row: {
          action_taken: string
          agent_id: string
          created_at: string
          decision_template_id: string | null
          id: string
          metadata: Json | null
          outcome: string | null
          outcome_score: number | null
          reinforcement_delta: number | null
          stage: string
          user_id: string
        }
        Insert: {
          action_taken: string
          agent_id: string
          created_at?: string
          decision_template_id?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          outcome_score?: number | null
          reinforcement_delta?: number | null
          stage?: string
          user_id: string
        }
        Update: {
          action_taken?: string
          agent_id?: string
          created_at?: string
          decision_template_id?: string | null
          id?: string
          metadata?: Json | null
          outcome?: string | null
          outcome_score?: number | null
          reinforcement_delta?: number | null
          stage?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_events_decision_template_id_fkey"
            columns: ["decision_template_id"]
            isOneToOne: false
            referencedRelation: "decision_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      intelligence_metrics: {
        Row: {
          created_by: string | null
          id: string
          metric_name: string
          metric_value: number
          period: string
          recorded_at: string
        }
        Insert: {
          created_by?: string | null
          id?: string
          metric_name: string
          metric_value?: number
          period?: string
          recorded_at?: string
        }
        Update: {
          created_by?: string | null
          id?: string
          metric_name?: string
          metric_value?: number
          period?: string
          recorded_at?: string
        }
        Relationships: []
      }
      knowledge_graph_edges: {
        Row: {
          created_at: string
          id: string
          properties: Json | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          properties?: Json | null
          relationship_type: string
          source_node_id: string
          target_node_id: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          properties?: Json | null
          relationship_type?: string
          source_node_id?: string
          target_node_id?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_graph_edges_source_node_id_fkey"
            columns: ["source_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_graph_edges_target_node_id_fkey"
            columns: ["target_node_id"]
            isOneToOne: false
            referencedRelation: "knowledge_graph_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_graph_nodes: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          label: string
          node_type: string
          properties: Json | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          label: string
          node_type: string
          properties?: Json | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          label?: string
          node_type?: string
          properties?: Json | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      network_scale: {
        Row: {
          avg_accuracy_improvement: number | null
          avg_error_reduction: number | null
          avg_roi_improvement: number | null
          created_by: string | null
          id: string
          recorded_at: string
          total_agents: number
          total_companies: number
          total_cross_domain_transfers: number
          total_decisions: number
          verticals: string[] | null
        }
        Insert: {
          avg_accuracy_improvement?: number | null
          avg_error_reduction?: number | null
          avg_roi_improvement?: number | null
          created_by?: string | null
          id?: string
          recorded_at?: string
          total_agents?: number
          total_companies?: number
          total_cross_domain_transfers?: number
          total_decisions?: number
          verticals?: string[] | null
        }
        Update: {
          avg_accuracy_improvement?: number | null
          avg_error_reduction?: number | null
          avg_roi_improvement?: number | null
          created_by?: string | null
          id?: string
          recorded_at?: string
          total_agents?: number
          total_companies?: number
          total_cross_domain_transfers?: number
          total_decisions?: number
          verticals?: string[] | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          agent_id: string | null
          created_at: string
          event_type: string | null
          id: string
          message: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          message: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_handoffs: {
        Row: {
          company_name: string
          contact_email: string | null
          contact_name: string | null
          created_at: string
          deployment_timeline: string
          enterprise_onboarding_id: string | null
          id: string
          primary_use_case: string
          status: string
          team_size: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deployment_timeline: string
          enterprise_onboarding_id?: string | null
          id?: string
          primary_use_case: string
          status?: string
          team_size: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          deployment_timeline?: string
          enterprise_onboarding_id?: string | null
          id?: string
          primary_use_case?: string
          status?: string
          team_size?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_handoffs_enterprise_onboarding_id_fkey"
            columns: ["enterprise_onboarding_id"]
            isOneToOne: false
            referencedRelation: "enterprise_partner_onboarding"
            referencedColumns: ["id"]
          },
        ]
      }
      pilot_companies: {
        Row: {
          api_key: string | null
          baseline_false_positive_rate: number | null
          baseline_fraud_rate: number | null
          created_at: string
          current_false_positive_rate: number | null
          current_fraud_rate: number | null
          id: string
          industry: string | null
          metadata: Json | null
          name: string
          status: string
          total_decisions: number | null
          total_transactions: number | null
          updated_at: string
          user_id: string
          vertical: string | null
        }
        Insert: {
          api_key?: string | null
          baseline_false_positive_rate?: number | null
          baseline_fraud_rate?: number | null
          created_at?: string
          current_false_positive_rate?: number | null
          current_fraud_rate?: number | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name: string
          status?: string
          total_decisions?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id: string
          vertical?: string | null
        }
        Update: {
          api_key?: string | null
          baseline_false_positive_rate?: number | null
          baseline_fraud_rate?: number | null
          created_at?: string
          current_false_positive_rate?: number | null
          current_fraud_rate?: number | null
          id?: string
          industry?: string | null
          metadata?: Json | null
          name?: string
          status?: string
          total_decisions?: number | null
          total_transactions?: number | null
          updated_at?: string
          user_id?: string
          vertical?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      shared_insights: {
        Row: {
          confidence: number | null
          created_at: string
          created_by: string | null
          description: string
          id: string
          impact_score: number | null
          insight_type: string
          metadata: Json | null
          source_agent_count: number | null
          source_domains: string[] | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          description: string
          id?: string
          impact_score?: number | null
          insight_type?: string
          metadata?: Json | null
          source_agent_count?: number | null
          source_domains?: string[] | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          created_by?: string | null
          description?: string
          id?: string
          impact_score?: number | null
          insight_type?: string
          metadata?: Json | null
          source_agent_count?: number | null
          source_domains?: string[] | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_email: string
          role: Database["public"]["Enums"]["team_role"]
          status: string
          team_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          invited_email: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          invited_email?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agent_id: string | null
          amount: number
          country: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          decided_at: string | null
          decided_by: string | null
          decision: string
          decision_confidence: number | null
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          merchant_category: string | null
          merchant_name: string | null
          metadata: Json | null
          outcome: string | null
          outcome_at: string | null
          outcome_score: number | null
          payment_method: string | null
          risk_factors: Json | null
          risk_score: number | null
          transaction_ref: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          amount: number
          country?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          decision_confidence?: number | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          merchant_category?: string | null
          merchant_name?: string | null
          metadata?: Json | null
          outcome?: string | null
          outcome_at?: string | null
          outcome_score?: number | null
          payment_method?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          transaction_ref: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          amount?: number
          country?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          decided_at?: string | null
          decided_by?: string | null
          decision?: string
          decision_confidence?: number | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          merchant_category?: string | null
          merchant_name?: string | null
          metadata?: Json | null
          outcome?: string | null
          outcome_at?: string | null
          outcome_score?: number | null
          payment_method?: string | null
          risk_factors?: Json | null
          risk_score?: number | null
          transaction_ref?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
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
      webhook_configs: {
        Row: {
          created_at: string
          events: string[]
          failure_count: number
          id: string
          is_active: boolean
          last_triggered_at: string | null
          name: string
          secret: string | null
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name: string
          secret?: string | null
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          events?: string[]
          failure_count?: number
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          name?: string
          secret?: string | null
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      pilot_companies_safe: {
        Row: {
          baseline_false_positive_rate: number | null
          baseline_fraud_rate: number | null
          created_at: string | null
          current_false_positive_rate: number | null
          current_fraud_rate: number | null
          id: string | null
          industry: string | null
          metadata: Json | null
          name: string | null
          status: string | null
          total_decisions: number | null
          total_transactions: number | null
          updated_at: string | null
          user_id: string | null
          vertical: string | null
        }
        Insert: {
          baseline_false_positive_rate?: number | null
          baseline_fraud_rate?: number | null
          created_at?: string | null
          current_false_positive_rate?: number | null
          current_fraud_rate?: number | null
          id?: string | null
          industry?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          total_decisions?: number | null
          total_transactions?: number | null
          updated_at?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Update: {
          baseline_false_positive_rate?: number | null
          baseline_fraud_rate?: number | null
          created_at?: string | null
          current_false_positive_rate?: number | null
          current_fraud_rate?: number | null
          id?: string | null
          industry?: string | null
          metadata?: Json | null
          name?: string | null
          status?: string | null
          total_decisions?: number | null
          total_transactions?: number | null
          updated_at?: string | null
          user_id?: string | null
          vertical?: string | null
        }
        Relationships: []
      }
      webhook_configs_safe: {
        Row: {
          created_at: string | null
          events: string[] | null
          failure_count: number | null
          id: string | null
          is_active: boolean | null
          last_triggered_at: string | null
          name: string | null
          updated_at: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          events?: string[] | null
          failure_count?: number | null
          id?: string | null
          is_active?: boolean | null
          last_triggered_at?: string | null
          name?: string | null
          updated_at?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_pilot_api_key: { Args: { company_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      team_role: "owner" | "admin" | "member"
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
      app_role: ["admin", "moderator", "user"],
      team_role: ["owner", "admin", "member"],
    },
  },
} as const
