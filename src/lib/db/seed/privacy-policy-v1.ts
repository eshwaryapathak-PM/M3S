// Phase 0 seed for `privacy_policy_versions`. The consent flow on /onboarding
// Step 1 FKs into this row. Replace contentMd with the real policy text before
// launch — this seed exists so the FK is non-null from day one.

import type { PrivacyPolicyVersion } from '@/types/m3s';

export const PRIVACY_POLICY_V1: PrivacyPolicyVersion = {
  id: 'v1-2026-05-24',
  effectiveFrom: '2026-05-24',
  summary:
    'M3S stores your body composition, blood markers, MSK assessment, and injury notes to personalise your coaching. We never sell this data.',
  contentMd: `
# M3S Privacy Policy

**Effective:** 2026-05-24
**Version:** v1-2026-05-24

> **TODO (Eshwarya):** replace this body with the actual policy text before launch.
> This seed exists so the consent flow has a row to FK to from day one.

## What we collect
- (placeholder)

## How we use it
- (placeholder)

## How long we keep it
- (placeholder — referenced in soft-delete grace logic: 30 days post-deletion)

## Your rights under the DPDP Act
- (placeholder)

## Contact
- privacy@mythirdspace.fit
  `.trim(),
  createdAt: new Date('2026-05-24T00:00:00+05:30').toISOString(),
};
