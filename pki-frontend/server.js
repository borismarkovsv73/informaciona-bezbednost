const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

// Disable SSL verification for development (for proxy requests to backend)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  // Load PKI certificate
  const httpsOptions = {
    pfx: fs.readFileSync(path.join(__dirname, 'certs', 'localhost.p12')),
    passphrase: 'keystorePassword123'
  };

  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on https://${hostname}:${port}`);
      console.log('> Using PKI certificate for HTTPS');
      console.log('> Certificate issued by your own PKI system!');
    });
});