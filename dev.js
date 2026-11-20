import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const children = [
  spawn(process.execPath, [path.join(root, 'server.js')], { stdio: 'inherit', cwd: root }),
  spawn(process.execPath, [path.join(root, 'node_modules/vite/bin/vite.js')], { stdio: 'inherit', cwd: root }),
];

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) if (!child.killed) child.kill();
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', (error) => {
    console.error('Ажиллуулахад алдаа:', error.message);
    stop(1);
  });
  child.on('exit', (code) => {
    if (!stopping && code !== 0) stop(code || 1);
  });
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
