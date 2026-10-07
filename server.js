import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
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

app.listen(port, '0.0.0.0', () => {
  console.log(`Cloud Run server active and listening on http://0.0.0.0:${port}`);
});
