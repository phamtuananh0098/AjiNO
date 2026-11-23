import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

console.log('\n🌸 Khởi động Duyên Ca · Wedding Playlist Studio (AjiNO)...\n');

// 1. Start backend server
const server = spawn('node', [join(ROOT, 'server', 'index.mjs')], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, PORT: '8788' },
});

// 2. Start Vite dev server
const vite = spawn('npx.cmd', ['vite'], {
  cwd: ROOT,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, DUYEN_CA_API: 'http://127.0.0.1:8788' },
});

function cleanup() {
  server.kill();
  vite.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
