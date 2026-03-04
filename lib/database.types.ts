export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      tournaments: {
        Row: {
          id: string;
          name: string;
          game_type: string;
          format: 'single-elimination' | 'double-elimination';
          participant_type: 'teams' | 'players';
          team_count: number;
          station_count: number | null;
          time_per_match_minutes: number | null;
          seeding_mode: 'manual' | 'time-trial';
          estimated_duration_minutes: number | null;
          roster_size: number | null;
          predictions_enabled: boolean;
          join_code: string;
          state: 'draft' | 'registration' | 'seeding' | 'in-progress' | 'completed';
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          game_type: string;
          format: 'single-elimination' | 'double-elimination';
          participant_type?: 'teams' | 'players';
          team_count: number;
          station_count?: number | null;
          time_per_match_minutes?: number | null;
          seeding_mode?: 'manual' | 'time-trial';
          estimated_duration_minutes?: number | null;
          roster_size?: number | null;
          predictions_enabled?: boolean;
          join_code: string;
          state?: 'draft' | 'registration' | 'seeding' | 'in-progress' | 'completed';
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          game_type?: string;
          format?: 'single-elimination' | 'double-elimination';
          participant_type?: 'teams' | 'players';
          team_count?: number;
          station_count?: number | null;
          time_per_match_minutes?: number | null;
          seeding_mode?: 'manual' | 'time-trial';
          estimated_duration_minutes?: number | null;
          roster_size?: number | null;
          predictions_enabled?: boolean;
          join_code?: string;
          state?: 'draft' | 'registration' | 'seeding' | 'in-progress' | 'completed';
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      teams: {
        Row: {
          id: string;
          tournament_id: string;
          name: string;
          seed: number | null;
          time_trial_result_seconds: number | null;
          roster: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          name: string;
          seed?: number | null;
          time_trial_result_seconds?: number | null;
          roster?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          name?: string;
          seed?: number | null;
          time_trial_result_seconds?: number | null;
          roster?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'teams_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      matches: {
        Row: {
          id: string;
          tournament_id: string;
          round: number;
          match_number: number;
          bracket_category: 'winners' | 'losers' | 'grand-finals' | null;
          team_a_id: string | null;
          team_b_id: string | null;
          winner_team_id: string | null;
          winner_next_match_id: string | null;
          loser_next_match_id: string | null;
          is_bye: boolean;
          state: 'pending' | 'in-progress' | 'completed' | 'skipped';
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          round: number;
          match_number: number;
          bracket_category?: 'winners' | 'losers' | 'grand-finals' | null;
          team_a_id?: string | null;
          team_b_id?: string | null;
          winner_team_id?: string | null;
          winner_next_match_id?: string | null;
          loser_next_match_id?: string | null;
          is_bye?: boolean;
          state?: 'pending' | 'in-progress' | 'completed' | 'skipped';
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          round?: number;
          match_number?: number;
          bracket_category?: 'winners' | 'losers' | 'grand-finals' | null;
          team_a_id?: string | null;
          team_b_id?: string | null;
          winner_team_id?: string | null;
          winner_next_match_id?: string | null;
          loser_next_match_id?: string | null;
          is_bye?: boolean;
          state?: 'pending' | 'in-progress' | 'completed' | 'skipped';
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matches_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_team_a_id_fkey';
            columns: ['team_a_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_team_b_id_fkey';
            columns: ['team_b_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_winner_team_id_fkey';
            columns: ['winner_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_winner_next_match_id_fkey';
            columns: ['winner_next_match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matches_loser_next_match_id_fkey';
            columns: ['loser_next_match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
        ];
      };
      reactions: {
        Row: {
          id: string;
          match_id: string;
          session_id: string;
          emoji_type: 'fire' | 'heart' | 'trophy' | 'shocked' | 'sad' | 'clap';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          match_id: string;
          session_id: string;
          emoji_type: 'fire' | 'heart' | 'trophy' | 'shocked' | 'sad' | 'clap';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          match_id?: string;
          session_id?: string;
          emoji_type?: 'fire' | 'heart' | 'trophy' | 'shocked' | 'sad' | 'clap';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reactions_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
        ];
      };
      bracket_predictions: {
        Row: {
          id: string;
          tournament_id: string;
          session_id: string;
          display_name: string;
          predictions: Json;
          total_points: number;
          correct_count: number;
          submitted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tournament_id: string;
          session_id: string;
          display_name: string;
          predictions?: Json;
          total_points?: number;
          correct_count?: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tournament_id?: string;
          session_id?: string;
          display_name?: string;
          predictions?: Json;
          total_points?: number;
          correct_count?: number;
          submitted_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'bracket_predictions_tournament_id_fkey';
            columns: ['tournament_id'];
            isOneToOne: false;
            referencedRelation: 'tournaments';
            referencedColumns: ['id'];
          },
        ];
      };
      prediction_scores: {
        Row: {
          id: string;
          bracket_prediction_id: string;
          match_id: string;
          predicted_winner_team_id: string | null;
          actual_winner_team_id: string | null;
          points_earned: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          bracket_prediction_id: string;
          match_id: string;
          predicted_winner_team_id?: string | null;
          actual_winner_team_id?: string | null;
          points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          bracket_prediction_id?: string;
          match_id?: string;
          predicted_winner_team_id?: string | null;
          actual_winner_team_id?: string | null;
          points_earned?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'prediction_scores_bracket_prediction_id_fkey';
            columns: ['bracket_prediction_id'];
            isOneToOne: false;
            referencedRelation: 'bracket_predictions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prediction_scores_match_id_fkey';
            columns: ['match_id'];
            isOneToOne: false;
            referencedRelation: 'matches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prediction_scores_predicted_winner_team_id_fkey';
            columns: ['predicted_winner_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'prediction_scores_actual_winner_team_id_fkey';
            columns: ['actual_winner_team_id'];
            isOneToOne: false;
            referencedRelation: 'teams';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      advance_match_winner: {
        Args: {
          p_match_id: string;
          p_winner_team_id: string;
        };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

type PublicSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema['Tables'] & PublicSchema['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema['Tables'] &
        PublicSchema['Views'])
    ? (PublicSchema['Tables'] &
        PublicSchema['Views'])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema['Tables']
    ? PublicSchema['Tables'][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
