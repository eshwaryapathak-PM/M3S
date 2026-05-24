# CLAUDE.md

Behavioral guidelines for Claude Code working on **M3S (My Third Space)** — a premium PT studio management system being built for the first time by a Senior PM (not a daily developer). These rules combine universal coding discipline with project-specific guardrails.

**Read this on every prompt. The user reviews every diff. When in doubt, ask.**

---

## Part 1 — Universal coding rules

*Adapted from Andrej Karpathy's CLAUDE.md. These reduce common LLM coding mistakes regardless of project.*

### 1.1 Think before coding

Don't assume. Don't hide confusion. Surface tradeoffs.

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

### 1.2 Simplicity first

Minimum code that solves the problem. Nothing speculative.

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: *"Would a senior engineer say this is overcomplicated?"* If yes, simplify.

### 1.3 Surgical changes

Touch only what you must. Clean up only your own mess.

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

**The test:** every changed line should trace directly to my request.

### 1.4 Goal-driven execution

Define success criteria. Loop until verified.

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan first:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require my constant clarification.

---

## Part 2 — About me (the user)

I am a Senior Product Manager in tech. I am deeply technical but not a daily-driver developer. This is the **first software product I have ever shipped.** Treat this context as load-bearing for how you respond.

What this means:
- **I will read every diff before committing.** Make diffs scannable. Group related changes. Don't sprawl edits across many files unless required.
- **Explain technical decisions in one line.** If you're using `useMemo` or a particular Supabase pattern, tell me *why* in a comment or message — don't assume I'll infer.
- **I appreciate pushback.** If my request creates a bug, a security risk, or a maintenance nightmare, say so before implementing.
- **I think in first principles and trade-offs.** When I ask for a recommendation, give one — with the trade-off surfaced.
- **Skip jargon walls.** Brief inline explanations of technical terms are welcome the first time they appear.

I am also a HYROX athlete and the studio at the heart of this product is real — so domain mistakes (e.g. confusing PT with group classes) are visible to me.

---

## Part 3 — About M3S

### 3.1 What this product is

**M3S (My Third Space)** is a premium PT client management system for a fitness studio in Indiranagar, Bengaluru. Founder: Shwetambari Shetty. Studio manager: Harshita.

It is three connected surfaces:
- **Public marketing site** (`index.html`) — booking, café ordering, sign-in
- **Client app** (`profile.jsx`) — onboarding, dashboard, profile, ratings
- **Coach Universe** (`coach-universe.jsx`) — calendar, clients, notes, admin panel

### 3.2 Pilot scope

- ~10–15 pilot clients, 11 coaches (8 PT-eligible + 3 group-only)
- Two admins: Shwetambari (owner) + Harshita (manager)
- Region: India (IST timezone, INR currency, Razorpay/UPI for payments)

### 3.3 Production stack

- **Framework:** Next.js 15 with App Router, TypeScript
- **Styling:** Tailwind CSS utility classes (migrated from prototype's inline styles)
- **Database + Auth:** Supabase (Postgres + RLS + Auth)
- **ORM:** Drizzle
- **Hosting:** Vercel (web app), Cloudflare (DNS, registrar)
- **Background jobs:** Supabase Edge Functions + `pg_cron`. **Do NOT introduce Inngest or other job runners** without explicit ask.
- **Payments:** Razorpay (UPI/card/netbanking)
- **External APIs (Phase 2):** Anthropic Claude API for AI insights, WhatsApp via n8n, Petpooja webhook for café orders

### 3.4 Prototype origin

The screens in this repo were prototyped in Claude Design. Source files use inline styles with an `OT.*` token object and primitives like `OEyebrow`, `OMono`, `Section`. When porting to Next.js:
- Replace inline styles with **Tailwind utility classes** mapped from M3S design tokens.
- Convert React + plain JS to TypeScript with proper interfaces.
- Use the existing component patterns — don't invent new ones.

### 3.5 Data model

Five core data domains live in localStorage in the prototype, mapping 1:1 to Supabase tables in production:

| Prototype key | Production table |
|---|---|
| `m3s.journey` | `clients` + `client_assessments` |
| `m3s.ratings` | `ratings` |
| `m3s.nutrition` | `nutrition_plans` |
| `m3s.coachOverrides` | `coach_overrides` |
| `m3s.sessionNotes` | `session_notes` |

Full schema and RLS policies are documented in `M3S-QA-Document.md` in the repo root. Read it when working on DB tasks.

---

## Part 4 — Design system (NON-NEGOTIABLE)

The M3S design system is locked. **Never substitute "close enough" colours or fonts.** If a design token doesn't exist for what you need, ask me before inventing one.

### 4.1 Colour tokens

Map these to Tailwind config in `tailwind.config.ts`:

```ts
sand: { 50: '#FBF7F0', 100: '#F5EDE0', 200: '#EADBC4' }
walnut: { 700: '#5E4228' }
espresso: { 800: '#3E2C1C', 900: '#241810' }
clay: { 600: '#8A6640' }
ochre: { 500: '#C99A3F' }
sage: { 500: '#7B8B6F', 200: '#D7DECF' }
terracotta: { 500: '#B86B4B', 200: '#ECCDBF' }
paper: '#FFFDF8'
```

**Never use:**
- Default Tailwind blue / grey / generic palette colours
- Pure white (`#FFFFFF`) — use `paper` (`#FFFDF8`)
- Pure black — use `espresso-900`
- Cold tones (anything blue/grey/teal) in primary UI

### 4.2 Typography

- **Display (italic, serif):** Instrument Serif
- **Body:** Inter (400/500/600/700)
- **Labels/monospace:** JetBrains Mono — used for all eyebrow labels, micro-copy, mono badges. Always uppercase, letter-spacing 1.5–2px, size 10–11px.

### 4.3 Locked design patterns

- **All CTAs are pill-shaped** (`rounded-full` / `r-pill` 999px). No square buttons except utility icons.
- **Eyebrow pattern:** 6px walnut dot + JetBrains Mono uppercase label, then Instrument Serif italic headline.
- **Shadow tokens:** warm espresso-tinted only. Never `shadow-black` or default Tailwind shadows.
- **Terracotta-500** is reserved for **elevated admin actions** (destructive, owner-only, "needs attention"). Don't use it for regular buttons.

### 4.4 Layout rules

- 4pt spacing base
- Mobile-first; minimum tap target 44px
- Calendar grid + admin multi-coach views are **desktop-only** by design — show a friendly "soft gate" on mobile, not a broken responsive layout

---

## Part 5 — First-time-launcher safety rules

These exist because I have never shipped production software before. Treat them as hard constraints.

### 5.1 Secrets and credentials

- **Never commit secrets** to git. Not in code, not in comments, not in commit messages.
- `.env.local` is git-ignored. Verify before any commit.
- API keys belong in:
  - Local development: `.env.local`
  - Production: Vercel environment variables
  - Server-side only secrets (Razorpay live key, Anthropic API key): **Supabase Edge Function secrets only**, never client-side bundles.
- If you see a secret in code (mine or yours), **stop and flag it immediately**.

### 5.2 Database safety

- **Never write a migration that drops a column or table** without explicit confirmation from me — even on a "test" environment.
- **Never disable RLS** "temporarily for debugging." Use a service-role connection scoped to the specific debug query.
- **Every new table needs RLS policies in the same PR.** Not "to be added later."
- Foreign keys: prefer `ON DELETE SET NULL` over `CASCADE` unless I confirm. Cascading deletes are how data disappears silently.

### 5.3 Git and deployment

- **Never push directly to `main`.** Feature branches → PR → I review → merge.
- **Never `git push --force`** on a shared branch.
- Every PR should have a one-line summary I can read at a glance.
- Before any Vercel auto-deploy, ensure:
  - All env vars exist in Vercel project settings
  - `npm run build` succeeds locally
  - I have explicitly said "ready to deploy"

### 5.4 The RLS test that prevents a launch-day disaster

Before declaring any feature "done":

> Log in as Lee (coach). Attempt to read another coach's client data via SQL, API, or URL manipulation. **If you get back ANY row that isn't Lee's, RLS is broken.** Fix before declaring done.

This is the test that prevents the worst possible launch-day headline.

### 5.5 Health data handling

Body composition, blood markers, MSK assessments, and injury notes count as **sensitive personal data under India's DPDP Act**. This means:

- Explicit consent checkbox at onboarding ("I consent to M3S storing my body composition and health data for the purpose of personalised coaching")
- Soft-delete pattern with `deleted_at` column, 30-day grace, then hard-delete via scheduled job
- Never log this data in Sentry, console, or analytics events
- Privacy policy page must list these data types explicitly

If I ask you to skip any of these for speed, **push back**.

### 5.6 Things to refuse without explicit approval

Even if I ask for them in a moment of "just get it working":
- Disabling RLS in production
- Committing a `.env` file
- Hardcoding any API key in source
- Pushing to `main` directly
- Running destructive SQL on the production database
- Adding a new third-party SDK without discussing the trade-off

If I ask for one of these, respond with: *"This falls under §5.6 — confirm you've thought through [specific risk] before I proceed."*

---

## Part 6 — Workflow expectations

### 6.1 Before coding

For any non-trivial task:
1. Read the relevant existing file(s).
2. Read `M3S-QA-Document.md` if the task touches a screen with documented tests.
3. State a brief plan (2–5 steps) before writing code.
4. If the task involves the design system, confirm which existing component you'll reuse before building a new one.

### 6.2 During coding

- One concern per commit.
- TypeScript: no `any` without a comment explaining why.
- Every async function has error handling that I can read.
- Every component prop has a TypeScript interface.

### 6.3 After coding

End each session with:
1. `git diff --stat` — show me what changed
2. A one-paragraph summary of decisions made
3. Any "I noticed but didn't fix" observations
4. The single next step to take next time

### 6.4 When tests apply

If the task touches a flow documented in `M3S-QA-Document.md`, run the relevant TEST ID at the end and tell me the result. Don't just write the feature — verify it.

### 6.5 When I'm wrong

If I ask for something that breaks first principles, security, or the design system, say so plainly. I value honest friction over agreeable fluff. Use this format:

> "I'd push back on this because [reason]. The trade-off is [X vs Y]. If you still want it, I'll do it — but here's what we'd lose: [thing]."

---

## Part 7 — Skills to use

### 7.1 Required skills

The repo expects these skills to be loaded:

- **`frontend-design`** — **Invoke before writing ANY frontend code, every session, no exceptions.** This skill encodes the design token discipline above and prevents generic Tailwind output. Don't skip it because you "remember the rules." Read it.
- **`product-self-knowledge`** — when wiring Anthropic API calls (AI insights for coaches in Phase 2).

If you're about to create a UI file and haven't invoked `frontend-design` SKILL.md, stop and invoke it first.

---

## Part 8 — Visual self-verification (screenshot loop)

I am a Product Manager, not a designer or developer. I cannot eyeball pixel-level issues in your diffs. **You must verify your own work visually before declaring it done.**

### 8.1 Setup (one-time, already in repo)

The repo has two helper scripts at the root:
- `serve.mjs` — starts a local dev server (`node serve.mjs` → serves at `http://localhost:3000`)
- `screenshot.mjs` — takes a Puppeteer screenshot of a given URL

Puppeteer is installed in `node_modules`. Screenshots are saved to `./temporary_screenshots/screenshot-N.png` (auto-incremented, never overwritten). Optional label: `node screenshot.mjs http://localhost:3000/booking booking-step-2` → saves as `screenshot-N-booking-step-2.png`.

### 8.2 When to run the loop

**Required** for any task that creates or modifies a UI screen, component, or page. Skip only for pure data/logic/server changes that have no visible output.

### 8.3 The loop

For every UI change:

```
1. Start dev server (if not already running):
   node serve.mjs &

2. Make your code change.

3. Screenshot the affected route:
   node screenshot.mjs http://localhost:3000/<route> <label>

4. Read the PNG with the Read tool. You can see the image directly.

5. Compare against the reference image I provided (or against the
   M3S design system rules in Part 4 if no reference exists).

6. Be SPECIFIC in your comparison:
   - "Heading is 32px but reference shows ~24px"
   - "Card gap is 16px but reference is 24px"
   - "Eyebrow dot is missing — should be 6px walnut circle"
   - "CTA is square — must be pill (r-pill 999px)"

7. Check minimum: spacing/padding, font size/weight/line-height,
   exact hex colours, alignment, border-radius, shadow direction
   and tint, image sizing, icon weights.

8. If mismatches exist → fix → re-screenshot → re-compare.

9. Do at least 2 comparison rounds even if the first looks right.
   First pass catches obvious issues; second pass catches subtle
   alignment and colour drift.

10. Stop only when no visible differences remain OR I explicitly
    say "good enough."
```

### 8.4 What to do if I haven't given a reference image

Compare against M3S design system rules in Part 4. Specifically check:
- Colours from the token list only (no Tailwind defaults)
- All CTAs pill-shaped
- Typography uses Instrument Serif / Inter / JetBrains Mono (no other fonts)
- Eyebrow pattern present where applicable (dot + mono label + italic headline)
- Spacing aligned to 4pt base
- Warm espresso-tinted shadows only

### 8.5 Don't take screenshots from `file:///`

Always serve via `localhost`. A `file:///` screenshot will look broken because:
- CSS may not load correctly
- Fonts won't apply
- Next.js routing won't work at all
- Images may 404

If you see anything that looks off-brand or broken, check the URL first.

### 8.6 Don't ship UI without a screenshot

When you tell me "done," your message must include:
- The screenshot path (so I can pull it up in 1 click)
- A 1-line "I compared against [reference or design system] — looks correct" or "Here are the trade-offs I made because [reason]"

If I don't see a screenshot, I will ask for one. Save us both the round trip.

---

## Part 9 — Anti-generic guardrails

Default LLM-generated UI looks the same: indigo buttons, flat grey shadows, system fonts, generic spacing. **Refuse to ship that for M3S.** Specific rules:

### 9.1 Colours

- **Never use default Tailwind blues, indigos, greys, or generic palette colours.** Always use M3S tokens from Part 4.
- If you need a colour that doesn't exist in the token list (e.g. a chart accent), ask me before inventing one.
- No pure white (`#fff`). Use `paper` (`#FFFDF8`).
- No pure black (`#000`). Use `espresso-900` (`#241810`).

### 9.2 Shadows

- Never use flat `shadow-md` or default Tailwind shadows.
- Use the M3S espresso-tinted shadow token: `box-shadow: 0 6px 20px -8px rgba(62,44,28,0.18)` (= `--sh-2`).
- Layered shadows are fine; cold/grey shadows are not.

### 9.3 Typography

- Never use the same font for headings and body.
- Instrument Serif (italic) for display + headlines.
- Inter for body + UI.
- JetBrains Mono for labels (always uppercase, letter-spacing 1.5–2px, size 10–11px).
- Tight tracking (`-0.02em` to `-0.03em`) on large italic headings only.
- Body line-height around 1.55–1.65, never 1.0 or 2.0.

### 9.4 Gradients and texture

- Where a gradient is appropriate, layer multiple radial gradients or use one of the warm M3S tones to white.
- Never use rainbow gradients or aggressive purple/teal combinations.
- Optional: SVG noise filter at low opacity for texture on dark espresso surfaces.

### 9.5 Animations

- Only animate `transform` and `opacity`. Never `all`.
- Never use `transition-all`.
- Spring-style easing for entrance/exit; linear only for progress bars.

### 9.6 Interactive states

Every clickable element needs **hover, focus-visible, and active states**. No exceptions.
- Hover: subtle tone shift (typically 8–12% darker or lighter)
- Focus-visible: 2px ochre-500 ring with 2px offset
- Active: slight inset shadow or 1px translateY

### 9.7 Images

When using photos:
- Gradient overlay (`bg-gradient-to-t from-espresso-900/60`) for legibility on text-over-image
- Subtle `mix-blend-multiply` colour treatment layer for warmth, if appropriate to the section
- No bare unmodified photos in hero sections

### 9.8 Spacing

- Use intentional 4pt-aligned spacing tokens — not random Tailwind step combinations.
- Default vertical rhythm: 8 → 12 → 16 → 24 → 32 → 48 → 64.
- Card padding usually 20–24px; section padding usually 64–96px desktop, 32–48px mobile.

### 9.9 Depth and layering

Surfaces should follow this layering system:
- **Base** — sand-50 or paper, no shadow
- **Elevated** — paper bg, hairline border, sh-2 shadow
- **Floating** — paper bg, sh-3 shadow, often r-xl, used for modals/drawers
- **Stage** — espresso-900 dark surface for emphasis (services section, hero, etc.)

Never let three different elevation levels sit at the same z-plane.

---

## Part 10 — Hard rules

Things to refuse even if I ask. The CLAUDE.md equivalent of a hard stop.

- Do not push directly to `main`.
- Do not disable RLS, even "temporarily."
- Do not commit secrets, ever.
- Do not use `transition-all`.
- Do not use default Tailwind blue/indigo as the primary brand colour.
- Do not "improve" a reference design — match it.
- Do not stop after one screenshot pass — always do at least 2.
- Do not add sections, features, or content I didn't ask for.
- Do not introduce a new third-party SDK or service without discussing trade-offs first.
- Do not refactor adjacent code unless I asked.
- Do not declare a UI task "done" without a screenshot.

---

**These guidelines are working if:** I rarely have to clean up after you, you flag risks before they happen, you provide screenshots without me asking, and the diffs I review are small enough to actually read.

---

## Part 11 — Glossary

So we share vocabulary:

- **PT** = Personal Training (1:1 session)
- **GX / Group Class** = scheduled group fitness class
- **BCA** = Body Composition Analysis (InBody, DEXA scan, etc.)
- **MSK** = Musculoskeletal (mobility/injury assessment)
- **HYROX** = a specific fitness race format — many of our clients train for this
- **Coach override** = when a coach manually sets a client's fitness score dimension, overriding the AI-computed value
- **Soft gate** = a friendly "use a larger screen" message, not a hard block
- **Petpooja** = the café POS system Kenko uses
- **Kenko** = the in-house café partner (`@thekenkolife`)
- **RLS** = Row Level Security (Postgres feature that gates which rows each user can read/write)
- **Hairline** = the M3S 1px border at `rgba(62,44,28,0.12)`
- **Eyebrow** = the small mono label above a section headline (e.g. "● BOOKING")
