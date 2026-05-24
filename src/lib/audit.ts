// Audit logger stub. Every sensitive op (consent changes, soft-deletes, admin
// actions, RLS denials, score overrides) calls audit() so later phases inherit
// a consistent log shape. Phase 4 backs this with an audit_log Supabase table.

export type AuditCategory =
  | 'consent'
  | 'soft-delete'
  | 'admin'
  | 'rls-denial'
  | 'override';

export interface AuditEvent {
  category: AuditCategory;
  /** Verb describing what happened, e.g. 'granted', 'revoked', 'denied'. */
  action: string;
  /** auth.users.id of the actor (null for system events). */
  actorId: string | null;
  /** Primary entity affected — usually a client or coach id. */
  subjectId: string | null;
  metadata?: Record<string, unknown>;
}

export function audit(event: AuditEvent): void {
  // Phase 0: console only. Phase 4: insert into audit_log via Supabase.
  // Logged as a single JSON line so it's grep-friendly during dev.
  console.log(`[audit] ${event.category}:${event.action} ${JSON.stringify(event)}`);
}
