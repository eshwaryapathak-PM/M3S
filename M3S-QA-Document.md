# M3S — Tests & Data Layer Document

> Two questions answered in one document: **what should happen on each screen**, and **where each piece of data lives**. Sections 3–12 cover test flows. Sections 13–16 cover what's static vs. database. Sections 17–19 cover edge cases.

**Version 1 · May 2026 · My Third Space · Indiranagar**

---

## Contents

**Start here**
- [1. How to use this document](#1-how-to-use-this-document)
- [2. Data strategy overview](#2-data-strategy-overview)

**QA — Client flows**
- [3. Onboarding (7 steps)](#3-onboarding-7-steps)
- [4. Booking + payment](#4-booking--payment)
- [5. Client profile + fitness score](#5-client-profile--fitness-score)
- [6. Coach rating flow](#6-coach-rating-flow)
- [7. Kenko café ordering](#7-kenko-café-ordering)

**QA — Coach flows**
- [8. Coach login + calendar](#8-coach-login--calendar)
- [9. PT invites](#9-pt-invites)
- [10. My Clients + drawer](#10-my-clients--drawer)
- [11. Coach writes (notes / nutrition / override)](#11-coach-writes)

**QA — Admin flows**
- [12. Admin panel + RLS tests](#12-admin-panel--rls-tests)

**Data layer mapping**
- [13. index.html (marketing)](#13-marketing-site-data)
- [14. profile.jsx (client)](#14-client-app-data)
- [15. coach-universe.jsx](#15-coach-app-data)
- [16. Supabase schema reference](#16-supabase-schema)

**Cross-cutting**
- [17. Edge cases & failure modes](#17-edge-cases--failure-modes)
- [18. Responsive + cross-device](#18-responsive--cross-device)
- [19. Pre-launch checklist](#19-pre-launch-checklist)

---

## 1. How to use this document

Each test follows the same structure: **setup** (what state you need), **steps** (numbered things to do), **expected result**, and where useful, **edge cases** and **verification**. Run them in the prototype with localStorage as the data layer. When you migrate to Supabase, re-run the same tests with real data — the expected outcomes don't change.

### Legend

| Chip | Meaning |
|---|---|
| `PASS` | Working correctly |
| `PARTIAL` | Works with caveats |
| `FAIL` | Not yet built or broken |
| `STATIC` | Hardcoded in JSX |
| `LOCAL` | Prototype data layer (localStorage) |
| `DB` | Supabase table required |
| `AUTH` | Needs login + role |
| `API` | External service call |

### The 3 roles being tested

| Role | Identity | Can write | Can read |
|---|---|---|---|
| Client | Riya Sharma (demo) | Own profile, slots, ratings, café orders | Own data + assigned coach info |
| Coach | Lee, Rahul + 9 others | Notes, nutrition, score overrides — assigned clients only | Own calendar + assigned clients + own ratings |
| Admin | Shwetambari (owner), Harshita (manager) | All coach/client data; admin roles owner-only | Everything |

---

## 2. Data strategy overview

Every screen has three potential data sources. Choose deliberately — wrong choice means rebuilds later.

### The 4 categories

| Type | Examples | Prototype | Production |
|---|---|---|---|
| **STATIC** | Hero copy, About text, Pillar cards, Footer | Hardcoded JSX | Hardcoded JSX |
| **SEMI-STATIC** | Kenko menu, Trainer bios, Service descriptions | JS constant object | JSON file or `config` table |
| **DYNAMIC** | Client profile, Sessions, Ratings, Notes, Orders | localStorage | Supabase table with RLS |
| **EXTERNAL** | Razorpay, Petpooja, Claude API, WhatsApp | Stubbed | Edge Function → external API |

### Decision rule

> Default to STATIC. Only escalate to SEMI-STATIC if content changes monthly or quarterly. Only escalate to DYNAMIC if a user can change it. Only use EXTERNAL when a third-party owns the source of truth.

### Why this matters

Your Kenko menu was designed as DYNAMIC initially — wrong call. It changes monthly when seasons shift. SEMI-STATIC (JS constant + future JSON file) is correct because it saves a DB call on every page load and keeps menu updates as a simple file edit, not a CMS workflow.

Conversely, coach calendar slots were originally a hardcoded array — also wrong. Slots change every day. DYNAMIC with a sessions table is correct.

---

## 3. Onboarding (7 steps)

Tests for the full onboarding journey from signup to fitness score. Run with a fresh browser profile or after clearing localStorage.

### TEST OB-01 — Happy path: complete all 7 steps

**Setup:** Clear localStorage. Open profile.jsx in fresh tab. Auth as new user via OTP modal.

**Steps:**
```
1. Enter name, age, gender, phone → Continue
2. Select experience, primary goal, days/week → Continue
3. Tag injuries (multi-select), add injury notes → Continue
4. Upload BCA scan (or skip) → Continue
5. Upload blood report (or skip) → Continue
6. Complete MSK assessment (5 areas) → Continue
7. Enter 5K, 2K, self-rating, frequency → Continue
8. Review Step 7 summary → Submit
```

**Expect:** Step 7 shows AI-computed fitness score. Submit redirects to profile dashboard. localStorage `m3s.journey` populated with all fields.

**Verify:** DevTools → Application → localStorage → `m3s.journey` contains all entered fields.

---

### TEST OB-02 — Skip optional steps (BCA + blood)

**Setup:** Fresh localStorage. Start onboarding.

**Steps:**
```
1. Complete Steps 1–3 normally
2. Step 4 (BCA): tap Skip without upload
3. Step 5 (Blood): tap Skip without upload
4. Complete Steps 6–7 normally
5. Submit
```

**Expect:** Fitness score still computes. Metabolic dimension shows lower score (penalty for missing data). Drill-down shows "BCA: not provided" instead of values.

**Edge:** Can user re-add later? `PARTIAL` — design supports it via "Re-upload" button on body comp section.

---

### TEST OB-03 — Form validation: required fields

**Steps:**
```
1. Step 1: leave name empty → Continue
2. Try invalid age ("abc" or 5)
3. Try phone with < 10 digits
```

**Expect:** Continue button disabled until valid. Inline error in terracotta under each invalid field. No localStorage write until success.

---

### TEST OB-04 — Back navigation preserves state

**Steps:**
```
1. Fill Step 1 → Continue
2. Fill Step 2 → Continue
3. Tap Back → back at Step 1
```

**Expect:** Step 1 values still populated. State persists via React useState across navigation.

---

### TEST OB-05 — Browser refresh mid-onboarding

**Steps:**
```
1. Fill Steps 1–3 → arrive at Step 4
2. Hit Cmd+R refresh
```

**Expect:** `PARTIAL` — state lost in prototype because useState resets. Fix: save to localStorage after each step's Continue.

**Production:** Save to Supabase `onboarding_drafts` table after each step. Resume on next login.

---

### TEST OB-06 — Score calculation correctness

**Steps:**
```
Profile A: 5+ years, 5 days/week, no injuries
           5K=22:00, freq=4x, BCA "ok", blood "Optimal"

Profile B: <6 months, 2 days/week, 3 injuries
           5K=38:00, freq=Never, mixed warn/bad markers
```

**Expect:** Profile A: Overall ≥ 8.0 (Advanced/Elite). Profile B: Overall ≤ 4.0 (Foundation/Developing).

**Verify:** Browser console: `computeM3SScores(profile, bcaData, bloodData, mskData)` returns expected ranges.

### Edge cases worth testing

- User closes tab on Step 5, returns later — start over? Resume? *Define expected behaviour first.*
- User onboards on phone, opens on laptop — localStorage doesn't transfer. This is why production needs Supabase.
- User completes onboarding twice (browser back + re-submit) — last-write-wins is fine in prototype.
- Coach selection: all 8 PT coaches full — `PARTIAL` not yet handled.

---

## 4. Booking + payment

Tests for the 4-step booking flow: Choose → Confirm → Pay → Done. Covers 8PM cut-off, no Sunday PT, cancellation tiers, masking.

### TEST BK-01 — Book a slot more than 24 hours away

**Setup:** Auth as Riya. Open booking section.

**Steps:**
```
1. Pick a coach
2. Select slot 2+ days away, not Sunday
3. Confirm → arrive at payment screen
4. Select UPI → enter UPI ID → Pay
5. See success screen
```

**Expect:** Auto-confirm banner: "Booking confirmed — details sent to eXXXXX@gXXXl.com". Step indicator 4/4 complete.

---

### TEST BK-02 — 8PM cut-off enforcement

**Setup:** Override system time to 20:30 (DevTools sensors or temporary code edit).

**Steps:**
```
1. Open booking → look at tomorrow's column
2. Attempt to tap any slot for tomorrow
```

**Expect:** All tomorrow slots greyed out (sand-200 bg, clay-600 40% opacity, cursor not-allowed). Below tomorrow's day header: "BOOKING CLOSED · OPENS 8PM TONIGHT".

**Edge:** At exactly 20:00:00, slots for tomorrow lock. Test 19:59 (bookable) and 20:01 (locked).

---

### TEST BK-03 — No PT on Sunday

**Steps:**
```
1. Navigate to upcoming Sunday in booking
2. Look at Sunday column
```

**Expect:** No PT slots. Centred "NO PT SUNDAYS" block with italic sub "Group classes only". Group slots (if any) remain bookable.

---

### TEST BK-04 — Cancellation policy display

**Steps:**
```
1. Complete Step 1 (slot selection)
2. Arrive at Step 2 (Confirm)
```

**Expect:** Policy block visible above Confirm button:
- ✓ 8+ hours before · Full refund (sage)
- ◑ 4–8 hours before · 50% refund (ochre)
- ✕ Under 4 hours · No refund (terra)

---

### TEST BK-05 — Payment screen flow

**Steps:**
```
1. Reach payment step
2. Verify UPI default selected
3. Switch to Card → fields expand
4. Switch to Net Banking
5. Switch to EMI → see "available above ₹3,000"
```

**Expect:** Each option expands inline. Order summary always visible. Pay button shows total. Mono note: "256-BIT ENCRYPTED · SECURED BY RAZORPAY".

**Production:** Pay button triggers Razorpay SDK in real build, not just state change. Currently stubbed.

---

### TEST BK-06 — Masked contact correctness

**Steps:**
```
Test inputs:
- "eshwarya@gmail.com" → expect "eXXXXXXa@gXXXl.com"
- "9876543210" → expect "9XXXXX43210"
- "a@b.com" (too short) → graceful handling
```

**Expect:** Mask preserves first + last char + TLD for email; first digit + last 2 for phone. Never full contact.

**Edge:** Very short inputs must not crash. Add length-guard before masking.

### Edge cases

- User picks slot, leaves payment open 10+ min — does slot hold or release? **No hold logic yet.** Two users could double-book. Production needs 5-min hold on click.
- Coach goes offline mid-booking — does slot still confirm? Yes in prototype. Production: re-check coach availability on submit.
- Razorpay fails — no fallback flow yet. Production needs payment-failure handling.

---

## 5. Client profile + fitness score

### TEST CP-01 — Profile tabs switch correctly

**Steps:**
```
1. Open profile.jsx
2. Verify HOME tab active by default
3. Tap MY PROFILE tab
```

**Expect:** HOME shows ClientDashboard (greeting, next session, progress, coach note, quick actions). MY PROFILE shows all data sections.

---

### TEST CP-02 — Fitness score drill-down

**Steps:**
```
1. Open MY PROFILE
2. Scroll to Fitness Score (top)
3. Tap "Strength" tile
```

**Expect:** Drill-down expands with 5 reasons. Tile border turns walnut. Mono label changes "TAP TO SEE WHY ↓" → "HIDE REASONS ↑". Overall tile is NOT tappable.

---

### TEST CP-03 — Coach override appears in client view

**Setup:** In separate tab, coach-universe.jsx as Lee. Open Meera's drawer. Assessment → Training Background → set strength override to 8.5. Save.

**Steps:**
```
1. Switch back to profile.jsx tab
2. Refresh (localStorage re-reads)
3. Tap Strength tile in fitness score
```

**Expect:** Strength reads 8.5/10 (overrides AI). Drill-down shows sage-200 "COACH OVERRIDE · date · Set by Lee · 8.5/10" banner at top.

---

### TEST CP-04 — Coach session notes visible to client

**Setup:** Coach posts a note in coach-universe.jsx → drawer → Coach Notes tab.

**Steps:**
```
1. Switch to profile.jsx, refresh
2. Scroll to "From your coach · Session notes."
```

**Expect:** Most recent 5 notes displayed. Each shows date, type, italic text, tag chips, coach name. READ-ONLY for client.

---

### TEST CP-05 — Nutrition plan is read-only for client

**Steps:**
```
1. MY PROFILE → Nutrition plan
2. Verify "Coach edits only" chip in header
3. Try to interact with macro values
```

**Expect:** Macros displayed, not editable. No input fields, no edit buttons. Footer: "Speak to Lee to adjust targets."

### Edge cases

- No coach assigned yet — fitness score falls back to AI only. Coach name shows "Not assigned".
- Coach override = 0 — does it override (showing 0) or get treated as "not set"? **Test specifically.** Bug risk: `if (overrides.strength)` treats 0 as falsy.
- Override saved but coach no longer assigned — currently persists, could mislead. Production may invalidate.

---

## 6. Coach rating flow

### TEST RT-01 — Submit a complete rating

**Steps:**
```
1. MY PROFILE → "Rate your coach" at bottom
2. Tap stars for all 5 criteria
3. Optionally add comment
4. Tap "Submit rating →"
```

**Expect:** Submit enabled only when all 5 scored. On submit: form replaced with confirmation ("✓ Rating submitted for today's session with Lee. Overall: 4.6/5"). New entry in past ratings.

**Verify:** localStorage `m3s.ratings` has new entry. `overall` = average of 5 scores.

---

### TEST RT-02 — Partial rating cannot submit

**Steps:**
```
1. Rate only 3 of 5 criteria
2. Try Submit
```

**Expect:** Submit disabled. Helper text: "Rate all 5 criteria to submit."

---

### TEST RT-03 — Double-submit prevention

**Steps:**
```
1. Submit a rating successfully
2. Reload page
3. Scroll to rating section
```

**Expect:** Form hidden. Confirmation shows for today's session. ID = `{clientId}_{today's date}` — same date = same ID = upsert.

**Edge:** Two sessions in one day with same coach? Currently conflated. Production needs session_id, not date, as key.

---

### TEST RT-04 — Rating visible on coach side

**Setup:** Client submits. Switch to coach-universe.jsx as Lee.

**Steps:**
```
1. Refresh
2. My Profile → "Your ratings"
```

**Expect:** New rating in "RECENT FEEDBACK" feed. Averages updated. Footer: "Visible only to you and admin."

---

### TEST RT-05 — Admin sees all ratings

**Steps:**
```
1. Log in as Shwetambari
2. Admin Panel → Coaches tab
3. See rating chips on each card
4. Scroll to AdminRatingsPanel below
```

**Expect:** Each coach shows "MEMBER RATING · {avg}/5 · {N} sessions". Below grid: filterable table with all averages + per-criterion breakdown + individual feed with comments.

---

## 7. Kenko café ordering

### TEST KN-01 — Add multiple items to cart

**Steps:**
```
1. Scroll to Kenko section
2. Tap "+ Add" on Peanut Monk → quantity = 1
3. Tap "+" → quantity = 2
4. Add Chickpea Brownie (qty 1)
5. Add Espresso (qty 1)
```

**Expect:** Sticky cart bar: "🛒 4 items · ₹1,025 — View order →". Math: (2 × 350) + 200 + 125 = 1,025 ✓

---

### TEST KN-02 — Cart total flatMaps across categories

**Steps:**
```
Add 1 item from each of 6 categories:
Smoothie 350 + Bowl 330 + Dessert 80 + 
Juice 220 + Coffee 125 + Add-on 40 = ₹1,145
```

**Expect:** Sticky bar: ₹1,145. Cart review: all 6 line items.

**Fail case:** If total wrong (only sums one category), `cartTotal()` is missing `flatMap`.

---

### TEST KN-03 — Time picker generates valid slots

**Setup:** Note current time. Add at least one item.

**Steps:**
```
1. Open cart → CHOOSE PICKUP TIME
2. First slot should be ≥ 15 min from now
3. Slots every 15 min until 21:00
```

**Expect:** At 08:21, first slot is 08:45 (not 08:36). Last slot 21:00. Sub text: "Next available slot: 08:45".

**Edge:** After 20:45, only 21:00 left. After 21:00: empty list — should show "Closed for the day."

---

### TEST KN-04 — WhatsApp capture for non-logged-in users

**Steps:**
```
1. Browse Kenko in fresh session (not signed in)
2. Add items, go to cart
3. Look for WhatsApp input
```

**Expect:** Field labelled "YOUR WHATSAPP NUMBER" with sub "Order confirmation and receipt sent here". Place button disabled until 10+ digits.

---

### TEST KN-05 — Order submission opens WhatsApp + webhook

**Steps:**
```
1. Complete cart with valid time + number
2. Tap "Place order →"
```

**Expect:** New tab opens WhatsApp URL with order text. If webhook set: POST fires (Network tab). Confirmation: ✓ check, summary, collection card "Please collect your order and pay at Kenko Café, 1st floor..."

---

## 8. Coach login + calendar

### TEST CL-01 — Demo coach picker shows all 11 + 2 admins

**Steps:**
```
1. coach-universe.jsx → Login
2. Open demo picker
```

**Expect:** Order: "── ADMIN ──" separator, Shwetambari, Harshita, "── COACHES ──", then 11 coaches.

---

### TEST CL-02 — Calendar shows logged-in coach's events only

**Steps:**
```
1. Log in as Lee → verify Lee's schedule
2. Log out, log in as Rahul → different schedule
```

**Expect:** Calendar resets between logins. No cross-contamination. Data from `buildEventsForCoach(coach.id)`.

---

### TEST CL-03 — Block time creates an event

**Steps:**
```
1. Open calendar
2. Tap "Block time"
3. Select date + start/end + reason
4. Save
```

**Expect:** Blocked time as terracotta block. No PT slot can be booked over it.

---

### TEST CL-04 — Mobile: Outlook-style view switcher

**Steps:**
```
1. Open coach-universe on mobile (375px)
2. Tap CALENDAR bottom nav
3. Switch AGENDA / 3 DAY / MONTH
```

**Expect:** Agenda default. No horizontal scroll at 375px. Today indicator visible. Swipe advances date.

---

## 9. PT invites

### TEST IN-01 — Accept an invite

**Steps:**
```
1. Open PT Invites tab
2. Tap "✓ Accept" on an invite
```

**Expect:** Invite removed from pending. Event appears in calendar at requested slot. Status becomes ACCEPTED (sage).

---

### TEST IN-02 — Reject with reason

**Steps:**
```
1. Tap "✗ Reject"
2. Select reason or type free text
3. Confirm
```

**Expect:** Invite removed. Reason stored (currently console.log only). Production needs to write to invites table + notify client.

---

### TEST IN-03 — Reassign to another coach

**Steps:**
```
1. Tap "→ Reassign"
2. Coach grid modal opens
3. Pick another coach + add note
```

**Expect:** Invite removed from original coach's list. Production: appears in new coach's invite list — currently not wired since invites are coach-scoped via SEED_INVITES.

---

## 10. My Clients + drawer

### TEST MC-01 — Client list filters

**Steps:**
```
1. Open My Clients
2. Try filter chips: All / Active / On hold / Ending soon
```

**Expect:** Active = 3 (Meera, Karan, Vikram). Ending soon = 2 (Anita, Shreya). On hold = 1 (Rohan). All = 6.

---

### TEST MC-02 — Open Meera's profile drawer

**Steps:**
```
1. Tap "View Profile" on Meera's card
```

**Expect:** Full-screen overlay. Back arrow "← My Clients" top-left. Header: avatar, italic name, mono sub, source badge ("LIVE DATA" sage if in `m3s.journey`, else "DEMO DATA" sand).

---

### TEST MC-03 — Live data sync: onboard as Meera, view as Lee

**Steps:**
```
1. profile.jsx tab 1 → clear localStorage
2. Onboard as new client named "Meera P."
3. Submit Step 7
4. coach-universe.jsx tab 2 → log in as Lee
5. My Clients → Meera → View Profile
```

**Expect:** Badge reads "● LIVE DATA". Assessment shows just-entered data, not seed defaults. **This proves the localStorage bridge works.**

---

### TEST MC-04 — Assessment accordions open/close

**Steps:**
```
1. Drawer → Assessment tab
2. Click each of 6 accordion headers
```

**Expect:** Sections: Basics, Training, Injuries, Body Comp, Lifestyle, Coach Selection. Each shows read-only rows + override button.

---

## 11. Coach writes

The 3 sync prompts close these write paths. Test each end-to-end.

### TEST CW-01 — Post a session note → client sees it

**Steps:**
```
1. Drawer → Meera → Coach Notes tab
2. Tap "+ ADD SESSION NOTE"
3. Write text, select tags, session type
4. Tap "Post note"
5. profile.jsx as Riya → refresh
6. Scroll to "From your coach"
```

**Expect:** Coach: note in feed top. `m3s.sessionNotes` has entry. Toast "saved — visible to client". Client: note appears (only Riya's notes show — clientId match).

---

### TEST CW-02 — Set nutrition plan → client reads it

**Steps:**
```
1. Drawer → Nutrition tab
2. Tap "+ Set new nutrition plan"
3. Fill period, macros, note, tags
4. Save
5. Client profile → refresh → Nutrition
```

**Expect:** Coach: form clears, current plan shows new values. `m3s.nutrition` has entry. Client: macro grid shows values. Read-only chip visible.

---

### TEST CW-03 — Set score override → client score updates

**Steps:**
```
1. Drawer → Assessment → Training Background
2. Enter 9.0 in STRENGTH OVERRIDE → Save
3. Client profile → refresh
4. Look at Fitness Score top
```

**Expect:** Strength = 9.0/10. Overall recalculated. Drill-down for Strength: sage-200 "COACH OVERRIDE" banner at top.

**Edge:** Override = 0 → check value 0 respected or falsy-coerced. Common bug.

---

## 12. Admin panel + RLS tests

> **The most important tests in the whole document.** Failure here means a coach can see another coach's clients, or a client can see another client's data. Showstoppers.

### TEST AD-01 — Admin sidebar item only shows for admins

**Steps:**
```
1. Log in as Lee (regular coach) — no Admin Panel item
2. Log out, log in as Shwetambari — sidebar shows
   "Admin Panel" under "— ADMIN ACCESS" with terracotta active state
```

**Expect:** Conditional render via `isAdminUser(coach)`. Regular coaches see no admin entry.

---

### TEST AD-02 — Users tab is owner-only

**Steps:**
```
1. Log in as Harshita (manager, canManageAdmins=false)
2. Admin Panel → Users tab
```

**Expect:** Lock screen: "Owner access only." headline + "Contact Shwetambari to update permissions." sub. No admin table. Compare with Shwetambari (sees full table).

---

### TEST AD-03 — RLS dry-run: coach cannot see another coach's client

**Steps:**
```
In prototype: UI-enforced only.

PRODUCTION SQL TEST:
1. Create users: client_a (assigned coach_x), coach_x, coach_y
2. From coach_y's session, run:
   SELECT * FROM clients WHERE id = client_a.id
3. Should return 0 rows (RLS blocks)
```

**Expect:** RLS policy: `FOR SELECT USING (assigned_coach_id = auth.uid())`. Coach_y gets nothing. **This is the single most important test in your build.**

---

### TEST AD-04 — Admin sees all coaches' ratings

**Steps:**
```
1. As admin → Coaches → AdminRatingsPanel
2. All 11 coaches' averages visible
3. Filter by "Lee" → only Lee's ratings
4. Filter "This week" → last 7 days only
```

**Expect:** Filters combine (coach AND period). Empty state if filter returns nothing.

---

### TEST AD-05 — Bulk invite actions

**Steps:**
```
1. Admin → Invites
2. Select 3 invites via checkboxes
3. Tap "Approve selected"
```

**Expect:** All 3 approved in one action. Each coach's calendar updated. Selection clears.

### Critical RLS policies to test in production

| Resource | Policy | Test |
|---|---|---|
| `clients` | Self read, assigned coach, admin all | Coach_x can't SELECT coach_y's client |
| `ratings` | Client writes own, coach reads own, admin all | Client can't rate other coaches; coach can't edit ratings |
| `session_notes` | Coach writes assigned, client reads own | Coach_y can't write for coach_x's client |
| `nutrition_plans` | Same as session_notes | Same as above |
| `coach_overrides` | Same as session_notes | Same as above |
| `admin_users` | Owner writes, manager reads, coach no access | Manager can't add admin; coach can't SELECT admin_users at all |

---

## 13. Marketing site data

Mostly static. Booking + Kenko are the dynamic exceptions.

| Section | Source | Why |
|---|---|---|
| Nav | `STATIC` | Same for everyone, never changes via UI |
| Hero copy | `STATIC` | Marketing copy. Edit in code. |
| About / Founder | `STATIC` | Stable content |
| Services | `STATIC` | 5 services. Table only if A/B testing. |
| Trainers grid | `DB` | Photos, bios change. `coaches` table. Photos to Storage. |
| Booking calendar | `DB` | Slots dynamic. `sessions` table + capacity check. |
| Payment | `API` | Razorpay SDK + webhook into `payments` table |
| Kenko menu | `SEMI` | JS constant now, JSON when admin edits via UI |
| Kenko orders | `API` | WhatsApp + Petpooja webhook. Log to `cafe_orders`. |
| Social feed | `STATIC` | 9 hardcoded posts. Future: Instagram Graph API. |
| Testimonials | `STATIC` | 3 hardcoded. Move to table at 10+. |
| Footer | `STATIC` | Links + copyright |
| Sign-in modal | `AUTH` | Supabase Auth (email OTP) |

---

## 14. Client app data

Almost entirely dynamic. The client app IS the user's data presented.

| Section | Source | Notes |
|---|---|---|
| Topbar | `AUTH` | From session, not separate query |
| Tab switcher | `STATE` | React useState only |
| Dashboard greeting | `STATIC` | Time-based logic, no data |
| Next session card | `DB` | `sessions` WHERE client_id = me AND time > now() LIMIT 1 |
| Progress mini-cards | `DB` | Aggregates: count, last weigh-in, streak |
| Coach note (dashboard) | `DB` | `session_notes` latest visible |
| Quick actions | `STATIC` | Navigation, no data |
| Fitness score | `DB` computed | `assessments` + `overrides` in Edge Function |
| About You | `DB` | `clients` table |
| Goals & history | `DB` | `clients` + `client_assessments` |
| Preferred times | `DB` | `client_preferences` |
| Body composition | `DB` | `body_comp_entries`. Files in Storage. |
| Blood report | `DB` | `blood_panels`. PDFs in Storage. |
| MSK assessment | `DB` | `msk_assessments` |
| Running | `DB` | `client_assessments` running fields |
| Nutrition | `DB` | `nutrition_plans` — coach writes, client reads (RLS) |
| From your coach | `DB` | `session_notes` WHERE client_id = me |
| 12-week milestones | `DB` | `programmes` + `milestones` |
| Monthly progress | `DB` | Aggregated from body_comp_entries |
| Coach rating | `DB` | `ratings` — client writes |

### localStorage key → Supabase table mapping

| Prototype key | Production table |
|---|---|
| `m3s.journey` | `clients` + `client_assessments` (split by domain) |
| `m3s.ratings` | `ratings` |
| `m3s.nutrition` | `nutrition_plans` |
| `m3s.coachOverrides` | `coach_overrides` |
| `m3s.sessionNotes` | `session_notes` |

---

## 15. Coach app data

Reads heavy. Writes on Notes / Nutrition / Override / Calendar block.

| Section | Source | Notes |
|---|---|---|
| Login + picker | `AUTH` | Supabase Auth + coach lookup |
| Sidebar nav | `STATIC` | Conditional admin item by role |
| Calendar grid | `DB` | `sessions` WHERE coach_id = me AND date in range |
| PT Invites | `DB` | `invites` WHERE coach_id = me AND status = pending |
| Peer Calendars | `DB` | `sessions` WHERE coach_id != me — RLS: availability only, not client details |
| My Profile | `DB` | `coaches` WHERE id = me |
| Rating summary | `DB` | Aggregated from `ratings` WHERE coach_id = me |
| AI recommendations | `API` | Claude API via Edge Function. Cache in `ai_insights`. |
| Google Calendar sync | `API` | Google Calendar API. Tokens in `integrations`. |
| My Clients list | `DB` | `clients` WHERE assigned_coach_id = me |
| Client drawer | `DB` | JOIN clients + assessments + ratings + notes (RLS-gated) |
| Assessment tab | `DB` | R/W `assessments` + `overrides` |
| Coach Notes tab | `DB` | Write to `session_notes` |
| Nutrition tab | `DB` | Write to `nutrition_plans` |
| Admin Overview | `DB` | Aggregations across all coaches/clients |
| Admin Calendar | `DB` | `sessions` JOIN coaches — all rows |
| Admin Invites | `DB` | `invites` all rows |
| Admin Coaches | `DB` | `coaches` + aggregated ratings/sessions |
| Admin Users | `DB` | `admin_users`. Owner-only write. |

---

## 16. Supabase schema

Recommended tables for production. Generate full DDL via Claude Code when ready.

| Table | Key columns | RLS |
|---|---|---|
| `clients` | id, name, age, gender, phone, email, assigned_coach_id, status | Self / coach / admin |
| `coaches` | id, name, role, tone, initials, bio, photo_url, is_pt_eligible | All read; self/admin write |
| `admin_users` | coach_id, admin_role, can_manage_admins, granted_by | Owner write; admin read |
| `sessions` | id, coach_id, client_id, type, scheduled_at, status | Coach own + clients; admin all |
| `invites` | id, client_id, coach_id, requested_slot, status, reason | Coach own; client own; admin all |
| `client_assessments` | client_id, experience, goal, days_per_week, injuries[], running_5k | Self / coach / admin |
| `body_comp_entries` | id, client_id, date, weight, body_fat_pct, muscle_kg, file_url | Self / coach / admin |
| `blood_panels` | id, client_id, panel_date, results_json, file_url | Self / coach / admin |
| `msk_assessments` | id, client_id, area, status, notes | Self / coach / admin |
| `nutrition_plans` | id, client_id, coach_id, period, calories, protein, carbs, fat | Self read; coach write |
| `session_notes` | id, client_id, coach_id, text, tags[], media_urls[], visible_to_client | Self read (if visible); coach RW |
| `coach_overrides` | client_id, dimension, value, coach_id, set_at | Self read; coach write |
| `ratings` | id, client_id, coach_id, session_date, scores_json, overall, comment | Self writes own; coach reads own |
| `programmes` | id, client_id, coach_id, type, start_date, end_date | Self / coach / admin |
| `milestones` | id, programme_id, week, title, completed_at | Same as programmes |
| `payments` | id, client_id, session_id, amount, status, razorpay_payment_id | Self read; admin all |
| `cafe_orders` | id, customer_phone, items_json, total, pickup_time, status | Self phone match; admin all |

> **RLS shorthand:** "Self" = `auth.uid() = client_id`. "Coach" = `auth.uid() IN (SELECT coach_id FROM clients WHERE id = client_id)`. "Admin" = `auth.uid() IN (SELECT coach_id FROM admin_users)`. Every table needs these policies separately for SELECT, INSERT, UPDATE, DELETE.

---

## 17. Edge cases & failure modes

The bugs that don't appear in happy-path testing.

### Empty / first-use states

- New coach with no clients yet — My Clients shows what? *Need empty state with "Onboard your first client →" CTA.*
- New client with no sessions — Next session card shows what? *Empty state: "Book your first session →"*
- First load with empty localStorage — all components must gracefully handle missing keys (try/catch around every JSON.parse).
- Coach has no ratings yet — "No ratings yet" message, not 0/5.

### Concurrency / race conditions

- Two clients booking same slot at same moment — only one wins. Production needs DB unique constraint on (coach_id, slot_datetime).
- Coach editing override while client is viewing score — client sees stale value until refresh. Acceptable for MVP; consider Supabase realtime later.
- User double-taps submit — second submit upserts on same ID. Disable button on click.

### Time / timezone

- All times currently assume IST. Production: store UTC, render in user's local. India is one TZ so mostly cosmetic — but a client travelling could see wrong slot timing.
- Kenko time picker uses `new Date()` — fine for IST. International users would see wrong slots.
- 8PM cut-off: server time or client time? Should be server time. Client could spoof clock.

### Data integrity

- Coach deleted with active sessions — orphaned sessions. Need ON DELETE: probably SET NULL on coach_id + admin reassignment flag.
- Client deletes account — hard or soft delete? GDPR/DPDP says hard unless legal retention. Implement `deleted_at` + 30-day grace before hard delete.
- Coach override = exactly 0.0 — falsy in JS. Use `!== undefined` not truthy check.

### Network failure

- WhatsApp open fails (popup blocked) — no recovery. Need fallback: copy order text to clipboard with "Send manually to Kenko" message.
- Razorpay timeout — no retry flow. Production needs payment status polling.
- Supabase outage during onboarding — drafts saved locally, sync on reconnect. localStorage as fallback layer.

### Mobile-specific

- Bottom nav covered by keyboard — use `env(safe-area-inset-bottom)` + viewport meta `viewport-fit=cover`.
- iOS Safari form auto-zoom on input — ensure all input font-sizes ≥ 16px.
- Android tap delay — use `touch-action: manipulation` on buttons.
- PWA standalone mode — handle external links (WhatsApp, calendar) opening properly.

---

## 18. Responsive + cross-device

Test on actual devices, not just DevTools emulation.

| Screen | Mobile 375 | Tablet 768 | Desktop 1024+ |
|---|---|---|---|
| Marketing site | Full | Full | Full |
| Onboarding | Full | Full | Full |
| Client dashboard | Full | Full | Full |
| Coach calendar agenda | Full | Full | Full |
| Coach calendar 3-day | `Tight` | Full | Full |
| Coach calendar month | Drill | Full | Full |
| Coach My Clients | Stack | 2-col | 2-col |
| Client profile drawer | `Read-only` | Full | Full |
| Admin multi-coach grid | `Soft gate` | H-scroll | Full |
| Admin other tabs | `Soft gate` | H-scroll | Full |

### Device matrix to test

- **iPhone 13/14 mini** — smallest modern iOS (375px) — most likely coach phone
- **iPhone 15 Pro** — 393px, latest iOS Safari quirks
- **Pixel 7** — 412px, Chrome Android
- **iPad mini** — 768px portrait, likely shared studio device
- **iPad Pro 11"** — 834px portrait, 1194 landscape
- **MacBook Air 13"** — 1366px, likely admin workstation

### Browser matrix

- Safari iOS — strict, breaks PWA first
- Chrome Android — most permissive
- Safari macOS — webkit quirks differ from iOS
- Chrome desktop — dev default + most common
- Firefox desktop — occasional grid/flexbox edge cases

---

## 19. Pre-launch checklist

Don't ship without these. Order matters.

### Data & security

- [ ] All RLS policies live and tested with 3 dummy users (one per role)
- [ ] No API keys in client-side bundles (search dist/ for "sk-", "rzp_live_", etc.)
- [ ] Supabase backups enabled (7-day PITR free tier)
- [ ] Privacy policy page live with explicit health-data consent at onboarding
- [ ] DPDP Act compliance reviewed (Indian users storing health data)

### Functionality

- [ ] Tests OB-01 through OB-06 pass for new client
- [ ] Tests BK-01 through BK-06 pass for booking
- [ ] Tests CW-01 through CW-03 pass for coach writes
- [ ] Tests AD-01 through AD-05 pass for admin
- [ ] Razorpay live key works on at least one ₹1 test transaction
- [ ] Kenko WhatsApp number set in `KENKO_CONFIG` — verified live
- [ ] Petpooja webhook URL set if integration is live

### Performance

- [ ] Lighthouse Performance score ≥ 90 on mobile
- [ ] Lighthouse Accessibility ≥ 90
- [ ] First Contentful Paint < 1.5s on 4G simulated
- [ ] All images optimised (WebP, lazy loaded)
- [ ] No console errors on any major flow

### Observability

- [ ] Sentry capturing errors in production
- [ ] Plausible or GA4 tracking page views
- [ ] Supabase dashboard alerts on DB usage
- [ ] Status page (Upptime) live with at least 1 monitored endpoint

### Pilot readiness

- [ ] Shwetambari has admin account, has logged in successfully
- [ ] At least 2 coaches have accounts, calendars populated
- [ ] 1–2 pilot clients onboarded manually
- [ ] Clear feedback channel set up (WhatsApp group? Email?)
- [ ] Plan for first 48 hours: who watches Sentry, who answers questions

> **The one test I'd never skip:** log in as Lee, navigate to another coach's client profile via URL manipulation. If you can read their data, RLS isn't working. This is the test that prevents the worst possible launch-day headline.

---

*M3S QA + Data Layer Document · Version 1 · May 2026*
