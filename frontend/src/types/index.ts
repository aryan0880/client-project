// ─── API Response Wrapper ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin';
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// ─── Supplier ────────────────────────────────────────────────────────────────

export type SupplierStatus = 'active' | 'inactive';

export interface Supplier {
  _id: string;
  name: string;
  email: string;
  status: SupplierStatus;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  email: string;
  status?: SupplierStatus;
  contactPerson?: string;
  phone?: string;
  notes?: string;
}

// ─── Question ────────────────────────────────────────────────────────────────

export type QuestionType = 'rating' | 'yesno' | 'text';

export interface Question {
  _id: string;
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionDto {
  text: string;
  type: QuestionType;
  points: number;
  order: number;
}

// ─── Survey ──────────────────────────────────────────────────────────────────

export type SurveyStatus = 'draft' | 'active' | 'closed';

export interface Survey {
  _id: string;
  title: string;
  description?: string;
  googleFormUrl: string;
  googleSheetsUrl?: string;
  status: SurveyStatus;
  questions?: Question[];
  createdBy?: { _id: string; name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurveyDto {
  title: string;
  description?: string;
  googleFormUrl: string;
  googleSheetsUrl?: string;
  status?: SurveyStatus;
}

// ─── Survey Assignment ────────────────────────────────────────────────────────

export type AssignmentStatus = 'pending' | 'submitted';

export interface SurveyAssignment {
  _id: string;
  survey: Survey;
  supplier: Supplier;
  token: string;
  status: AssignmentStatus;
  sentAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Response ────────────────────────────────────────────────────────────────

export interface Answer {
  question: string;
  value: string;
}

export interface SurveyResponse {
  _id: string;
  assignment: SurveyAssignment;
  answers: Answer[];
  totalScore?: number;
  maxPossibleScore?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitResponseDto {
  answers: Answer[];
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSuppliers: number;
  activeSurveys: number;
  completedResponses: number;
  pendingResponses: number;
}
