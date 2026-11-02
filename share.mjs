#!/usr/bin/env node
import http from 'http';
import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 8123;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg'
};

// Check if port is already running an HTTP server
function isPortInUse(port) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}/`, (res) => {
      resolve(true);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(800, () => {
      req.destroy();
      resolve(false);
    });
  });
}

function startStaticServer(port) {
  const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

    const safePath = path.normalize(path.join(__dirname, reqPath));
    if (!safePath.startsWith(__dirname)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    fs.stat(safePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        return res.end('Not Found');
      }

      const ext = path.extname(safePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(safePath).pipe(res);
    });
  });

  return new Promise((resolve) => {
    server.listen(port, () => {
      console.log(`[LocalServer] Yerel oyun sunucusu port ${port} üzerinde başlatıldı.`);
      resolve(server);
    });
  });
}

function copyToClipboard(text) {
  try {
    if (process.platform === 'win32') {
      exec(`powershell -command "Set-Clipboard -Value '${text}'"`);
    } else if (process.platform === 'darwin') {
      exec(`echo "${text}" | pbcopy`);
    } else {
      exec(`echo "${text}" | xclip -selection clipboard`);
    }
  } catch (e) {
    // Clipboard non-critical
  }
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      exec(`start "" "${url}"`);
    } else if (process.platform === 'darwin') {
      exec(`open "${url}"`);
    } else {
      exec(`xdg-open "${url}"`);
    }
  } catch (e) {
    // Browser open non-critical
  }
}

async function main() {
  console.log('\n===============================================================');
  console.log('🏎️   RUMBLE GT - ÜCRETSİZ ONLINE ÇOK OYUNCULU PAYLAŞIM SİSTEMİ');
  console.log('===============================================================\n');

  const inUse = await isPortInUse(PORT);
  if (!inUse) {
    console.log(`[1/3] Port ${PORT} kontrol edildi, yerel sunucu başlatılıyor...`);
    await startStaticServer(PORT);
  } else {
    console.log(`[1/3] Port ${PORT} aktif ve dinleniyor.`);
  }

  console.log('[2/3] Ücretsiz genel internet tüneli oluşturuluyor (localtunnel)...');

  const lt = spawn('npx', ['--yes', 'localtunnel', '--port', String(PORT)], {
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let tunnelUrl = null;

  lt.stdout.on('data', (chunk) => {
    const text = chunk.toString();
    const match = text.match(/https:\/\/[a-z0-9\-]+\.loca\.lt/i);
    if (match && !tunnelUrl) {
      tunnelUrl = match[0];
      onTunnelReady(tunnelUrl);
    }
  });

  lt.stderr.on('data', (chunk) => {
    // Silent or debug
  });

  lt.on('close', (code) => {
    console.log('\n[Tunnel] Bağlantı sonlandırıldı.');
    process.exit(0);
  });

  process.on('SIGINT', () => {
    console.log('\n[Rumble] Kapatılıyor...');
    lt.kill();
    process.exit(0);
  });
}

function onTunnelReady(url) {
  console.log('\n===============================================================');
  console.log('🟢 GENEL İNTERNET TÜNELİ BAŞARIYLA AÇILDI! (%100 ÜCRETSİZ)');
  console.log('===============================================================\n');
  console.log('🌐 GENEL WEB ADRESİNİZ:');
  console.log(`   \x1b[1m\x1b[36m${url}\x1b[0m\n`);
  console.log('📋 NASIL OYNANIR?');
  console.log('  1. Bu link otomatik olarak panonuza kopyalandı ve tarayıcınızda açılıyor.');
  console.log('  2. Oyun içinde "ONLINE ÇOK OYUNCULU" -> "ODA OLUŞTUR" -> "YENİ ODA AÇ"a tıklayın.');
  console.log('  3. "DAVET LİNKİ KOPYALA" butonuna bastığınızda, arkadaşınız için doğrudan:');
  console.log(`     \x1b[33m${url}/?room=XXXXX\x1b[0m linki kopyalanır!`);
  console.log('  4. Arkadaşınız bu linke tıkladığında farklı şehirde/farklı internette olsa bile');
  console.log('     doğrudan odaya bağlanır ve 60 FPS P2P yarışırsınız!\n');
  console.log('💡 Not: Bu pencereyi açık tutun. Yarışınız bitince CTRL+C ile kapatabilirsiniz.');
  console.log('===============================================================\n');

  copyToClipboard(url);
  openBrowser(url);
}

main().catch((err) => {
  console.error('Başlatma hatası:', err);
});
