/**
 * Simple HTTP proxy: localhost:8000 -> localhost:9000
 * Pour contourner le blocage du pare-feu Windows sur le port 8000
 */
const http = require('http');

const TARGET_PORT = 9000;
const PROXY_PORT = 8000;

const server = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: TARGET_PORT,
    path: req.url,
    method: req.method,
    headers: req.headers,
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err);
    res.writeHead(502);
    res.end('Bad Gateway');
  });

  req.pipe(proxyReq);
});

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`✅ Proxy running: http://127.0.0.1:${PROXY_PORT} -> http://127.0.0.1:${TARGET_PORT}`);
  console.log(`   Your mobile app can now connect to http://localhost:${PROXY_PORT}/api`);
});

server.on('error', (err) => {
  console.error('❌ Failed to start proxy:', err.message);
  process.exit(1);
});
