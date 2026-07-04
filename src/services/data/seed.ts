import type {
  AppNotification,
  AthleteProfile,
  Booking,
  CoachProfile,
  Conversation,
  DailyCheckin,
  DemoVideo,
  Exercise,
  FaqItem,
  HealthGoal,
  HealthGoalLog,
  Invite,
  MealLog,
  Message,
  Mood,
  NutritionPlan,
  Payment,
  Payout,
  ProgressEntry,
  ProgressPhoto,
  Subscription,
  TrainingPlan,
  User,
  WorkoutLog,
} from '@/types';
import { daysAgoKey } from '@/utils';

const now = Date.now();
const DAY = 86_400_000;
const HOUR = 3_600_000;

const photo = (seed: string, w = 500, h = 700) => `https://picsum.photos/seed/${seed}/${w}/${h}`;
const face = (seed: string) => `https://i.pravatar.cc/300?u=${seed}`;

const VIDEO_URLS = [
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
];

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const seedUsers: User[] = [
  { id: 'u-admin', role: 'admin', name: 'Motasem Aljayyousi', email: 'owner@athleticsdept.ae', avatarUrl: face('admin'), createdAt: now - 400 * DAY },
  { id: 'u-coach-1', role: 'coach', name: 'Omar Al-Rashid', email: 'omar@athleticsdept.ae', avatarUrl: face('omar'), createdAt: now - 380 * DAY },
  { id: 'u-coach-2', role: 'coach', name: 'Sara Haddad', email: 'sara@athleticsdept.ae', avatarUrl: face('sara'), createdAt: now - 200 * DAY },
  { id: 'u-coach-3', role: 'coach', name: 'Daniel Kim', email: 'daniel.kim@gmail.com', avatarUrl: face('daniel'), createdAt: now - 3 * DAY },
  { id: 'u-ath-1', role: 'athlete', name: 'Maya Khalil', email: 'maya.k@gmail.com', avatarUrl: face('maya'), createdAt: now - 160 * DAY },
  { id: 'u-ath-2', role: 'athlete', name: 'James Carter', email: 'jcarter@gmail.com', avatarUrl: face('james'), createdAt: now - 140 * DAY },
  { id: 'u-ath-3', role: 'athlete', name: 'Aisha Rahman', email: 'aisha.r@gmail.com', avatarUrl: face('aisha'), createdAt: now - 120 * DAY },
  { id: 'u-ath-4', role: 'athlete', name: 'Lucas Mendes', email: 'lucas.m@gmail.com', avatarUrl: face('lucas'), createdAt: now - 90 * DAY },
  { id: 'u-ath-5', role: 'athlete', name: 'Fatima Noor', email: 'fatima.n@gmail.com', avatarUrl: face('fatima'), createdAt: now - 60 * DAY },
  { id: 'u-ath-6', role: 'athlete', name: 'Ryan Walsh', email: 'ryan.w@gmail.com', avatarUrl: face('ryan'), createdAt: now - 30 * DAY },
  { id: 'u-ath-7', role: 'athlete', name: 'Leila Mansour', email: 'leila.m@gmail.com', avatarUrl: face('leila'), createdAt: now - 100 * DAY },
  { id: 'u-ath-8', role: 'athlete', name: 'Tom Becker', email: 'tom.b@gmail.com', avatarUrl: face('tom'), createdAt: now - 45 * DAY },
];

export const seedCoachProfiles: CoachProfile[] = [
  {
    userId: 'u-coach-1',
    bio: 'Head coach & founder. 12 years coaching hybrid athletes across the UAE — strength, conditioning and sustainable fat loss. Ex national-team sprinter.',
    specialties: ['Strength', 'Fat Loss', 'Athletic Performance'],
    certifications: [
      { id: 'cert-1', name: 'NSCA CSCS', fileName: 'nsca-cscs.pdf', uploadedAt: now - 380 * DAY, verified: true },
      { id: 'cert-2', name: 'Precision Nutrition L2', fileName: 'pn-l2.pdf', uploadedAt: now - 380 * DAY, verified: true },
    ],
    status: 'approved',
    commissionPct: 0,
    isOwner: true,
    rating: 4.9,
    yearsExperience: 12,
    pricing: [
      { months: 3, pricePerMonthAed: 1200 },
      { months: 6, pricePerMonthAed: 1000 },
      { months: 12, pricePerMonthAed: 850 },
    ],
    studentDiscountPct: 20,
    appliedAt: now - 380 * DAY,
    approvedAt: now - 380 * DAY,
  },
  {
    userId: 'u-coach-2',
    bio: 'Women\u2019s strength specialist. I help busy professionals build muscle and confidence with 3\u20134 focused sessions a week.',
    specialties: ['Hypertrophy', 'Women\u2019s Training', 'Nutrition'],
    certifications: [
      { id: 'cert-3', name: 'ACE CPT', fileName: 'ace-cpt.pdf', uploadedAt: now - 200 * DAY, verified: true },
    ],
    status: 'approved',
    commissionPct: 25,
    isOwner: false,
    rating: 4.8,
    yearsExperience: 7,
    pricing: [
      { months: 3, pricePerMonthAed: 950 },
      { months: 6, pricePerMonthAed: 800 },
      { months: 12, pricePerMonthAed: 700 },
    ],
    studentDiscountPct: 15,
    appliedAt: now - 210 * DAY,
    approvedAt: now - 200 * DAY,
  },
  {
    userId: 'u-coach-3',
    bio: 'Powerlifting coach with a data-driven approach. IPF-classic competitor, 3 national podiums. Coaching online since 2021.',
    specialties: ['Powerlifting', 'Strength'],
    certifications: [
      { id: 'cert-4', name: 'NASM CPT', fileName: 'nasm-cpt.pdf', uploadedAt: now - 3 * DAY, verified: false },
      { id: 'cert-5', name: 'IPF Coaching License', fileName: 'ipf-license.pdf', uploadedAt: now - 3 * DAY, verified: false },
    ],
    status: 'pending',
    commissionPct: 25,
    isOwner: false,
    yearsExperience: 5,
    pricing: [
      { months: 3, pricePerMonthAed: 800 },
      { months: 6, pricePerMonthAed: 700 },
      { months: 12, pricePerMonthAed: 600 },
    ],
    studentDiscountPct: 10,
    appliedAt: now - 3 * DAY,
  },
];

export const seedAthleteProfiles: AthleteProfile[] = [
  { userId: 'u-ath-1', coachId: 'u-coach-1', goal: 'Build lean muscle & run a sub-25 5K', heightCm: 167, startWeightKg: 64.8, disclaimerAcceptedAt: now - 160 * DAY, isStudent: false, joinedVia: 'invite-link', tags: ['Hypertrophy', '5K'] },
  { userId: 'u-ath-2', coachId: 'u-coach-1', goal: 'Drop 8kg while keeping strength', heightCm: 182, startWeightKg: 96.2, disclaimerAcceptedAt: now - 140 * DAY, isStudent: false, joinedVia: 'qr', tags: ['Fat Loss'] },
  { userId: 'u-ath-3', coachId: 'u-coach-1', goal: 'First pull-up & core strength', heightCm: 160, startWeightKg: 55.0, disclaimerAcceptedAt: now - 120 * DAY, isStudent: true, joinedVia: 'invite-link', tags: ['Calisthenics'] },
  { userId: 'u-ath-4', coachId: 'u-coach-1', goal: '100kg bench press', heightCm: 176, startWeightKg: 78.5, disclaimerAcceptedAt: now - 90 * DAY, isStudent: false, joinedVia: 'invite-link', tags: ['Strength'] },
  { userId: 'u-ath-5', coachId: 'u-coach-1', goal: 'Post-pregnancy return to training', heightCm: 164, startWeightKg: 68.0, disclaimerAcceptedAt: now - 60 * DAY, isStudent: false, joinedVia: 'qr', tags: ['Return to Sport'] },
  { userId: 'u-ath-6', coachId: 'u-coach-1', goal: 'General fitness & energy', heightCm: 179, startWeightKg: 84.0, disclaimerAcceptedAt: now - 30 * DAY, isStudent: true, joinedVia: 'invite-link', tags: ['GPP'] },
  { userId: 'u-ath-7', coachId: 'u-coach-2', goal: 'Glute & lower-body focus', heightCm: 169, startWeightKg: 61.0, disclaimerAcceptedAt: now - 100 * DAY, isStudent: false, joinedVia: 'invite-link', tags: ['Hypertrophy'] },
  { userId: 'u-ath-8', coachId: 'u-coach-2', goal: 'Marathon strength support', heightCm: 184, startWeightKg: 74.0, disclaimerAcceptedAt: now - 45 * DAY, isStudent: false, joinedVia: 'qr', tags: ['Endurance'] },
];

export const seedInvites: Invite[] = [
  { id: 'inv-1', coachId: 'u-coach-1', token: 'OMAR-TRAIN-24', createdAt: now - 12 * DAY },
  { id: 'inv-2', coachId: 'u-coach-1', token: 'OMAR-9F3KQ', createdAt: now - 30 * DAY, usedBy: 'u-ath-6', usedAt: now - 30 * DAY },
  { id: 'inv-3', coachId: 'u-coach-2', token: 'SARA-STRONG', createdAt: now - 8 * DAY },
];

// ---------------------------------------------------------------------------
// Exercise library
// ---------------------------------------------------------------------------

export const seedExercises: Exercise[] = [
  { id: 'ex-bench', name: 'Barbell Bench Press', muscleGroup: 'chest', equipment: 'Barbell', videoId: 'vid-1', cues: 'Shoulder blades pinned, feet planted, bar to mid-chest.' },
  { id: 'ex-incline-db', name: 'Incline Dumbbell Press', muscleGroup: 'chest', equipment: 'Dumbbells', videoId: 'vid-1' },
  { id: 'ex-pushup', name: 'Push-Up', muscleGroup: 'chest', equipment: 'Bodyweight' },
  { id: 'ex-cable-fly', name: 'Cable Fly', muscleGroup: 'chest', equipment: 'Cable' },
  { id: 'ex-deadlift', name: 'Conventional Deadlift', muscleGroup: 'back', equipment: 'Barbell', videoId: 'vid-2', cues: 'Brace hard, push the floor away, bar stays close.' },
  { id: 'ex-pullup', name: 'Pull-Up', muscleGroup: 'back', equipment: 'Bodyweight', videoId: 'vid-2' },
  { id: 'ex-row-bb', name: 'Barbell Row', muscleGroup: 'back', equipment: 'Barbell' },
  { id: 'ex-lat-pd', name: 'Lat Pulldown', muscleGroup: 'back', equipment: 'Cable' },
  { id: 'ex-row-cable', name: 'Seated Cable Row', muscleGroup: 'back', equipment: 'Cable' },
  { id: 'ex-ohp', name: 'Overhead Press', muscleGroup: 'shoulders', equipment: 'Barbell', videoId: 'vid-3' },
  { id: 'ex-lat-raise', name: 'Lateral Raise', muscleGroup: 'shoulders', equipment: 'Dumbbells' },
  { id: 'ex-face-pull', name: 'Face Pull', muscleGroup: 'shoulders', equipment: 'Cable' },
  { id: 'ex-curl-db', name: 'Dumbbell Curl', muscleGroup: 'arms', equipment: 'Dumbbells' },
  { id: 'ex-curl-hammer', name: 'Hammer Curl', muscleGroup: 'arms', equipment: 'Dumbbells' },
  { id: 'ex-tri-press', name: 'Triceps Pressdown', muscleGroup: 'arms', equipment: 'Cable' },
  { id: 'ex-skull', name: 'Skull Crusher', muscleGroup: 'arms', equipment: 'EZ Bar' },
  { id: 'ex-squat', name: 'Back Squat', muscleGroup: 'legs', equipment: 'Barbell', videoId: 'vid-4', cues: 'Big breath, sit between the hips, drive knees out.' },
  { id: 'ex-front-squat', name: 'Front Squat', muscleGroup: 'legs', equipment: 'Barbell' },
  { id: 'ex-legpress', name: 'Leg Press', muscleGroup: 'legs', equipment: 'Machine' },
  { id: 'ex-lunge', name: 'Walking Lunge', muscleGroup: 'legs', equipment: 'Dumbbells', videoId: 'vid-4' },
  { id: 'ex-legcurl', name: 'Lying Leg Curl', muscleGroup: 'legs', equipment: 'Machine' },
  { id: 'ex-rdl', name: 'Romanian Deadlift', muscleGroup: 'glutes', equipment: 'Barbell', videoId: 'vid-5' },
  { id: 'ex-hip-thrust', name: 'Hip Thrust', muscleGroup: 'glutes', equipment: 'Barbell', videoId: 'vid-5' },
  { id: 'ex-plank', name: 'Plank', muscleGroup: 'core', equipment: 'Bodyweight' },
  { id: 'ex-hanging-leg', name: 'Hanging Leg Raise', muscleGroup: 'core', equipment: 'Bodyweight' },
  { id: 'ex-cable-crunch', name: 'Cable Crunch', muscleGroup: 'core', equipment: 'Cable' },
  { id: 'ex-burpee', name: 'Burpee', muscleGroup: 'full-body', equipment: 'Bodyweight' },
  { id: 'ex-kb-swing', name: 'Kettlebell Swing', muscleGroup: 'full-body', equipment: 'Kettlebell' },
  { id: 'ex-run', name: 'Zone 2 Run', muscleGroup: 'cardio', equipment: 'None' },
  { id: 'ex-row-erg', name: 'Rowing Erg Intervals', muscleGroup: 'cardio', equipment: 'Rower' },
];

export const seedVideos: DemoVideo[] = [
  { id: 'vid-1', coachId: 'u-coach-1', title: 'Bench Press — Setup & Bar Path', category: 'chest', url: VIDEO_URLS[0]!, thumbnailColor: '#8B5CF6', durationSec: 62, uploadedAt: now - 90 * DAY, assignedExerciseIds: ['ex-bench', 'ex-incline-db'] },
  { id: 'vid-2', coachId: 'u-coach-1', title: 'Deadlift & Pull-Up Mechanics', category: 'back', url: VIDEO_URLS[1]!, thumbnailColor: '#3B82F6', durationSec: 95, uploadedAt: now - 85 * DAY, assignedExerciseIds: ['ex-deadlift', 'ex-pullup'] },
  { id: 'vid-3', coachId: 'u-coach-1', title: 'Overhead Press — Bracing', category: 'shoulders', url: VIDEO_URLS[2]!, thumbnailColor: '#22D3EE', durationSec: 48, uploadedAt: now - 60 * DAY, assignedExerciseIds: ['ex-ohp'] },
  { id: 'vid-4', coachId: 'u-coach-1', title: 'Squat Depth & Lunge Patterning', category: 'legs', url: VIDEO_URLS[3]!, thumbnailColor: '#F59E0B', durationSec: 118, uploadedAt: now - 40 * DAY, assignedExerciseIds: ['ex-squat', 'ex-lunge'] },
  { id: 'vid-5', coachId: 'u-coach-1', title: 'Hinge Patterns: RDL & Hip Thrust', category: 'glutes', url: VIDEO_URLS[4]!, thumbnailColor: '#F472B6', durationSec: 84, uploadedAt: now - 21 * DAY, assignedExerciseIds: ['ex-rdl', 'ex-hip-thrust'] },
];

// ---------------------------------------------------------------------------
// Training plans
// ---------------------------------------------------------------------------

export const seedPlans: TrainingPlan[] = [
  {
    id: 'plan-1',
    coachId: 'u-coach-1',
    athleteId: 'u-ath-1',
    title: 'Lean Build — Phase 2',
    description: '4-day upper/lower split with a weekly Zone 2 run. Progressive overload on main lifts, RPE 7\u20138.',
    weeks: 6,
    status: 'active',
    createdAt: now - 40 * DAY,
    updatedAt: now - 2 * DAY,
    days: [
      {
        id: 'pd-1', title: 'Upper A', dayIndex: 0, focus: 'Chest & Back strength', isRest: false,
        exercises: [
          { id: 'pe-1', exerciseId: 'ex-bench', sets: 4, reps: '6-8', restSec: 150, tempo: '31X1', notes: 'Add 2.5kg if all sets hit 8.' },
          { id: 'pe-2', exerciseId: 'ex-row-bb', sets: 4, reps: '8-10', restSec: 120 },
          { id: 'pe-3', exerciseId: 'ex-incline-db', sets: 3, reps: '10-12', restSec: 90 },
          { id: 'pe-4', exerciseId: 'ex-lat-pd', sets: 3, reps: '10-12', restSec: 90 },
          { id: 'pe-5', exerciseId: 'ex-face-pull', sets: 3, reps: '15', restSec: 60 },
        ],
      },
      {
        id: 'pd-2', title: 'Lower A', dayIndex: 1, focus: 'Squat emphasis', isRest: false,
        exercises: [
          { id: 'pe-6', exerciseId: 'ex-squat', sets: 4, reps: '5', restSec: 180, tempo: '30X1' },
          { id: 'pe-7', exerciseId: 'ex-rdl', sets: 3, reps: '8', restSec: 150 },
          { id: 'pe-8', exerciseId: 'ex-lunge', sets: 3, reps: '10/leg', restSec: 90 },
          { id: 'pe-9', exerciseId: 'ex-plank', sets: 3, reps: '45s', restSec: 60 },
        ],
      },
      { id: 'pd-3', title: 'Rest & Walk', dayIndex: 2, isRest: true, exercises: [] },
      {
        id: 'pd-4', title: 'Upper B', dayIndex: 3, focus: 'Shoulders & arms volume', isRest: false,
        exercises: [
          { id: 'pe-10', exerciseId: 'ex-ohp', sets: 4, reps: '6-8', restSec: 150 },
          { id: 'pe-11', exerciseId: 'ex-pullup', sets: 4, reps: 'AMRAP', restSec: 120, notes: 'Band assist if below 5 reps.' },
          { id: 'pe-12', exerciseId: 'ex-lat-raise', sets: 4, reps: '12-15', restSec: 60 },
          { id: 'pe-13', exerciseId: 'ex-curl-db', sets: 3, reps: '10-12', restSec: 60 },
          { id: 'pe-14', exerciseId: 'ex-tri-press', sets: 3, reps: '12-15', restSec: 60 },
        ],
      },
      {
        id: 'pd-5', title: 'Lower B', dayIndex: 4, focus: 'Hinge & posterior chain', isRest: false,
        exercises: [
          { id: 'pe-15', exerciseId: 'ex-deadlift', sets: 3, reps: '4', restSec: 210, tempo: '21X1' },
          { id: 'pe-16', exerciseId: 'ex-hip-thrust', sets: 4, reps: '8-10', restSec: 120 },
          { id: 'pe-17', exerciseId: 'ex-legcurl', sets: 3, reps: '12', restSec: 90 },
          { id: 'pe-18', exerciseId: 'ex-hanging-leg', sets: 3, reps: '10-12', restSec: 60 },
        ],
      },
      {
        id: 'pd-6', title: 'Conditioning', dayIndex: 5, focus: 'Zone 2 aerobic base', isRest: false,
        exercises: [{ id: 'pe-19', exerciseId: 'ex-run', sets: 1, reps: '35 min', restSec: 0, notes: 'Conversational pace. HR 130\u2013145.' }],
      },
      { id: 'pd-7', title: 'Rest', dayIndex: 6, isRest: true, exercises: [] },
    ],
  },
  {
    id: 'plan-2',
    coachId: 'u-coach-1',
    athleteId: 'u-ath-2',
    title: 'Cut & Keep Strength',
    description: '3-day full-body strength while in a deficit, plus daily step target.',
    weeks: 8,
    status: 'active',
    createdAt: now - 30 * DAY,
    updatedAt: now - 5 * DAY,
    days: [
      {
        id: 'pd-8', title: 'Full Body A', dayIndex: 0, isRest: false, focus: 'Squat + press',
        exercises: [
          { id: 'pe-20', exerciseId: 'ex-squat', sets: 3, reps: '5', restSec: 180 },
          { id: 'pe-21', exerciseId: 'ex-bench', sets: 3, reps: '6', restSec: 150 },
          { id: 'pe-22', exerciseId: 'ex-row-cable', sets: 3, reps: '10', restSec: 90 },
        ],
      },
      { id: 'pd-9', title: 'Rest', dayIndex: 1, isRest: true, exercises: [] },
      {
        id: 'pd-10', title: 'Full Body B', dayIndex: 2, isRest: false, focus: 'Hinge + pull',
        exercises: [
          { id: 'pe-23', exerciseId: 'ex-deadlift', sets: 3, reps: '5', restSec: 210 },
          { id: 'pe-24', exerciseId: 'ex-ohp', sets: 3, reps: '8', restSec: 120 },
          { id: 'pe-25', exerciseId: 'ex-lat-pd', sets: 3, reps: '10', restSec: 90 },
        ],
      },
      { id: 'pd-11', title: 'Rest', dayIndex: 3, isRest: true, exercises: [] },
      {
        id: 'pd-12', title: 'Full Body C', dayIndex: 4, isRest: false, focus: 'Volume + conditioning',
        exercises: [
          { id: 'pe-26', exerciseId: 'ex-legpress', sets: 3, reps: '12', restSec: 90 },
          { id: 'pe-27', exerciseId: 'ex-pushup', sets: 3, reps: 'AMRAP', restSec: 90 },
          { id: 'pe-28', exerciseId: 'ex-kb-swing', sets: 5, reps: '15', restSec: 60 },
        ],
      },
      { id: 'pd-13', title: 'Rest', dayIndex: 5, isRest: true, exercises: [] },
      { id: 'pd-14', title: 'Rest', dayIndex: 6, isRest: true, exercises: [] },
    ],
  },
  {
    id: 'plan-tpl-1',
    coachId: 'u-coach-1',
    title: 'Template — Beginner Full Body',
    description: 'Starter template: 3 full-body days for new clients, first 4 weeks.',
    weeks: 4,
    status: 'draft',
    createdAt: now - 100 * DAY,
    updatedAt: now - 100 * DAY,
    days: [
      {
        id: 'pd-15', title: 'Day 1', dayIndex: 0, isRest: false,
        exercises: [
          { id: 'pe-29', exerciseId: 'ex-squat', sets: 3, reps: '8', restSec: 120 },
          { id: 'pe-30', exerciseId: 'ex-pushup', sets: 3, reps: '10', restSec: 90 },
          { id: 'pe-31', exerciseId: 'ex-row-cable', sets: 3, reps: '12', restSec: 90 },
        ],
      },
      { id: 'pd-16', title: 'Rest', dayIndex: 1, isRest: true, exercises: [] },
      {
        id: 'pd-17', title: 'Day 2', dayIndex: 2, isRest: false,
        exercises: [
          { id: 'pe-32', exerciseId: 'ex-rdl', sets: 3, reps: '10', restSec: 120 },
          { id: 'pe-33', exerciseId: 'ex-ohp', sets: 3, reps: '10', restSec: 90 },
          { id: 'pe-34', exerciseId: 'ex-plank', sets: 3, reps: '30s', restSec: 60 },
        ],
      },
      { id: 'pd-18', title: 'Rest', dayIndex: 3, isRest: true, exercises: [] },
      {
        id: 'pd-19', title: 'Day 3', dayIndex: 4, isRest: false,
        exercises: [
          { id: 'pe-35', exerciseId: 'ex-lunge', sets: 3, reps: '10/leg', restSec: 90 },
          { id: 'pe-36', exerciseId: 'ex-lat-pd', sets: 3, reps: '12', restSec: 90 },
          { id: 'pe-37', exerciseId: 'ex-kb-swing', sets: 3, reps: '12', restSec: 60 },
        ],
      },
      { id: 'pd-20', title: 'Rest', dayIndex: 5, isRest: true, exercises: [] },
      { id: 'pd-21', title: 'Rest', dayIndex: 6, isRest: true, exercises: [] },
    ],
  },
];

// ---------------------------------------------------------------------------
// Workout log history for Maya (u-ath-1) — builds calendar & streaks
// ---------------------------------------------------------------------------

function buildWorkoutHistory(): WorkoutLog[] {
  const logs: WorkoutLog[] = [];
  const trainDays = [0, 1, 3, 4, 5]; // plan-1 training dayIndexes
  for (let d = 45; d >= 1; d--) {
    const date = new Date();
    date.setDate(date.getDate() - d);
    const weekday = (date.getDay() + 6) % 7; // Monday = 0
    if (!trainDays.includes(weekday)) continue;
    // ~85% adherence, with a guaranteed 5-day recent streak
    const missed = d > 7 && (d * 7) % 13 === 0;
    if (missed) continue;
    const day = seedPlans[0]!.days.find((x) => x.dayIndex === weekday)!;
    const startedAt = date.setHours(18, 15, 0, 0);
    logs.push({
      id: `wl-${d}`,
      athleteId: 'u-ath-1',
      planId: 'plan-1',
      planDayId: day.id,
      date: daysAgoKey(d),
      startedAt,
      completedAt: startedAt + 55 * 60000,
      durationSec: 55 * 60,
      exercises: day.exercises.map((pe, i) => ({
        planExerciseId: pe.id,
        exerciseId: pe.exerciseId,
        sets: Array.from({ length: pe.sets }, (_, s) => ({
          setNumber: s + 1,
          weightKg: pe.exerciseId === 'ex-run' ? null : 20 + i * 10 + Math.round((45 - d) / 6) * 2.5,
          reps: pe.exerciseId === 'ex-run' ? null : 8,
          completed: true,
        })),
      })),
      feeling: ((d % 3) + 3) as 3 | 4 | 5,
      synced: true,
    });
  }
  return logs;
}

export const seedWorkoutLogs: WorkoutLog[] = buildWorkoutHistory();

// ---------------------------------------------------------------------------
// Daily check-ins
// ---------------------------------------------------------------------------

const moods: Mood[] = ['great', 'good', 'okay', 'good', 'great', 'low', 'good'];

function buildCheckins(): DailyCheckin[] {
  const items: DailyCheckin[] = [];
  const journals = [
    'Slept well and hit all my sets. Energy was solid through the whole session.',
    'Busy day at work but got the workout in. Left shoulder felt a bit tight on presses.',
    'Really felt the deficit today — hungry in the evening but stayed on plan.',
    'Best session in weeks. Squats moved fast, added 2.5kg.',
    'Low energy, short on sleep. Kept intensity moderate as planned.',
    'Rest day. Long walk with family, 12k steps.',
    'Felt strong. Pull-ups up to 6 clean reps!',
  ];
  for (let d = 14; d >= 0; d--) {
    if (d % 4 === 3) continue; // occasional missed day
    const reviewed = d > 1;
    items.push({
      id: `ci-1-${d}`,
      athleteId: 'u-ath-1',
      coachId: 'u-coach-1',
      date: daysAgoKey(d),
      createdAt: now - d * DAY - 2 * HOUR,
      mood: moods[d % moods.length]!,
      energy: 5 + ((d * 3) % 5),
      sleepHours: 6 + ((d * 2) % 3),
      journal: journals[d % journals.length]!,
      photoUri: d % 5 === 0 ? photo(`checkin-${d}`) : undefined,
      status: reviewed ? 'reviewed' : 'pending',
      coachComment: reviewed ? 'Nice work — keep protein high on rest days and let\u2019s watch that shoulder on Upper B.' : undefined,
      reviewedAt: reviewed ? now - d * DAY + 5 * HOUR : undefined,
    });
  }
  // Pending check-ins from other athletes for coach review queue (oldest first)
  const others: [string, number, string][] = [
    ['u-ath-2', 3, 'Weight stuck this week at 91.4kg. Should I drop calories or add cardio? Feeling good otherwise.'],
    ['u-ath-3', 2, 'Managed 3 negatives on pull-ups today! Elbows a little sore after.'],
    ['u-ath-4', 1, 'Bench felt heavy at 85kg. Failed last rep of set 3. Video attached in chat.'],
    ['u-ath-5', 1, 'First week back done. Core work feels great, keeping intensity low as agreed.'],
    ['u-ath-6', 0, 'Travelling for work next week — can we swap to hotel workouts?'],
  ];
  others.forEach(([athleteId, d, journal], i) => {
    items.push({
      id: `ci-q-${i}`,
      athleteId,
      coachId: 'u-coach-1',
      date: daysAgoKey(d),
      createdAt: now - d * DAY - (i + 2) * HOUR,
      mood: (['good', 'great', 'okay', 'good', 'okay'] as Mood[])[i]!,
      energy: 6 + (i % 4),
      sleepHours: 7,
      journal,
      photoUri: i === 2 ? photo(`q-${i}`) : undefined,
      status: 'pending',
    });
  });
  return items;
}

export const seedCheckins: DailyCheckin[] = buildCheckins();

// ---------------------------------------------------------------------------
// Nutrition
// ---------------------------------------------------------------------------

export const seedNutritionPlans: NutritionPlan[] = [
  {
    id: 'np-1',
    coachId: 'u-coach-1',
    athleteId: 'u-ath-1',
    title: 'Lean Build Nutrition',
    targets: { calories: 2150, proteinG: 150, carbsG: 230, fatG: 65 },
    notes: 'Protein at every meal. Carbs concentrated around training. 2 free meals per week.',
    updatedAt: now - 10 * DAY,
    meals: [
      { id: 'mt-1', name: 'Meal 1 — Breakfast', description: 'Greek yoghurt bowl: 250g yoghurt, 60g oats, berries, honey.', macros: { calories: 520, proteinG: 38, carbsG: 68, fatG: 12 } },
      { id: 'mt-2', name: 'Meal 2 — Lunch', description: 'Chicken shawarma bowl: 180g chicken, rice, salad, garlic sauce (light).', macros: { calories: 640, proteinG: 48, carbsG: 70, fatG: 18 } },
      { id: 'mt-3', name: 'Meal 3 — Pre-training', description: 'Banana + 30g whey shake.', macros: { calories: 260, proteinG: 26, carbsG: 34, fatG: 3 } },
      { id: 'mt-4', name: 'Meal 4 — Dinner', description: 'Salmon 160g, sweet potato 250g, greens with olive oil.', macros: { calories: 730, proteinG: 38, carbsG: 58, fatG: 32 } },
    ],
  },
  {
    id: 'np-2',
    coachId: 'u-coach-1',
    athleteId: 'u-ath-2',
    title: 'Cut Protocol — 750 deficit',
    targets: { calories: 2000, proteinG: 190, carbsG: 160, fatG: 60 },
    notes: 'High-volume foods. 10k steps daily is part of the plan.',
    updatedAt: now - 6 * DAY,
    meals: [
      { id: 'mt-5', name: 'Meal 1', description: 'Egg-white omelette, toast, fruit.', macros: { calories: 450, proteinG: 40, carbsG: 45, fatG: 12 } },
      { id: 'mt-6', name: 'Meal 2', description: 'Lean beef bowl with rice & vegetables.', macros: { calories: 620, proteinG: 55, carbsG: 55, fatG: 18 } },
      { id: 'mt-7', name: 'Meal 3', description: 'Cottage cheese, rice cakes, whey.', macros: { calories: 380, proteinG: 50, carbsG: 30, fatG: 6 } },
      { id: 'mt-8', name: 'Meal 4', description: 'White fish, potatoes, big salad.', macros: { calories: 550, proteinG: 45, carbsG: 30, fatG: 24 } },
    ],
  },
];

function buildMealLogs(): MealLog[] {
  const logs: MealLog[] = [];
  const meals = seedNutritionPlans[0]!.meals;
  for (let d = 10; d >= 0; d--) {
    const count = d === 0 ? 2 : d % 6 === 5 ? 3 : 4; // today partially logged
    for (let m = 0; m < count; m++) {
      const t = meals[m]!;
      logs.push({
        id: `ml-${d}-${m}`,
        athleteId: 'u-ath-1',
        date: daysAgoKey(d),
        mealTemplateId: t.id,
        name: t.name,
        macros: t.macros,
        loggedAt: now - d * DAY - (12 - m * 3) * HOUR,
      });
    }
  }
  return logs;
}

export const seedMealLogs: MealLog[] = buildMealLogs();

// ---------------------------------------------------------------------------
// Progress
// ---------------------------------------------------------------------------

function buildProgress(): ProgressEntry[] {
  const entries: ProgressEntry[] = [];
  for (let w = 20; w >= 0; w--) {
    const d = w * 7;
    entries.push({
      id: `pr-${w}`,
      athleteId: 'u-ath-1',
      date: daysAgoKey(d),
      weightKg: Math.round((64.8 - (20 - w) * 0.08 + Math.sin(w) * 0.25) * 10) / 10,
      bodyFatPct: Math.round((24.5 - (20 - w) * 0.18) * 10) / 10,
      measurements: w % 4 === 0 ? { waist: Math.round((71 - (20 - w) * 0.12) * 10) / 10, hips: 96, arms: Math.round((28 + (20 - w) * 0.06) * 10) / 10, chest: 90, thighs: 55 } : undefined,
      createdAt: now - d * DAY,
    });
  }
  return entries;
}

export const seedProgressEntries: ProgressEntry[] = buildProgress();

export const seedProgressPhotos: ProgressPhoto[] = [
  { id: 'pp-1', athleteId: 'u-ath-1', date: daysAgoKey(140), uri: photo('maya-front-0'), pose: 'front', createdAt: now - 140 * DAY },
  { id: 'pp-2', athleteId: 'u-ath-1', date: daysAgoKey(140), uri: photo('maya-side-0'), pose: 'side', createdAt: now - 140 * DAY },
  { id: 'pp-3', athleteId: 'u-ath-1', date: daysAgoKey(84), uri: photo('maya-front-1'), pose: 'front', createdAt: now - 84 * DAY },
  { id: 'pp-4', athleteId: 'u-ath-1', date: daysAgoKey(84), uri: photo('maya-side-1'), pose: 'side', createdAt: now - 84 * DAY },
  { id: 'pp-5', athleteId: 'u-ath-1', date: daysAgoKey(28), uri: photo('maya-front-2'), pose: 'front', createdAt: now - 28 * DAY },
  { id: 'pp-6', athleteId: 'u-ath-1', date: daysAgoKey(28), uri: photo('maya-side-2'), pose: 'side', createdAt: now - 28 * DAY },
  { id: 'pp-7', athleteId: 'u-ath-1', date: daysAgoKey(1), uri: photo('maya-front-3'), pose: 'front', createdAt: now - 1 * DAY },
  { id: 'pp-8', athleteId: 'u-ath-1', date: daysAgoKey(1), uri: photo('maya-side-3'), pose: 'side', createdAt: now - 1 * DAY },
];

// ---------------------------------------------------------------------------
// Health goals
// ---------------------------------------------------------------------------

export const seedHealthGoals: HealthGoal[] = [
  { id: 'hg-1', athleteId: 'u-ath-1', coachId: 'u-coach-1', metric: 'water', label: 'Water', unit: 'L', target: 3, createdAt: now - 60 * DAY },
  { id: 'hg-2', athleteId: 'u-ath-1', coachId: 'u-coach-1', metric: 'steps', label: 'Steps', unit: 'steps', target: 9000, createdAt: now - 60 * DAY },
  { id: 'hg-3', athleteId: 'u-ath-1', coachId: 'u-coach-1', metric: 'custom', label: 'Mobility work', unit: 'min', target: 10, createdAt: now - 30 * DAY },
  { id: 'hg-4', athleteId: 'u-ath-2', coachId: 'u-coach-1', metric: 'steps', label: 'Steps', unit: 'steps', target: 10000, createdAt: now - 30 * DAY },
];

function buildGoalLogs(): HealthGoalLog[] {
  const logs: HealthGoalLog[] = [];
  for (let d = 14; d >= 0; d--) {
    logs.push({ id: `hgl-w-${d}`, goalId: 'hg-1', athleteId: 'u-ath-1', date: daysAgoKey(d), value: Math.round((2 + ((d * 7) % 15) / 10) * 10) / 10 });
    logs.push({ id: `hgl-s-${d}`, goalId: 'hg-2', athleteId: 'u-ath-1', date: daysAgoKey(d), value: 6500 + ((d * 997) % 5000) });
    if (d % 2 === 0) logs.push({ id: `hgl-m-${d}`, goalId: 'hg-3', athleteId: 'u-ath-1', date: daysAgoKey(d), value: 10 });
    logs.push({ id: `hgl-s2-${d}`, goalId: 'hg-4', athleteId: 'u-ath-2', date: daysAgoKey(d), value: 8000 + ((d * 1381) % 4500) });
  }
  return logs;
}

export const seedHealthGoalLogs: HealthGoalLog[] = buildGoalLogs();

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export const seedBookings: Booking[] = [
  { id: 'bk-1', athleteId: 'u-ath-1', coachId: 'u-coach-1', type: 'video-review', startsAt: now + 2 * DAY + 5 * HOUR, durationMin: 30, meetLink: 'https://meet.google.com/abc-defg-hij', note: 'Review squat depth video from last week', status: 'confirmed', createdAt: now - 2 * DAY },
  { id: 'bk-2', athleteId: 'u-ath-2', coachId: 'u-coach-1', type: 'call-15', startsAt: now + 1 * DAY + 3 * HOUR, durationMin: 15, meetLink: 'https://meet.google.com/xyz-uvwq-rst', note: 'Plateau discussion', status: 'confirmed', createdAt: now - 1 * DAY },
  { id: 'bk-3', athleteId: 'u-ath-4', coachId: 'u-coach-1', type: 'full-session', startsAt: now + 3 * DAY + 7 * HOUR, durationMin: 60, status: 'requested', createdAt: now - 6 * HOUR },
  { id: 'bk-4', athleteId: 'u-ath-1', coachId: 'u-coach-1', type: 'call-15', startsAt: now - 12 * DAY, durationMin: 15, meetLink: 'https://meet.google.com/old-call-one', status: 'completed', createdAt: now - 14 * DAY },
  { id: 'bk-5', athleteId: 'u-ath-1', coachId: 'u-coach-1', type: 'full-session', startsAt: now - 30 * DAY, durationMin: 60, meetLink: 'https://meet.google.com/old-sess-two', status: 'completed', createdAt: now - 33 * DAY },
  { id: 'bk-6', athleteId: 'u-ath-5', coachId: 'u-coach-1', type: 'video-review', startsAt: now + 5 * DAY + 4 * HOUR, durationMin: 30, status: 'requested', createdAt: now - 3 * HOUR },
];

// ---------------------------------------------------------------------------
// Messaging
// ---------------------------------------------------------------------------

export const seedConversations: Conversation[] = [
  { id: 'cv-1', athleteId: 'u-ath-1', coachId: 'u-coach-1', lastMessageAt: now - 2 * HOUR, lastMessagePreview: 'Perfect, see you Thursday at 6pm \uD83D\uDCAA', unread: { 'u-ath-1': 1, 'u-coach-1': 0 } },
  { id: 'cv-2', athleteId: 'u-ath-2', coachId: 'u-coach-1', lastMessageAt: now - 5 * HOUR, lastMessagePreview: 'Sent the form video from today\u2019s bench session', unread: { 'u-ath-2': 0, 'u-coach-1': 2 } },
  { id: 'cv-3', athleteId: 'u-ath-3', coachId: 'u-coach-1', lastMessageAt: now - 1 * DAY, lastMessagePreview: 'Thanks coach! Will do.', unread: { 'u-ath-3': 0, 'u-coach-1': 0 } },
  { id: 'cv-4', athleteId: 'u-ath-5', coachId: 'u-coach-1', lastMessageAt: now - 2 * DAY, lastMessagePreview: 'That works for me \uD83D\uDE4C', unread: { 'u-ath-5': 0, 'u-coach-1': 0 } },
];

export const seedMessages: Message[] = [
  { id: 'm-1', conversationId: 'cv-1', senderId: 'u-ath-1', text: 'Hey coach! Finished Upper A — bench moved really well today. All sets at 42.5kg for 8.', sentAt: now - 26 * HOUR, readBy: ['u-ath-1', 'u-coach-1'] },
  { id: 'm-2', conversationId: 'cv-1', senderId: 'u-coach-1', text: 'That\u2019s great progress Maya. Bump to 45kg next session, keep the same tempo.', sentAt: now - 25 * HOUR, readBy: ['u-ath-1', 'u-coach-1'] },
  { id: 'm-3', conversationId: 'cv-1', senderId: 'u-ath-1', imageUri: photo('msg-gym-1', 600, 800), text: 'Gym was empty tonight — dream conditions \uD83D\uDE04', sentAt: now - 24 * HOUR, readBy: ['u-ath-1', 'u-coach-1'] },
  { id: 'm-4', conversationId: 'cv-1', senderId: 'u-coach-1', text: 'Haha enjoy it. Don\u2019t forget your check-in photo this week.', sentAt: now - 23 * HOUR, readBy: ['u-ath-1', 'u-coach-1'] },
  { id: 'm-5', conversationId: 'cv-1', senderId: 'u-ath-1', text: 'Booked the video review for Thursday. Can we look at my squat depth?', sentAt: now - 3 * HOUR, readBy: ['u-ath-1', 'u-coach-1'] },
  { id: 'm-6', conversationId: 'cv-1', senderId: 'u-coach-1', text: 'Perfect, see you Thursday at 6pm \uD83D\uDCAA', sentAt: now - 2 * HOUR, readBy: ['u-coach-1'] },
  { id: 'm-7', conversationId: 'cv-2', senderId: 'u-ath-2', text: 'Weight is stuck at 91.4 for two weeks now.', sentAt: now - 6 * HOUR, readBy: ['u-ath-2'] },
  { id: 'm-8', conversationId: 'cv-2', senderId: 'u-ath-2', text: 'Sent the form video from today\u2019s bench session', sentAt: now - 5 * HOUR, readBy: ['u-ath-2'] },
  { id: 'm-9', conversationId: 'cv-3', senderId: 'u-coach-1', text: 'Aisha — add one extra negative rep set this week, elbows will adapt.', sentAt: now - 25 * HOUR, readBy: ['u-ath-3', 'u-coach-1'] },
  { id: 'm-10', conversationId: 'cv-3', senderId: 'u-ath-3', text: 'Thanks coach! Will do.', sentAt: now - 24 * HOUR, readBy: ['u-ath-3', 'u-coach-1'] },
  { id: 'm-11', conversationId: 'cv-4', senderId: 'u-coach-1', text: 'Let\u2019s keep Friday\u2019s session at bodyweight only this week.', sentAt: now - 2 * DAY - HOUR, readBy: ['u-ath-5', 'u-coach-1'] },
  { id: 'm-12', conversationId: 'cv-4', senderId: 'u-ath-5', text: 'That works for me \uD83D\uDE4C', sentAt: now - 2 * DAY, readBy: ['u-ath-5', 'u-coach-1'] },
];

// ---------------------------------------------------------------------------
// Billing
// ---------------------------------------------------------------------------

export const seedSubscriptions: Subscription[] = [
  { id: 'sub-1', athleteId: 'u-ath-1', coachId: 'u-coach-1', months: 6, pricePerMonthAed: 1000, studentDiscountApplied: false, status: 'active', startedAt: now - 160 * DAY, renewsAt: now + 20 * DAY, cardLast4: '4242', cardBrand: 'Visa' },
  { id: 'sub-2', athleteId: 'u-ath-2', coachId: 'u-coach-1', months: 3, pricePerMonthAed: 1200, studentDiscountApplied: false, status: 'active', startedAt: now - 140 * DAY, renewsAt: now + 12 * DAY, cardLast4: '5678', cardBrand: 'Mastercard' },
  { id: 'sub-3', athleteId: 'u-ath-3', coachId: 'u-coach-1', months: 6, pricePerMonthAed: 800, studentDiscountApplied: true, status: 'active', startedAt: now - 120 * DAY, renewsAt: now + 8 * DAY, cardLast4: '1881', cardBrand: 'Visa' },
  { id: 'sub-4', athleteId: 'u-ath-4', coachId: 'u-coach-1', months: 12, pricePerMonthAed: 850, studentDiscountApplied: false, status: 'active', startedAt: now - 90 * DAY, renewsAt: now + 3 * DAY, cardLast4: '9012', cardBrand: 'Visa' },
  { id: 'sub-5', athleteId: 'u-ath-5', coachId: 'u-coach-1', months: 3, pricePerMonthAed: 1200, studentDiscountApplied: false, status: 'paused', startedAt: now - 60 * DAY, renewsAt: now + 30 * DAY, cardLast4: '7777', cardBrand: 'Amex' },
  { id: 'sub-6', athleteId: 'u-ath-6', coachId: 'u-coach-1', months: 3, pricePerMonthAed: 960, studentDiscountApplied: true, status: 'active', startedAt: now - 30 * DAY, renewsAt: now + 60 * DAY, cardLast4: '3333', cardBrand: 'Mastercard' },
  { id: 'sub-7', athleteId: 'u-ath-7', coachId: 'u-coach-2', months: 6, pricePerMonthAed: 800, studentDiscountApplied: false, status: 'active', startedAt: now - 100 * DAY, renewsAt: now + 15 * DAY, cardLast4: '2020', cardBrand: 'Visa' },
  { id: 'sub-8', athleteId: 'u-ath-8', coachId: 'u-coach-2', months: 3, pricePerMonthAed: 950, studentDiscountApplied: false, status: 'past_due', startedAt: now - 45 * DAY, renewsAt: now - 2 * DAY, cardLast4: '0099', cardBrand: 'Mastercard' },
];

function buildPayments(): Payment[] {
  const payments: Payment[] = [];
  let n = 1;
  for (const sub of seedSubscriptions) {
    const coach = seedCoachProfiles.find((c) => c.userId === sub.coachId)!;
    const monthsPaid = Math.min(6, Math.max(1, Math.floor((now - sub.startedAt) / (30 * DAY))));
    for (let m = 0; m < monthsPaid; m++) {
      const amount = sub.pricePerMonthAed;
      const commission = coach.isOwner ? 0 : Math.round(amount * (coach.commissionPct / 100));
      payments.push({
        id: `pay-${sub.id}-${m}`,
        subscriptionId: sub.id,
        athleteId: sub.athleteId,
        coachId: sub.coachId,
        amountAed: amount,
        commissionAed: commission,
        netAed: amount - commission,
        paidAt: sub.startedAt + m * 30 * DAY,
        status: sub.id === 'sub-5' && m === 1 ? 'refunded' : 'paid',
        invoiceNumber: `INV-2026-${String(n++).padStart(4, '0')}`,
      });
    }
  }
  return payments.sort((a, b) => b.paidAt - a.paidAt);
}

export const seedPayments: Payment[] = buildPayments();

export const seedPayouts: Payout[] = [
  { id: 'po-1', coachId: 'u-coach-2', amountAed: 3937, periodLabel: 'May 2026', status: 'paid', paidAt: now - 32 * DAY },
  { id: 'po-2', coachId: 'u-coach-2', amountAed: 4125, periodLabel: 'June 2026', status: 'paid', paidAt: now - 3 * DAY },
  { id: 'po-3', coachId: 'u-coach-2', amountAed: 1312, periodLabel: 'July 2026 (to date)', status: 'pending' },
  { id: 'po-4', coachId: 'u-coach-1', amountAed: 18300, periodLabel: 'June 2026', status: 'paid', paidAt: now - 3 * DAY },
  { id: 'po-5', coachId: 'u-coach-1', amountAed: 6180, periodLabel: 'July 2026 (to date)', status: 'pending' },
];

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export const seedNotifications: AppNotification[] = [
  { id: 'nt-1', userId: 'u-ath-1', kind: 'message', title: 'New message from Coach Omar', body: 'Perfect, see you Thursday at 6pm \uD83D\uDCAA', createdAt: now - 2 * HOUR, read: false, route: '/chat/cv-1' },
  { id: 'nt-2', userId: 'u-ath-1', kind: 'booking', title: 'Video review confirmed', body: 'Thu — 30 min video review with Coach Omar', createdAt: now - 26 * HOUR, read: false, route: '/(athlete)/bookings' },
  { id: 'nt-3', userId: 'u-ath-1', kind: 'checkin', title: 'Check-in reviewed', body: 'Coach Omar left a comment on your Tuesday check-in', createdAt: now - 2 * DAY, read: true, route: '/(athlete)/checkin' },
  { id: 'nt-4', userId: 'u-ath-1', kind: 'plan', title: 'Training plan updated', body: 'Lean Build — Phase 2 was updated by your coach', createdAt: now - 2 * DAY - 3 * HOUR, read: true, route: '/(athlete)/training' },
  { id: 'nt-5', userId: 'u-coach-1', kind: 'checkin', title: '5 check-ins waiting', body: 'Oldest from James Carter, 3 days ago', createdAt: now - 3 * HOUR, read: false, route: '/(coach)/checkins' },
  { id: 'nt-6', userId: 'u-coach-1', kind: 'booking', title: 'New session request', body: 'Lucas Mendes requested a full session', createdAt: now - 6 * HOUR, read: false, route: '/(coach)/schedule' },
  { id: 'nt-7', userId: 'u-coach-1', kind: 'payment', title: 'Payout sent', body: 'AED 18,300 for June 2026 is on the way', createdAt: now - 3 * DAY, read: true, route: '/(coach)/earnings' },
  { id: 'nt-8', userId: 'u-admin', kind: 'approval', title: 'New coach application', body: 'Daniel Kim applied with 2 certifications', createdAt: now - 3 * DAY, read: false, route: '/(admin)/coaches' },
  { id: 'nt-9', userId: 'u-admin', kind: 'payment', title: 'Subscription past due', body: 'Tom Becker\u2019s payment failed — card expired', createdAt: now - 2 * DAY, read: false, route: '/(admin)/subscriptions' },
];

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

export const seedFaq: FaqItem[] = [
  { id: 'faq-1', category: 'account', question: 'How do I join Athletics Department?', answer: 'Athletics Department is invite-only. Your coach sends you a personal invite link or QR code — open it, create your account, and you\u2019re connected to your coach automatically.' },
  { id: 'faq-2', category: 'account', question: 'Can I switch coaches?', answer: 'Yes. Contact support and we\u2019ll transfer your history, plans and progress photos to your new coach within 24 hours.' },
  { id: 'faq-3', category: 'training', question: 'Does workout logging work offline?', answer: 'Yes — log your entire session with no internet. Everything is stored on your device and syncs automatically the moment you\u2019re back online. Look for the sync badge on your workout.' },
  { id: 'faq-4', category: 'training', question: 'What happens after I submit a daily check-in?', answer: 'Your coach is notified immediately and reviews check-ins oldest-first. You\u2019ll get a notification when they leave a comment.' },
  { id: 'faq-5', category: 'billing', question: 'What payment methods are supported?', answer: 'All major cards via Stripe. Prices are in AED and charged monthly for the duration of your 3, 6, or 12-month plan.' },
  { id: 'faq-6', category: 'billing', question: 'How does the student discount work?', answer: 'If your coach offers one, verify with a valid student ID during checkout and the discount applies to every month of your plan.' },
  { id: 'faq-7', category: 'billing', question: 'Can I pause my subscription?', answer: 'Subscriptions can be paused for up to 30 days once per plan period — for travel, illness, or exams. Ask your coach or contact support.' },
  { id: 'faq-8', category: 'coaching', question: 'How do video check-ins work?', answer: 'Book a slot from the Bookings tab. Your coach confirms and attaches a Google Meet link — you\u2019ll find it on the booking card and get a reminder 30 minutes before.' },
  { id: 'faq-9', category: 'account', question: 'How do I delete my account?', answer: 'Go to Settings → Privacy & Data → Delete account. All personal data, photos and messages are permanently removed within 30 days, in line with UAE data-protection law.' },
];
