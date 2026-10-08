import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const distPath = path.join(__dirname, 'dist');

// Ensure dist directory exists before serving
if (!fs.existsSync(distPath) || !fs.existsSync(path.join(distPath, 'index.html'))) {
  console.log('Production build not found in ./dist, executing npm run build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
  } catch (err) {
    console.error('Failed to compile production build:', err);
  }
}

// Serve static assets from dist
app.use(express.static(distPath));

// Health check endpoint for Cloud Run startup and liveness probes
app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

// Single Page Application (SPA) catch-all fallback
app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Application build in progress or missing index.html');
  }
});

// Primary listening port: Cloud Run sets PORT (usually 8080).
// In environments where an Nginx proxy already occupies 8080 and proxies to 3000,
// fallback gracefully to 3000 upon EADDRINUSE.
const targetPort = parseInt(process.env.PORT || '8080', 10);
const fallbackPort = parseInt(process.env.DEFAULT_APP_PORT || '3000', 10);

function startServer(port: number) {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server successfully listening on http://0.0.0.0:${port}`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${port} is currently in use.`);
      if (port !== fallbackPort) {
        console.log(`Attempting fallback to port ${fallbackPort}...`);
        startServer(fallbackPort);
      } else {
        console.error(`Unable to bind to port ${port} and fallback port ${fallbackPort}.`);
        process.exit(1);
      }
    } else {
      console.error('Server error:', err);
      process.exit(1);
    }
  });

  return server;
}

startServer(targetPort);
