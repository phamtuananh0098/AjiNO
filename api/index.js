import { handleApi } from '../server/index.mjs';

export default async function handler(req, res) {
  try {
    const rawPath =
      req.headers['x-forwarded-uri'] ||
      req.headers['x-matched-path'] ||
      req.url;

    if (rawPath && typeof rawPath === 'string' && (req.url === '/api' || req.url === '/api/')) {
      req.url = rawPath;
    }

    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const url = new URL(req.url, `${proto}://${host}`);

    const handled = await handleApi(req, res, url);
    if (!handled && !res.headersSent) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: 'Endpoint không tồn tại' }));
    }
  } catch (err) {
    console.error('[duyen-ca-vercel-api-error]', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Lỗi xử lý Vercel API' }));
    }
  }
}
