export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Firestore subject document
export interface Subject {
  id?: string
  code: string
  name: string
  credits: number
  semester: number
  career: string
  isValidated?: boolean
  createdAt?: Date | string
}

// Firestore prerequisite document
export interface Prerequisite {
  id?: string
  subjectCode: string
  prerequisiteCode: string
  career: string
  createdAt?: Date | string
}

// Pensum metadata document
export interface PensumMetadata {
  careerName: string
  uploadedBy: string
  uploadedAt: Date | string
  totalSubjects: number
  description?: string
  createdAt?: Date | string
}

// User progress document
export interface UserProgress {
  id?: string
  userId: string
  subjectCode: string
  status: 'pending' | 'in_progress' | 'completed'
  isValidated: boolean
  career: string
  createdAt?: Date | string
  updatedAt?: Date | string
}

// API response types for Supabase (if needed in future)
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
          career: string
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          name: string
          credits: number
          semester: number
          career: string
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          name?: string
          credits?: number
          semester?: number
          career?: string
          created_at?: string
        }
      }
      prerequisites: {
        Row: {
          id: string
          subject_code: string
          prerequisite_code: string
          career: string
          created_at: string
        }
        Insert: {
          id?: string
          subject_code: string
          prerequisite_code: string
          career: string
          created_at?: string
        }
        Update: {
          id?: string
          subject_code?: string
          prerequisite_code?: string
          career?: string
          created_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          subject_code: string
          status: 'pending' | 'in_progress' | 'completed'
          career: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subject_code: string
          status: 'pending' | 'in_progress' | 'completed'
          career: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject_code?: string
          status?: 'pending' | 'in_progress' | 'completed'
          career?: string
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
