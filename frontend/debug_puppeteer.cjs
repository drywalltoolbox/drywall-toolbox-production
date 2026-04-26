const http = require('http');
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const root = path.resolve(__dirname, '..', 'dist');
const port = 8081;

const server = http.createServer((req, res) => {
  let url = req.url;
  if (url === '/') url = '/index.html';
  const filePath = path.join(root, url);
  if (!filePath.startsWith(root)) {
    res.statusCode = 403;
    return res.end('Forbidden');
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const indexPath = path.join(root, 'index.html');
      res.setHeader('Content-Type', 'text/html');
      return fs.createReadStream(indexPath).pipe(res);
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.woff2': 'font/woff2',
    }[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(port, async () => {
  console.log('Serving dist at http://localhost:' + port);
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();

  page.on('console', (msg) => console.log('[BROWSER]', msg.type(), msg.text()));
  page.on('pageerror', (err) => console.error('[PAGE ERROR]', err.toString()));
  page.on('requestfailed', (req) => console.error('[REQ FAIL]', req.url(), req.failure() && req.failure().errorText));

  try {
    const response = await page.goto(`http://localhost:${port}/drywall-toolbox/`, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('response status', response && response.status());
    const html = await page.content();
    console.log('PAGE HTML LENGTH', html.length);
  } catch (err) {
    console.error('[NAV ERROR]', err);
  } finally {
    await browser.close();
    server.close();
  }
});
