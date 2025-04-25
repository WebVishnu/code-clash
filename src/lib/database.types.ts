export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: {
          id: string
          email: string
          rank: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          rank?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          rank?: string
          created_at?: string
          updated_at?: string
        }
      }
      match_queue: {
        Row: {
          id: string
          user_id: string
          rank: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          rank: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          rank?: number
          created_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          player1_id: string
          player2_id: string
          status: 'pending' | 'active' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          player1_id: string
          player2_id: string
          status?: 'pending' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          player1_id?: string
          player2_id?: string
          status?: 'pending' | 'active' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      coding_problems: {
        Row: {
          id: string
          title: string
          description: string
          sample_input: string
          sample_output: string
          test_cases: Json
          difficulty: 'easy' | 'medium' | 'hard'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          sample_input?: string
          sample_output?: string
          test_cases: Json
          difficulty: 'easy' | 'medium' | 'hard'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          sample_input?: string
          sample_output?: string
          test_cases?: Json
          difficulty?: 'easy' | 'medium' | 'hard'
          created_at?: string
        }
      }
      match_problems: {
        Row: {
          id: string
          match_id: string
          problem_id: string
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          problem_id: string
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          problem_id?: string
          created_at?: string
        }
      }
      code_submissions: {
        Row: {
          id: string
          match_id: string
          user_id: string
          code: string
          language: 'javascript' | 'python'
          status: 'pending' | 'running' | 'completed' | 'error'
          created_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          code: string
          language: 'javascript' | 'python'
          status: 'pending' | 'running' | 'completed' | 'error'
          created_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          code?: string
          language?: 'javascript' | 'python'
          status?: 'pending' | 'running' | 'completed' | 'error'
          created_at?: string
        }
      }
    }
  }
}