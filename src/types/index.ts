export interface Subject {
  id: string;
  code: string;
  name: string;
  credits: number;
  semester: number;
  career: string;
  is_validated?: boolean;
  createdAt: string;
}

export interface Prerequisite {
  id: string;
  subjectCode: string;
  prerequisiteCode: string;
  career: string;
  createdAt: string;
}

export interface UserProgress {
  id: string;
  userId: string;
  subjectCode: string;
  status: 'pending' | 'in_progress' | 'completed';
  isValidated: boolean;
  career: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  institution?: string;
  career: string;
  theme: 'light' | 'dark';
  createdAt: string;
}

export interface SubjectWithProgress extends Subject {
  status: 'pending' | 'in_progress' | 'completed';
  prerequisites: string[];
  isValidated: boolean;
  isLocked: boolean;
}

export interface ProgressStats {
  totalSubjects: number;
  completedSubjects: number;
  inProgressSubjects: number;
  pendingSubjects: number;
  totalCredits: number;
  completedCredits: number;
  inProgressCredits: number;
  pendingCredits: number;
  progressPercentage: number;
  estimatedSemestersRemaining: number;
  estimatedSemestersRemainingPrecise: number;
}
