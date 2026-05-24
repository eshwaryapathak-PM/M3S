// M3S domain types — single source of truth for app + Drizzle schema.
// Each interface mirrors a Postgres table with snake_case columns mapped to camelCase fields.

// ─── Enums ────────────────────────────────────────────────────────────
export type CoachTone = 'espresso' | 'walnut' | 'terra' | 'sage' | 'sand' | 'clay';
export type CoachSpecialty =
  | 'Hypertrophy' | 'Strength' | 'Recovery' | 'Hyrox Prep'
  | 'Conditioning' | 'Mobility' | 'Pilates' | 'Yoga' | 'Breathwork';
export type ClientStatus = 'active' | 'hold' | 'ending' | 'churned';
export type Gender = 'Female' | 'Male' | 'Non-binary' | 'Prefer not to say';
export type Experience = '<6 months' | '6–24 months' | '2–5 years' | '5+ years';
export type Goal = 'Muscle Gain' | 'Fat Loss' | 'Strength' | 'Performance' | 'General Fitness';
export type Injury = 'Shoulder' | 'Knee' | 'Hip' | 'Lower back' | 'Ankle' | 'Wrist' | 'Neck' | 'Other';
export type MSKArea = 'Shoulders' | 'Hips' | 'Thoracic' | 'Knees' | 'Lower back';
export type MSKStatus = 'Cleared' | 'Tight' | 'Limited' | 'Restricted';
export type BloodStatus = 'Optimal' | 'Normal' | 'High' | 'Low' | 'Deficient';
export type RunFrequency = 'Never' | '1x / week' | '2x / week' | '3x / week' | '4x / week' | '5x / week';
export type SessionType = 'pt' | 'group' | 'block' | 'pending';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled' | 'no-show';
export type InviteStatus = 'pending' | 'accepted' | 'rejected' | 'reassigned' | 'overdue';
export type ScoreDimension = 'overall' | 'strength' | 'conditioning' | 'metabolic';
export type AdminRole = 'owner' | 'manager';
export type CafeOrderStatus = 'placed' | 'preparing' | 'ready' | 'collected' | 'cancelled';
export type PaymentType = 'session' | 'package' | 'refund';
export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';
export type UploadedBy = 'client' | 'coach' | 'admin';
export type OnboardingStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

// ─── People ───────────────────────────────────────────────────────────
export interface Coach {
  id: string;
  name: string;
  role: string;
  tone: CoachTone;
  initials: string;
  bio: string;
  /** Display-only formatted string with middle-dot separators (e.g. "Strength · Hyrox · Recovery"). Never parsed. */
  cert: string;
  specialties: CoachSpecialty[];
  photoUrl: string | null;
  ptEligible: boolean;
  createdAt: string;
}

export interface AdminUserRow {
  coachId: string;
  adminRole: AdminRole;
  canManageAdmins: boolean;
  grantedBy: string | null;
  grantedAt: string;
}

export interface Client {
  id: string;
  name: string;
  age: number;
  gender: Gender;
  phone: string;
  email: string;
  assignedCoachId: string | null;
  status: ClientStatus;

  // DPDP consent (middle-path: 3 columns + privacy_policy_versions FK)
  consentHealthData: boolean;
  consentHealthDataAt: string | null;
  consentVersion: string | null;

  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Assessment ──────────────────────────────────────────────────────
export interface ClientAssessment {
  clientId: string;
  experience: Experience | null;
  goal: Goal | null;
  daysPerWeek: number | null;
  notes: string | null;
  injuries: Injury[];
  injuryNotes: string | null;
  preferredSlots: string[];
  customSlots: string[];
  running5k: string | null;
  running2k: string | null;
  runRating: number | null;
  runFrequency: RunFrequency | null;
  runInjuryFlag: boolean;
  updatedAt: string;
}

// ─── Onboarding draft (resumable funnel) ─────────────────────────────
export interface OnboardingDraft {
  id: string;
  step: OnboardingStep;
  payload: OnboardingDraftPayload;
  updatedAt: string;
  expiresAt: string;
}

export interface OnboardingDraftPayload {
  // Step 1 — identity + consent
  name?: string;
  age?: number;
  gender?: Gender;
  phone?: string;
  email?: string;
  consentHealthData?: boolean;
  consentVersion?: string;
  // Step 2 — goals
  experience?: Experience;
  goal?: Goal;
  daysPerWeek?: number;
  goalNotes?: string;
  // Step 3 — injuries
  injuries?: Injury[];
  injuryNotes?: string;
  // Step 4 — BCA (optional)
  bcaScanUrl?: string;
  bca?: { weight: number; bodyFatPct: number; muscleKg: number; visceralFat: number };
  // Step 5 — blood (optional)
  bloodReportUrl?: string;
  bloodMarkers?: BloodMarker[];
  // Step 6 — MSK
  mskAssessments?: Array<{ area: MSKArea; status: MSKStatus; notes?: string }>;
  // Step 7 — running
  running5k?: string;
  running2k?: string;
  runRating?: number;
  runFrequency?: RunFrequency;
  runInjuryFlag?: boolean;
}

// ─── Health data (DPDP scope — every row carries consentVersion) ─────
export interface BodyCompEntry {
  id: string;
  clientId: string;
  date: string;
  weight: number;
  bodyFatPct: number;
  muscleKg: number;
  visceralFat: number;
  bmi: number | null;
  metabolicAge: number | null;
  fileUrl: string | null;
  uploadedBy: UploadedBy;
  consentVersion: string;
  createdAt: string;
}

export interface BloodPanel {
  id: string;
  clientId: string;
  panelDate: string;
  fileUrl: string | null;
  results: BloodMarker[];
  consentVersion: string;
  createdAt: string;
}

export interface BloodMarker {
  name: string;
  value: string; // string — labs send '<5', '>500'
  unit: string;
  status: BloodStatus;
}

export interface MSKAssessmentRow {
  id: string;
  clientId: string;
  area: MSKArea;
  status: MSKStatus;
  notes: string | null;
  consentVersion: string;
  assessedAt: string;
}

// ─── Scheduling (canonical UTC; render IST via formatDateIST) ────────
export interface Session {
  id: string;
  coachId: string;
  clientId: string | null;
  type: SessionType;
  scheduledAt: string; // ISO UTC
  durationMinutes: number;
  status: SessionStatus;
  title: string | null;
  notes: string | null;
  programmeId: string | null;
  createdAt: string;
}

export interface Invite {
  id: string;
  clientId: string;
  coachId: string;
  requestedSlot: string; // ISO UTC
  durationMinutes: number;
  note: string | null;
  status: InviteStatus;
  reason: string | null;
  reassignedToCoachId: string | null;
  submittedAt: string;
  resolvedAt: string | null;
}

// ─── Coach writes ─────────────────────────────────────────────────────
export interface SessionNote {
  id: string;
  clientId: string;
  coachId: string;
  date: string;
  sessionType: string;
  text: string;
  tags: string[];
  mediaUrls: string[];
  visibleToClient: boolean;
  createdAt: string;
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  coachId: string;
  period: string;
  startDate: string;
  endDate: string | null;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  notes: string | null;
  tags: string[];
  createdAt: string;
}

export interface CoachOverride {
  clientId: string;
  dimension: ScoreDimension;
  /** 0–10. 0 ≠ unset — always check `value !== undefined`. */
  value: number;
  comment: string | null;
  coachId: string;
  setAt: string;
}

// ─── Ratings ──────────────────────────────────────────────────────────
export interface RatingScores {
  workout: number; // 1–5
  form: number;
  communication: number;
  structure: number;
  content: number;
}

export interface Rating {
  id: string;
  /** FK → sessions.id, NOT NULL, UNIQUE — production upsert key. */
  sessionId: string;
  clientId: string;
  coachId: string;
  sessionDate: string;
  sessionType: string;
  scores: RatingScores;
  overall: number;
  comment: string | null;
  submittedAt: string;
}

// ─── Packages (billing) + Programmes (training-plan structure) ───────
export interface Package {
  id: string;
  clientId: string;
  coachId: string;
  /** Canonical "package size purchased". `done` derived from sessions COUNT. */
  totalSessions: number;
  amount: number; // INR paise
  purchasedAt: string;
}

export interface Programme {
  id: string;
  clientId: string;
  coachId: string;
  type: string;
  startDate: string;
  endDate: string;
  /** FK to the package that funded this programme. Null for comped/legacy plans. */
  packageId: string | null;
}

export interface Milestone {
  id: string;
  programmeId: string;
  week: number;
  title: string;
  completedAt: string | null;
}

// ─── Payments (paise; typed by paymentType; positive only) ───────────
export interface Payment {
  id: string;
  clientId: string;
  paymentType: PaymentType;
  /** Required iff paymentType='session'. */
  sessionId: string | null;
  /** Required iff paymentType='package'. */
  packageId: string | null;
  /** Required iff paymentType='refund'. */
  refundOfPaymentId: string | null;
  amount: number; // INR paise, always positive
  currency: 'INR';
  status: PaymentStatus;
  razorpayPaymentId: string | null;
  razorpayOrderId: string | null;
  createdAt: string;
}

// ─── Café ─────────────────────────────────────────────────────────────
export interface CafeOrder {
  id: string;
  customerPhone: string; // E.164
  customerName: string | null;
  clientId: string | null;
  items: CafeOrderItem[];
  total: number; // INR paise
  pickupTime: string; // ISO UTC (render IST)
  whatsappSent: boolean;
  petpoojaWebhookSent: boolean;
  status: CafeOrderStatus;
  createdAt: string;
}

export interface CafeOrderItem {
  itemId: string;
  name: string;
  qty: number;
  unitPrice: number; // INR paise snapshot at order time
}

// ─── Privacy policy versioning ───────────────────────────────────────
export interface PrivacyPolicyVersion {
  id: string;
  contentMd: string;
  effectiveFrom: string;
  summary: string | null;
  createdAt: string;
}

// ─── Semi-static (JSON in /src/data, not DB) ─────────────────────────
export interface KenkoMenuCategory {
  id: string;
  name: string;
  tag: string | null;
  tagColor: string | null;
  items: KenkoMenuItem[];
}

export interface KenkoMenuItem {
  id: string;
  name: string;
  desc: string;
  macros: string | null;
  price: number; // rupees in JSON (editor sanity); paise at order time
  tags: string[];
  veg: boolean;
}
