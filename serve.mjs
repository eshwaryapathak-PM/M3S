#!/usr/bin/env node
// Wraps `next dev` so other tools (screenshot.mjs, automation) can rely on a
// stable entrypoint. Forwards stdio and signals so Ctrl+C cleans up the child.

import { spawn } from 'node:child_process';

const port = process.env.PORT || '3000';

const child = spawn('npx', ['next', 'dev', '--port', port], {
  stdio: 'inherit',
  shell: false,
  env: process.env,
});

const forward = (signal) => () => {
  if (!child.killed) child.kill(signal);
};
process.on('SIGINT', forward('SIGINT'));
process.on('SIGTERM', forward('SIGTERM'));

child.on('exit', (code) => process.exit(code ?? 0));
