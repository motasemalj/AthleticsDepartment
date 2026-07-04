export type Role = 'athlete' | 'coach' | 'admin';

export type ID = string;

/** ISO date string yyyy-MM-dd */
export type DateKey = string;

// ---------------------------------------------------------------------------
// Users & auth
// ---------------------------------------------------------------------------

export interface User {
  id: ID;
  role: Role;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface AthleteProfile {
  userId: ID;
  coachId: ID;
  goal: string;
  heightCm?: number;
  startWeightKg?: number;
  disclaimerAcceptedAt?: number;
  isStudent: boolean;
  joinedVia: 'invite-link' | 'qr';
  tags: string[];
}

export type CoachStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface CoachProfile {
  userId: ID;
  bio: string;
  specialties: string[];
  certifications: { id: ID; name: string; fileName: string; uploadedAt: number; verified: boolean }[];
  status: CoachStatus;
  commissionPct: number; // platform commission percentage
  isOwner: boolean; // owner-coach: their coaching revenue is platform income
  rating?: number;
  yearsExperience: number;
  pricing: PricingTier[];
  studentDiscountPct: number;
  appliedAt: number;
  approvedAt?: number;
}

export interface PricingTier {
  months: 3 | 6 | 12;
  pricePerMonthAed: number;
}

export interface Invite {
  id: ID;
  coachId: ID;
  token: string;
  createdAt: number;
  usedBy?: ID;
  usedAt?: number;
  revoked?: boolean;
}

// ---------------------------------------------------------------------------
// Training
// ---------------------------------------------------------------------------

export type MuscleGroup =
  | 'chest' | 'back' | 'shoulders' | 'arms' | 'legs' | 'glutes' | 'core' | 'full-body' | 'cardio';

export interface Exercise {
  id: ID;
  name: string;
  muscleGroup: MuscleGroup;
  equipment: string;
  videoId?: ID;
  cues?: string;
}

export interface DemoVideo {
  id: ID;
  coachId: ID;
  title: string;
  category: MuscleGroup;
  url: string;
  thumbnailColor: string;
  durationSec: number;
  uploadedAt: number;
  assignedExerciseIds: ID[];
}

export interface PlanExercise {
  id: ID;
  exerciseId: ID;
  sets: number;
  reps: string; // e.g. "8-10", "AMRAP"
  restSec: number;
  tempo?: string;
  notes?: string;
}

export interface PlanDay {
  id: ID;
  title: string; // "Push A", "Rest"
  dayIndex: number; // 0..6
  focus?: string;
  isRest: boolean;
  exercises: PlanExercise[];
}

export interface TrainingPlan {
  id: ID;
  coachId: ID;
  athleteId?: ID; // undefined = template
  title: string;
  description: string;
  weeks: number;
  days: PlanDay[];
  status: 'draft' | 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
}

export interface SetLog {
  setNumber: number;
  weightKg: number | null;
  reps: number | null;
  completed: boolean;
}

export interface ExerciseLog {
  planExerciseId: ID;
  exerciseId: ID;
  sets: SetLog[];
  notes?: string;
}

export interface WorkoutLog {
  id: ID;
  athleteId: ID;
  planId: ID;
  planDayId: ID;
  date: DateKey;
  startedAt: number;
  completedAt?: number;
  durationSec?: number;
  exercises: ExerciseLog[];
  feeling?: 1 | 2 | 3 | 4 | 5;
  synced: boolean;
}

// ---------------------------------------------------------------------------
// Check-ins
// ---------------------------------------------------------------------------

export type Mood = 'great' | 'good' | 'okay' | 'low' | 'rough';

export interface DailyCheckin {
  id: ID;
  athleteId: ID;
  coachId: ID;
  date: DateKey;
  createdAt: number;
  mood: Mood;
  energy: number; // 1-10
  sleepHours?: number;
  journal: string;
  photoUri?: string;
  status: 'pending' | 'reviewed';
  coachComment?: string;
  reviewedAt?: number;
}

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

export interface MacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export interface MealTemplate {
  id: ID;
  name: string; // "Meal 1 — Breakfast"
  description: string;
  macros: MacroTargets;
}

export interface NutritionPlan {
  id: ID;
  coachId: ID;
  athleteId: ID;
  title: string;
  targets: MacroTargets;
  meals: MealTemplate[];
  notes?: string;
  updatedAt: number;
}

export interface MealLog {
  id: ID;
  athleteId: ID;
  date: DateKey;
  mealTemplateId?: ID;
  name: string;
  macros: MacroTargets;
  loggedAt: number;
}

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

export interface ProgressEntry {
  id: ID;
  athleteId: ID;
  date: DateKey;
  weightKg?: number;
  bodyFatPct?: number;
  measurements?: Partial<Record<'chest' | 'waist' | 'hips' | 'arms' | 'thighs', number>>;
  createdAt: number;
}

export interface ProgressPhoto {
  id: ID;
  athleteId: ID;
  date: DateKey;
  uri: string;
  pose: 'front' | 'side' | 'back';
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Health goals
// ---------------------------------------------------------------------------

export interface HealthGoal {
  id: ID;
  athleteId: ID;
  coachId: ID;
  metric: 'water' | 'steps' | 'custom';
  label: string;
  unit: string;
  target: number;
  createdAt: number;
}

export interface HealthGoalLog {
  id: ID;
  goalId: ID;
  athleteId: ID;
  date: DateKey;
  value: number;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export type SessionType = 'call-15' | 'video-review' | 'full-session';

export interface Booking {
  id: ID;
  athleteId: ID;
  coachId: ID;
  type: SessionType;
  startsAt: number;
  durationMin: number;
  meetLink?: string;
  note?: string;
  status: 'requested' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export interface Conversation {
  id: ID;
  athleteId: ID;
  coachId: ID;
  lastMessageAt: number;
  lastMessagePreview: string;
  unread: Record<ID, number>; // userId -> unread count
}

export interface Message {
  id: ID;
  conversationId: ID;
  senderId: ID;
  text?: string;
  imageUri?: string;
  videoUri?: string;
  sentAt: number;
  readBy: ID[];
}

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'past_due';

export interface Subscription {
  id: ID;
  athleteId: ID;
  coachId: ID;
  months: 3 | 6 | 12;
  pricePerMonthAed: number;
  studentDiscountApplied: boolean;
  status: SubscriptionStatus;
  startedAt: number;
  renewsAt: number;
  cardLast4: string;
  cardBrand: string;
}

export interface Payment {
  id: ID;
  subscriptionId: ID;
  athleteId: ID;
  coachId: ID;
  amountAed: number;
  commissionAed: number;
  netAed: number;
  paidAt: number;
  status: 'paid' | 'refunded';
  invoiceNumber: string;
}

export interface Payout {
  id: ID;
  coachId: ID;
  amountAed: number;
  periodLabel: string;
  status: 'pending' | 'paid';
  paidAt?: number;
}

// ---------------------------------------------------------------------------
// Notifications & support
// ---------------------------------------------------------------------------

export type NotificationKind =
  | 'checkin' | 'message' | 'booking' | 'plan' | 'payment' | 'approval' | 'system';

export interface AppNotification {
  id: ID;
  userId: ID;
  kind: NotificationKind;
  title: string;
  body: string;
  createdAt: number;
  read: boolean;
  route?: string;
}

export interface FaqItem {
  id: ID;
  question: string;
  answer: string;
  category: 'account' | 'training' | 'billing' | 'coaching';
}
