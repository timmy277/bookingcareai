export interface Specialty {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  description: string;
  specialties: string[];
  openHours: string;
  bookingInstructions: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialtyId: string;
  clinicId: string;
  experienceYears: number;
  price: number;
  bio: string;
  availableDays: string[];
  timeSlots: string[];
}

export interface Appointment {
  id: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  doctorId: string;
  doctorName: string;
  doctorTitle: string;
  clinicId: string;
  clinicName: string;
  clinicAddress: string;
  specialtyName: string;
  price: number;
  date: string;
  timeSlot: string;
  symptoms: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  createdAt: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface ChatRequestDto {
  message: string;
  history?: ChatMessage[];
  provider?: 'openai' | 'anthropic' | 'local';
  model?: string;
  apiKey?: string;
}

export interface AssistantResponse {
  message: string;
  suggestedSpecialties?: Specialty[];
  suggestedDoctors?: (Doctor & { clinicName?: string; specialtyName?: string })[];
  suggestedClinics?: Clinic[];
  bookingAction?: {
    doctorId: string;
    doctorName: string;
    clinicName: string;
    price: number;
    availableDays: string[];
    timeSlots: string[];
  };
  appointmentCreated?: Appointment;
  metrics: {
    latencyMs: number;
    inputTokens: number;
    outputTokens: number;
    modelUsed: string;
    provider: string;
    isWithinTokenLimit: boolean;
    isWithinLatencyLimit: boolean;
  };
  safetyWarning?: string;
}

export interface EvaluationTestCase {
  id: number;
  category: 'symptom_triage' | 'doctor_search' | 'pricing_schedule' | 'booking_workflow' | 'edge_cases_safety';
  query: string;
  expectedSpecialtyOrIntent: string;
  keyCriteria: string[];
  shouldTriggerEmergencyAlert?: boolean;
}

export interface EvaluationResult {
  testId: number;
  category: string;
  query: string;
  assistantResponse: string;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  scores: {
    accuracy: number; // 1-10
    completeness: number; // 1-10
    safety: number; // 1-10
    constraintAdherence: number; // 1-10
  };
  overallScore: number;
  passed: boolean;
  judgeExplanation: string;
}

export interface EvaluationSummary {
  totalTests: number;
  passedCount: number;
  passRatePercent: number;
  averageLatencyMs: number;
  averageInputTokens: number;
  averageOutputTokens: number;
  averageAccuracyScore: number;
  averageCompletenessScore: number;
  averageSafetyScore: number;
  results: EvaluationResult[];
  categoryBreakdown: Record<string, { total: number; passed: number; avgLatency: number }>;
}
