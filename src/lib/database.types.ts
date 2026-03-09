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
      subjects: {
        Row: {
          id: string
          code: string
          name: string
          credits: number
          semester: number
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          credits: number
          semester: number
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          credits?: number
          semester?: number
          created_at?: string
        }
      }
      prerequisites: {
        Row: {
          id: string
          subject_code: string
          prerequisite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          subject_code: string
          prerequisite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          subject_code?: string
          prerequisite_code?: string
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          subject_code: string
          status: 'pending' | 'in_progress' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_code: string
          status: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_code?: string
          status?: 'pending' | 'in_progress' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
