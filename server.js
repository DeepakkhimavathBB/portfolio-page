const fs = require('fs');
const path = require('path');
const chatHandler = require('./api/chat');
const transcriptHandler = require('./api/transcript');

const root = __dirname;
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.ico': 'image/x-icon'
};

module.exports = async function handler(req, res) {
  const requestUrl = new URL(req.url || '/', 'http://localhost');
  const pathname = requestUrl.pathname;

  if (pathname === '/api/chat') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
    return chatHandler(req, res);
  }

  if (pathname === '/api/transcript') {
    if (req.method !== 'POST') return sendJson(res, 405, { error: 'Method not allowed' });
    return transcriptHandler(req, res);
  }

  if (pathname.startsWith('/api/')) return sendJson(res, 404, { error: 'Not found' });
  if (req.method !== 'GET' && req.method !== 'HEAD') return sendJson(res, 405, { error: 'Method not allowed' });

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return sendJson(res, 400, { error: 'Invalid path' });
  }

  const relativePath = decodedPath === '/' ? 'index.html' : decodedPath.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return sendJson(res, 403, { error: 'Forbidden' });
  }

  fs.readFile(filePath, (error, data) => {
    if (error) return sendJson(res, 404, { error: 'Not found' });
    res.setHeader('Content-Type', contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream');
    res.setHeader('Cache-Control', pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate');
    res.statusCode = 200;
    if (req.method === 'HEAD') return res.end();
    return res.end(data);
  });
};

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}
