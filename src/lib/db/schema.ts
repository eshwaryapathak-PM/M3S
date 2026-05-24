// Drizzle schema — mirrors src/types/m3s.ts exactly.
// Snake-case columns in Postgres, camelCase fields in TypeScript (via drizzle.config.ts casing).
// RLS policies are NOT here — they ship as raw SQL migrations per-table as each phase wires them.

import {
  pgTable, pgEnum, text, integer, numeric, boolean, timestamp, date, jsonb, uuid,
  primaryKey, unique, check, AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import type {
  BloodMarker, CafeOrderItem, OnboardingDraftPayload, RatingScores,
} from '@/types/m3s';

// ─── Enums (mirror src/types/m3s.ts exactly) ─────────────────────────
export const coachToneEnum = pgEnum('coach_tone', ['espresso', 'walnut', 'terra', 'sage', 'sand', 'clay']);
export const coachSpecialtyEnum = pgEnum('coach_specialty', [
  'Hypertrophy', 'Strength', 'Recovery', 'Hyrox Prep',
  'Conditioning', 'Mobility', 'Pilates', 'Yoga', 'Breathwork',
]);
export const clientStatusEnum = pgEnum('client_status', ['active', 'hold', 'ending', 'churned']);
export const genderEnum = pgEnum('gender', ['Female', 'Male', 'Non-binary', 'Prefer not to say']);
export const experienceEnum = pgEnum('experience', ['<6 months', '6–24 months', '2–5 years', '5+ years']);
export const goalEnum = pgEnum('goal', ['Muscle Gain', 'Fat Loss', 'Strength', 'Performance', 'General Fitness']);
export const injuryEnum = pgEnum('injury', ['Shoulder', 'Knee', 'Hip', 'Lower back', 'Ankle', 'Wrist', 'Neck', 'Other']);
export const mskAreaEnum = pgEnum('msk_area', ['Shoulders', 'Hips', 'Thoracic', 'Knees', 'Lower back']);
export const mskStatusEnum = pgEnum('msk_status', ['Cleared', 'Tight', 'Limited', 'Restricted']);
export const bloodStatusEnum = pgEnum('blood_status', ['Optimal', 'Normal', 'High', 'Low', 'Deficient']);
export const runFrequencyEnum = pgEnum('run_frequency', [
  'Never', '1x / week', '2x / week', '3x / week', '4x / week', '5x / week',
]);
export const sessionTypeEnum = pgEnum('session_type', ['pt', 'group', 'block', 'pending']);
export const sessionStatusEnum = pgEnum('session_status', ['scheduled', 'completed', 'cancelled', 'no-show']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'rejected', 'reassigned', 'overdue']);
export const scoreDimensionEnum = pgEnum('score_dimension', ['overall', 'strength', 'conditioning', 'metabolic']);
export const adminRoleEnum = pgEnum('admin_role', ['owner', 'manager']);
export const cafeOrderStatusEnum = pgEnum('cafe_order_status', [
  'placed', 'preparing', 'ready', 'collected', 'cancelled',
]);
export const paymentTypeEnum = pgEnum('payment_type', ['session', 'package', 'refund']);
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'succeeded', 'failed', 'refunded']);
export const uploadedByEnum = pgEnum('uploaded_by', ['client', 'coach', 'admin']);

// ─── Privacy policy (referenced by clients + every health-data row) ──
export const privacyPolicyVersions = pgTable('privacy_policy_versions', {
  id: text('id').primaryKey(), // 'v1-2026-05-24'
  contentMd: text('content_md').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  summary: text('summary'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── People ───────────────────────────────────────────────────────────
export const coaches = pgTable('coaches', {
  id: text('id').primaryKey(), // 'lee', 'rahul'
  name: text('name').notNull(),
  role: text('role').notNull(),
  tone: coachToneEnum('tone').notNull(),
  initials: text('initials').notNull(),
  bio: text('bio').notNull(),
  // Display-only string with middle-dot separators (e.g. 'Strength · Hyrox · Recovery').
  // Never parsed. Split into a child table later if filterable certs are needed.
  cert: text('cert').notNull(),
  specialties: coachSpecialtyEnum('specialties').array().notNull(),
  photoUrl: text('photo_url'),
  ptEligible: boolean('pt_eligible').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adminUsers = pgTable('admin_users', {
  coachId: text('coach_id').primaryKey().references(() => coaches.id, { onDelete: 'cascade' }),
  adminRole: adminRoleEnum('admin_role').notNull(),
  canManageAdmins: boolean('can_manage_admins').notNull().default(false),
  grantedBy: text('granted_by').references(() => coaches.id, { onDelete: 'set null' }),
  grantedAt: timestamp('granted_at', { withTimezone: true }).defaultNow().notNull(),
});

export const clients = pgTable('clients', {
  id: uuid('id').primaryKey(), // = auth.users.id
  name: text('name').notNull(),
  age: integer('age').notNull(),
  gender: genderEnum('gender').notNull(),
  phone: text('phone').notNull(),
  email: text('email').notNull(),
  assignedCoachId: text('assigned_coach_id').references(() => coaches.id, { onDelete: 'set null' }),
  status: clientStatusEnum('status').notNull().default('active'),
  consentHealthData: boolean('consent_health_data').notNull().default(false),
  consentHealthDataAt: timestamp('consent_health_data_at', { withTimezone: true }),
  consentVersion: text('consent_version').references(() => privacyPolicyVersions.id, { onDelete: 'restrict' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  consentComplete: check(
    'consent_complete',
    sql`(${t.consentHealthData} = false)
        OR (${t.consentHealthDataAt} IS NOT NULL AND ${t.consentVersion} IS NOT NULL)`,
  ),
}));

// ─── Onboarding draft ─────────────────────────────────────────────────
export const onboardingDrafts = pgTable('onboarding_drafts', {
  id: uuid('id').primaryKey(), // = auth.users.id — one draft per user
  step: integer('step').notNull(),
  payload: jsonb('payload').$type<OnboardingDraftPayload>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
}, (t) => ({
  stepRange: check('step_range', sql`${t.step} BETWEEN 1 AND 7`),
}));

// ─── Assessment ──────────────────────────────────────────────────────
export const clientAssessments = pgTable('client_assessments', {
  clientId: uuid('client_id').primaryKey().references(() => clients.id, { onDelete: 'cascade' }),
  experience: experienceEnum('experience'),
  goal: goalEnum('goal'),
  daysPerWeek: integer('days_per_week'),
  notes: text('notes'),
  injuries: injuryEnum('injuries').array().notNull().default(sql`'{}'::injury[]`),
  injuryNotes: text('injury_notes'),
  preferredSlots: text('preferred_slots').array().notNull().default(sql`'{}'::text[]`),
  customSlots: text('custom_slots').array().notNull().default(sql`'{}'::text[]`),
  running5k: text('running_5k'),
  running2k: text('running_2k'),
  runRating: integer('run_rating'),
  runFrequency: runFrequencyEnum('run_frequency'),
  runInjuryFlag: boolean('run_injury_flag').notNull().default(false),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Health data (every row carries consent_version for DPDP audit) ──
export const bodyCompEntries = pgTable('body_comp_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  date: date('date').notNull(),
  weight: numeric('weight', { precision: 5, scale: 2 }).notNull(),
  bodyFatPct: numeric('body_fat_pct', { precision: 4, scale: 1 }).notNull(),
  muscleKg: numeric('muscle_kg', { precision: 5, scale: 2 }).notNull(),
  visceralFat: integer('visceral_fat').notNull(),
  bmi: numeric('bmi', { precision: 4, scale: 1 }),
  metabolicAge: integer('metabolic_age'),
  fileUrl: text('file_url'),
  uploadedBy: uploadedByEnum('uploaded_by').notNull(),
  consentVersion: text('consent_version').notNull()
    .references(() => privacyPolicyVersions.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const bloodPanels = pgTable('blood_panels', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  panelDate: date('panel_date').notNull(),
  fileUrl: text('file_url'),
  results: jsonb('results').$type<BloodMarker[]>().notNull(),
  consentVersion: text('consent_version').notNull()
    .references(() => privacyPolicyVersions.id, { onDelete: 'restrict' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const mskAssessments = pgTable('msk_assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  area: mskAreaEnum('area').notNull(),
  status: mskStatusEnum('status').notNull(),
  notes: text('notes'),
  consentVersion: text('consent_version').notNull()
    .references(() => privacyPolicyVersions.id, { onDelete: 'restrict' }),
  assessedAt: timestamp('assessed_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Scheduling (canonical UTC; render IST via formatDateIST) ────────
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  type: sessionTypeEnum('type').notNull(),
  scheduledAt: timestamp('scheduled_at', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull(),
  status: sessionStatusEnum('status').notNull().default('scheduled'),
  title: text('title'),
  notes: text('notes'),
  programmeId: uuid('programme_id')
    .references((): AnyPgColumn => programmes.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  // DB-level guard against double-booking the same coach in the same slot.
  coachSlotUnique: unique('coach_slot_unique').on(t.coachId, t.scheduledAt),
}));

export const invites = pgTable('invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  requestedSlot: timestamp('requested_slot', { withTimezone: true }).notNull(),
  durationMinutes: integer('duration_minutes').notNull().default(60),
  note: text('note'),
  status: inviteStatusEnum('status').notNull().default('pending'),
  reason: text('reason'),
  reassignedToCoachId: text('reassigned_to_coach_id')
    .references(() => coaches.id, { onDelete: 'set null' }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
});

// ─── Coach writes ─────────────────────────────────────────────────────
export const sessionNotes = pgTable('session_notes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  date: date('date').notNull(),
  sessionType: text('session_type').notNull(),
  text: text('text').notNull(),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  mediaUrls: text('media_urls').array().notNull().default(sql`'{}'::text[]`),
  visibleToClient: boolean('visible_to_client').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const nutritionPlans = pgTable('nutrition_plans', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  period: text('period').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  calories: integer('calories').notNull(),
  proteinG: integer('protein_g').notNull(),
  carbsG: integer('carbs_g').notNull(),
  fatG: integer('fat_g').notNull(),
  notes: text('notes'),
  tags: text('tags').array().notNull().default(sql`'{}'::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const coachOverrides = pgTable('coach_overrides', {
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  dimension: scoreDimensionEnum('dimension').notNull(),
  // Numeric, not double — 0 ≠ unset; check `value !== undefined` in app code.
  // Drizzle returns numeric columns as strings — parseFloat at the boundary.
  value: numeric('value', { precision: 3, scale: 1 }).notNull(),
  comment: text('comment'),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  setAt: timestamp('set_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.clientId, t.dimension] }),
  valueRange: check('value_range', sql`${t.value} BETWEEN 0 AND 10`),
}));

// ─── Ratings (sessionId is the upsert key) ───────────────────────────
export const ratings = pgTable('ratings', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().unique()
    .references(() => sessions.id, { onDelete: 'cascade' }),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  sessionDate: date('session_date').notNull(),
  sessionType: text('session_type').notNull(),
  scores: jsonb('scores').$type<RatingScores>().notNull(),
  overall: numeric('overall', { precision: 2, scale: 1 }).notNull(),
  comment: text('comment'),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Packages (billing — owns total_sessions; payments reference it) ──
export const packages = pgTable('packages', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  // Canonical "package size purchased". `done` derived via:
  //   SELECT COUNT(*) FROM sessions WHERE programme_id = X AND status = 'completed'
  totalSessions: integer('total_sessions').notNull(),
  amount: integer('amount').notNull(), // INR paise
  purchasedAt: timestamp('purchased_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  totalSessionsPositive: check('total_sessions_positive', sql`${t.totalSessions} > 0`),
  amountPositivePackages: check('amount_positive_packages', sql`${t.amount} > 0`),
}));

// ─── Programmes (training-plan structure; session counts derived) ────
export const programmes = pgTable('programmes', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'cascade' }),
  coachId: text('coach_id').notNull().references(() => coaches.id, { onDelete: 'restrict' }),
  type: text('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'set null' }),
});

export const milestones = pgTable('milestones', {
  id: uuid('id').primaryKey().defaultRandom(),
  programmeId: uuid('programme_id').notNull().references(() => programmes.id, { onDelete: 'cascade' }),
  week: integer('week').notNull(),
  title: text('title').notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

// ─── Payments (typed by paymentType; positive amounts only) ──────────
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  clientId: uuid('client_id').notNull().references(() => clients.id, { onDelete: 'restrict' }),
  paymentType: paymentTypeEnum('payment_type').notNull(),
  sessionId: uuid('session_id').references(() => sessions.id, { onDelete: 'set null' }),
  packageId: uuid('package_id').references(() => packages.id, { onDelete: 'set null' }),
  refundOfPaymentId: uuid('refund_of_payment_id')
    .references((): AnyPgColumn => payments.id, { onDelete: 'set null' }),
  amount: integer('amount').notNull(), // INR paise — always positive
  currency: text('currency').notNull().default('INR'),
  status: paymentStatusEnum('status').notNull().default('pending'),
  razorpayPaymentId: text('razorpay_payment_id'),
  razorpayOrderId: text('razorpay_order_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  fkMatchesType: check('payment_fk_matches_type', sql`
    (${t.paymentType} = 'session'
       AND ${t.sessionId} IS NOT NULL
       AND ${t.packageId} IS NULL
       AND ${t.refundOfPaymentId} IS NULL)
    OR
    (${t.paymentType} = 'package'
       AND ${t.packageId} IS NOT NULL
       AND ${t.sessionId} IS NULL
       AND ${t.refundOfPaymentId} IS NULL)
    OR
    (${t.paymentType} = 'refund'
       AND ${t.refundOfPaymentId} IS NOT NULL)
  `),
  amountPositive: check('amount_positive', sql`${t.amount} > 0`),
}));

// ─── Café (pickup_time canonical UTC) ────────────────────────────────
export const cafeOrders = pgTable('cafe_orders', {
  id: uuid('id').primaryKey().defaultRandom(),
  customerPhone: text('customer_phone').notNull(), // E.164
  customerName: text('customer_name'),
  clientId: uuid('client_id').references(() => clients.id, { onDelete: 'set null' }),
  items: jsonb('items').$type<CafeOrderItem[]>().notNull(),
  total: integer('total').notNull(), // INR paise
  pickupTime: timestamp('pickup_time', { withTimezone: true }).notNull(), // UTC, render IST
  whatsappSent: boolean('whatsapp_sent').notNull().default(false),
  petpoojaWebhookSent: boolean('petpooja_webhook_sent').notNull().default(false),
  status: cafeOrderStatusEnum('status').notNull().default('placed'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ─── Type exports for app code ───────────────────────────────────────
export type CoachRow = typeof coaches.$inferSelect;
export type ClientRow = typeof clients.$inferSelect;
export type SessionRow = typeof sessions.$inferSelect;
export type RatingRow = typeof ratings.$inferSelect;
export type PaymentRow = typeof payments.$inferSelect;
export type PackageRow = typeof packages.$inferSelect;
export type ProgrammeRow = typeof programmes.$inferSelect;
