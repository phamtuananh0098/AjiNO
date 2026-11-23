import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { DATA_DIR, PLAYLIST_FILE } from './paths.mjs';

export const DEFAULT_PLAYLIST = {
  version: 1,
  isDefault: true,
  meta: {
    title: 'Lễ Thành Hôn & Dạ Tiệc Cưới',
    couple: 'Minh Quân & Thùy Dung',
    groomName: 'Minh Quân (Họ Nhà Trai)',
    brideName: 'Thùy Dung (Họ Nhà Gái)',
    groomMusicStyle: 'Pop Rock, Acoustic, Ballad ấm áp, Gu nhạc chú rể & hội bạn',
    brideMusicStyle: 'Ballad ngọt ngào, K-Pop, Nhạc Hoa lãng mạn, Gu nhạc cô dâu',
    date: '2026-12-28',
    time: '18:00',
    venue: 'Grand Palace Ballroom · Sảnh Ánh Dương',
    note: 'Kịch bản phân chia 2 bên Nhà Trai & Nhà Gái — Tự do cá nhân hoá theo sở thích riêng biệt.',
  },
  sections: [
    {
      id: 'sec_groom_procession',
      name: 'Lễ xuất phát rước dâu (Nhà Trai)',
      description: 'Nhạc hào hứng, rộn ràng khi nhà trai chuẩn bị sính lễ và lên xe hoa sang đón dâu.',
      tone: 'gold',
      side: 'groom',
      order: 1,
    },
    {
      id: 'sec_bride_vuquy',
      name: 'Lễ Vu Quy & Đón khách (Nhà Gái)',
      description: 'Nhạc acoustic dịu dàng, trang trọng đón họ nhà trai sang làm lễ thưa chuyện.',
      tone: 'rose',
      side: 'bride',
      order: 2,
    },
    {
      id: 'sec_welcome',
      name: 'Đón khách & Chụp hình sảnh tiệc',
      description: 'Âm nhạc lãng mạn, văn minh chào đón quan khách hai họ chụp ảnh lưu niệm.',
      tone: 'champagne',
      side: 'both',
      order: 3,
    },
    {
      id: 'sec_groom_entrance',
      name: 'Khai mạc & Chú rể tiến vào',
      description: 'Nhạc hào hùng, xúc động đón chú rể bước lên sân khấu đón chờ tình yêu đời mình.',
      tone: 'gold',
      side: 'groom',
      order: 4,
    },
    {
      id: 'sec_bride_entrance',
      name: 'Khoảnh khắc Cô dâu bước vào lễ đường',
      description: 'Khoảnh khắc thiêng liêng nhất — bật đúng điệp khúc cao trào khi cánh cửa mở ra!',
      tone: 'wine',
      side: 'bride',
      order: 5,
    },
    {
      id: 'sec_vows_rings',
      name: 'Trao nhẫn & Thề nguyện trọn đời',
      description: 'Nhạc nền dịu êm làm nổi bật lời thề và chiếc nhẫn cưới của đôi bạn trẻ.',
      tone: 'rose',
      side: 'both',
      order: 6,
    },
    {
      id: 'sec_cake_toast',
      name: 'Cắt bánh, Rót rượu & Hai họ nâng ly',
      description: 'Tiết tấu tươi vui, hứng khởi khi pháo hoa sáng rực và toàn thể khách mời nâng ly.',
      tone: 'gold',
      side: 'both',
      order: 7,
    },
    {
      id: 'sec_dinner',
      name: 'Dạ tiệc cưới & Dùng bữa',
      description: 'Jazz lãng mạn, Bossa Nova và Pop Ballad du dương trong suốt bữa tiệc.',
      tone: 'olive',
      side: 'both',
      order: 8,
    },
    {
      id: 'sec_groom_party',
      name: 'Giao lưu & Quẩy tiệc hội bạn Chú Rể (Nhà Trai)',
      description: 'Remix, EDM và Rock sôi động theo gu âm nhạc chú rể và hội anh em.',
      tone: 'ink',
      side: 'groom',
      order: 9,
    },
    {
      id: 'sec_bride_party',
      name: 'Tung hoa cưới & Quẩy tiệc hội bạn Cô Dâu (Nhà Gái)',
      description: 'Nhạc vui nhộn, hào hứng cho phần tung hoa cưới và mini game cùng hội bạn thân nàng dâu.',
      tone: 'rose',
      side: 'bride',
      order: 10,
    },
    {
      id: 'sec_farewell',
      name: 'Tiễn khách & Lời tri ân hai họ',
      description: 'Nhạc ấm áp, lắng đọng gửi lời cảm ơn chân thành đến mọi người khi ra về.',
      tone: 'champagne',
      side: 'both',
      order: 11,
    },
  ],
  tracks: [
    {
      id: 'trk_groom_sample',
      sectionId: 'sec_groom_procession',
      side: 'groom',
      title: 'Ánh Nắng Của Anh (Piano Acoustic)',
      artist: 'Đức Phúc',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
      thumbnail: '',
      note: '🤵 NHÀ TRAI: Bật khi đoàn xe hoa nhà trai bắt đầu xuất phát',
      favorite: true,
      trimStart: 0,
      trimEnd: null,
      duration: 180,
      createdAt: Date.now() - 3600000,
      order: 1,
    },
    {
      id: 'trk_bride_sample',
      sectionId: 'sec_bride_entrance',
      side: 'bride',
      title: 'A Thousand Years (Violin Wedding Version)',
      artist: 'Christina Perri',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      thumbnail: '',
      note: '👰 NHÀ GÁI: QUAN TRỌNG - MC đếm 1 2 3 mở cửa là bấm phát ngay đoạn cao trào!',
      favorite: true,
      trimStart: 45,
      trimEnd: 150,
      duration: 220,
      createdAt: Date.now() - 1800000,
      order: 1,
    },
    {
      id: 'trk_both_sample',
      sectionId: 'sec_welcome',
      side: 'both',
      title: 'Until I Found You (Cello & Piano)',
      artist: 'Stephen Sanchez',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      thumbnail: '',
      note: '💍 CHUNG: Nhạc đón khách hai họ, giữ âm lượng vừa phải',
      favorite: false,
      trimStart: 0,
      trimEnd: null,
      duration: 200,
      createdAt: Date.now() - 900000,
      order: 1,
    },
  ],
  preferences: {
    theme: 'paper',
    autoNext: true,
    volume: 0.85,
    saveInterval: 300,
    defaultFade: 2,
    preferredSideView: 'split',
  },
  updatedAt: 0,
  revision: 0,
};

let currentPlaylist = null;
const sseClients = new Set();

export function getClientCount() {
  return sseClients.size;
}

export function broadcastEvent(event, data) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  }
}

export async function ensurePlaylistLoaded() {
  if (currentPlaylist) return currentPlaylist;
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(PLAYLIST_FILE, 'utf8');
    currentPlaylist = JSON.parse(raw);
    if (!currentPlaylist.meta || !Array.isArray(currentPlaylist.sections)) {
      throw new Error('Dữ liệu không hợp lệ');
    }
  } catch {
    currentPlaylist = { ...DEFAULT_PLAYLIST, isDefault: true, updatedAt: 0, revision: 0 };
    await writeFile(PLAYLIST_FILE, JSON.stringify(currentPlaylist, null, 2), 'utf8');
  }
  return currentPlaylist;
}

export async function savePlaylist(newData) {
  await mkdir(DATA_DIR, { recursive: true });
  const revision = (currentPlaylist?.revision || 0) + 1;
  currentPlaylist = {
    ...newData,
    isDefault: false,
    revision,
    updatedAt: Date.now(),
  };
  await writeFile(PLAYLIST_FILE, JSON.stringify(currentPlaylist, null, 2), 'utf8');
  broadcastEvent('playlist_updated', {
    revision,
    updatedAt: currentPlaylist.updatedAt,
    clientCount: sseClients.size,
  });
  return currentPlaylist;
}

export function handleSseConnection(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  sseClients.add(res);

  res.write(
    `event: connected\ndata: ${JSON.stringify({ clientCount: sseClients.size, timestamp: Date.now() })}\n\n`
  );

  broadcastEvent('client_count', { clientCount: sseClients.size });

  const heartbeat = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
    broadcastEvent('client_count', { clientCount: sseClients.size });
  });
}
