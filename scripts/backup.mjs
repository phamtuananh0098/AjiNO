import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, PLAYLIST_FILE } from '../server/paths.mjs';

async function run() {
  const backupDir = join(ROOT, 'backups');
  await mkdir(backupDir, { recursive: true });

  const raw = await readFile(PLAYLIST_FILE, 'utf8');
  const data = JSON.parse(raw);
  const safeCouple = (data.meta?.couple || 'wedding').replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup_${safeCouple}_${timestamp}.json`;
  const target = join(backupDir, filename);

  await copyFile(PLAYLIST_FILE, target);
  console.log(`✅ Đã sao lưu kịch bản cưới thành công vào: backups/${filename}`);
}

run().catch((err) => {
  console.error('❌ Lỗi sao lưu:', err.message);
  process.exit(1);
});
