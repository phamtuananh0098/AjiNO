import { copyFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { ROOT, PLAYLIST_FILE } from '../server/paths.mjs';

async function run() {
  const backupDir = join(ROOT, 'backups');
  let files;
  try {
    files = (await readdir(backupDir)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    console.log('Chưa có tệp sao lưu nào trong thư mục backups/');
    return;
  }

  if (files.length === 0) {
    console.log('Chưa có tệp sao lưu nào trong thư mục backups/');
    return;
  }

  const latest = files[files.length - 1];
  const source = join(backupDir, latest);
  await copyFile(source, PLAYLIST_FILE);
  console.log(`✅ Đã khôi phục thành công kịch bản cưới từ bản sao lưu gần nhất: ${latest}`);
}

run().catch((err) => {
  console.error('❌ Lỗi khôi phục:', err.message);
  process.exit(1);
});
