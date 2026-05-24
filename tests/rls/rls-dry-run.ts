// RLS dry-run runner. Performs the AD-03 test from M3S-QA-Document.md §12.
// Phase 0: skeleton only — Supabase isn't connected yet. Phase 4 wires real tests
// against a Supabase test project with seeded coach_x / coach_y / client_a.
//
// Run with: npm run rls:dry-run
// (Node's --experimental-strip-types emits a warning on first run — expected.)

interface RLSTest {
  id: string;
  description: string;
  run: () => Promise<{ passed: boolean; details: string }>;
}

const tests: RLSTest[] = [
  {
    id: 'AD-03',
    description: "Coach Y cannot read Coach X's client",
    async run() {
      // TODO Phase 4:
      //   1. Seed test users: coach_x, coach_y, client_a (assigned_coach_id = coach_x.id)
      //   2. Authenticate as coach_y
      //   3. SELECT * FROM clients WHERE id = client_a.id
      //   4. Pass if 0 rows returned (RLS blocked); fail otherwise.
      // The single most important test in the M3S build — see QA §12 callout.
      return { passed: false, details: 'Not yet implemented — Phase 4' };
    },
  },
  // Future tests, added as each phase wires RLS:
  //   - clients self-read           (Phase 4)
  //   - session_notes coach-write   (Phase 6, CW-01)
  //   - nutrition_plans coach-write (Phase 6, CW-02)
  //   - coach_overrides coach-write (Phase 6, CW-03)
  //   - admin_users owner-only      (Phase 7, AD-02)
];

async function main() {
  console.log(`\nRunning ${tests.length} RLS dry-run test(s)...\n`);
  let allPassed = true;
  let pending = 0;

  for (const test of tests) {
    const { passed, details } = await test.run();
    const isPending = details.includes('Not yet implemented');
    const tag = isPending ? 'PEND' : passed ? 'PASS' : 'FAIL';
    console.log(`  [${tag}] ${test.id} — ${test.description}`);
    if (!passed && !isPending) console.log(`         ${details}`);
    if (isPending) pending++;
    if (!passed && !isPending) allPassed = false;
  }

  console.log();
  if (!allPassed) {
    console.log('RLS failures — fix before deploy.');
    process.exit(1);
  }
  if (pending > 0) {
    console.log(`${pending} test(s) pending — see TODOs.`);
    process.exit(0);
  }
  console.log('All RLS tests passed.');
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(2);
});
