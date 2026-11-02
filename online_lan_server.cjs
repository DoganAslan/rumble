/**
 * ASPHALT RUMBLE: REAL WORLD RACING 3D
 * Standalone Offline / LAN Relay Server (100% Free, Zero-Dependency)
 * 
 * Usage:
 *   node online_lan_server.cjs [port]
 * 
 * Default port: 8080
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const PORT = parseInt(process.argv[2] || 8080, 10);
const DIR = __dirname;

function getLanIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const isWifi = /wi-fi|wlan|wireless|ethernet|yerel/i.test(name);
        candidates.push({ address: iface.address, isWifi, name });
      }
    }
  }
  if (candidates.length === 0) return '127.0.0.1';
  candidates.sort((a, b) => (b.isWifi ? 1 : 0) - (a.isWifi ? 1 : 0));
  return candidates[0].address;
}

const LAN_IP = getLanIp();
const LAN_URL = `http://${LAN_IP}:${PORT}`;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  let reqPath = req.url.split('?')[0];

  // API endpoint for dynamic LAN IP discovery
  if (reqPath === '/api/network-info' || reqPath === '/api/lan-info') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(JSON.stringify({
      lanIp: LAN_IP,
      port: PORT,
      lanUrl: LAN_URL
    }));
  }

  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(DIR, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*'
    });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('================================================================');
  console.log('  🏎️  ASPHALT RUMBLE: ONLINE & LAN MULTIPLAYER SUNUCUSU');
  console.log('================================================================');
  console.log(`  Yerel Bilgisayar:    http://localhost:${PORT}`);
  console.log(`  Diğer Bilgisayarlar: ${LAN_URL} (Aynı Wi-Fi / Ağ)`);
  console.log('----------------------------------------------------------------');
  console.log('  Oyun hem internet üzerinden (WebRTC) hem yerel ağda (LAN)');
  console.log('  tamamen ücretsiz olarak çalışmaktadır!');
  console.log('================================================================\n');
});
