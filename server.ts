import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { execSync } from 'child_process';
import { DatabaseSync } from 'node:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize centralized SQLite database using Node 22 built-in node:sqlite (DatabaseSync)
const dbPath = path.join(__dirname, 'production_command.db');
const db = new DatabaseSync(dbPath);

// Create relational tables if they do not exist
db.exec(`
  CREATE TABLE IF NOT EXISTS candidate (
    id TEXT PRIMARY KEY,
    regId TEXT UNIQUE NOT NULL,
    fullName TEXT NOT NULL,
    fatherName TEXT,
    dob TEXT,
    aadhaarNumber TEXT NOT NULL,
    drivingLicense TEXT NOT NULL,
    dlExpiry TEXT,
    centerId TEXT NOT NULL,
    status TEXT DEFAULT 'PENDING_PO_REVIEW',
    phone TEXT,
    city TEXT,
    photoUrl TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS batch (
    id TEXT PRIMARY KEY,
    batchNumber TEXT UNIQUE NOT NULL,
    centerId TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS attendance_punch (
    id TEXT PRIMARY KEY,
    candidateId TEXT NOT NULL,
    centerId TEXT NOT NULL,
    punchType TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'VERIFIED'
  );

  CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    action TEXT NOT NULL,
    userRole TEXT NOT NULL,
    details TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

console.log('[Centralized Database] SQLite database initialized successfully at:', dbPath);

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
app.use(express.json());

// --- CANDIDATES REST API ---
app.get('/api/candidates', (_req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM candidate ORDER BY createdAt DESC');
    const candidates = stmt.all();
    return res.json({ success: true, candidates });
  } catch (err) {
    console.error('Failed to fetch candidates:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch candidates from database' });
  }
});

app.post('/api/candidates', (req, res) => {
  try {
    const data = req.body;
    const id = `cand-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const regId = data.regId || `DBS-${Math.floor(100000 + Math.random() * 900000)}`;
    const fullName = data.fullName || 'Unknown Candidate';
    const fatherName = data.fatherName || '';
    const dob = data.dob || '';
    const aadhaarNumber = data.aadhaarNumber || '000000000000';
    const drivingLicense = data.drivingLicense || 'DL-000000';
    const dlExpiry = data.dlExpiry || '';
    const centerId = data.centerId || 'ctr-jodhpur';
    const status = data.status || 'PENDING_PO_REVIEW';
    const phone = data.phone || '';
    const city = data.city || '';
    const photoUrl = data.photoUrl || '';

    const stmt = db.prepare(`
      INSERT INTO candidate (id, regId, fullName, fatherName, dob, aadhaarNumber, drivingLicense, dlExpiry, centerId, status, phone, city, photoUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, regId, fullName, fatherName, dob, aadhaarNumber, drivingLicense, dlExpiry, centerId, status, phone, city, photoUrl);

    const getStmt = db.prepare('SELECT * FROM candidate WHERE id = ?');
    const candidate = getStmt.get(id);

    return res.status(201).json({ success: true, candidate });
  } catch (err) {
    console.error('Failed to create candidate:', err);
    return res.status(500).json({ success: false, message: 'Failed to create candidate in database' });
  }
});

// --- BATCHES REST API ---
app.get('/api/batches', (_req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM batch ORDER BY createdAt DESC');
    const batches = stmt.all();
    return res.json({ success: true, batches });
  } catch (err) {
    console.error('Failed to fetch batches:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch batches from database' });
  }
});

app.post('/api/batches', (req, res) => {
  try {
    const data = req.body;
    const id = `batch-${Date.now()}`;
    const batchNumber = data.batchNumber || `BATCH-${Date.now()}`;
    const centerId = data.centerId || 'ctr-jodhpur';
    const status = data.status || 'OPEN';

    const stmt = db.prepare(`
      INSERT INTO batch (id, batchNumber, centerId, status)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, batchNumber, centerId, status);

    const getStmt = db.prepare('SELECT * FROM batch WHERE id = ?');
    const batch = getStmt.get(id);

    return res.status(201).json({ success: true, batch });
  } catch (err) {
    console.error('Failed to create batch:', err);
    return res.status(500).json({ success: false, message: 'Failed to create batch in database' });
  }
});

// --- ADMINISTRATIVE DATA PURGE API (Real SQL TRUNCATE / DELETE) ---
app.post('/api/admin/purge-all-data', (req, res) => {
  console.log('[Server API] Received POST /api/admin/purge-all-data request', {
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  const userRole = req.headers['x-user-role'] || req.body?.role || req.query?.role;
  if (userRole !== 'CEO') {
    console.warn(`[Server API] Purge rejected. Insufficient permissions for role: ${userRole}`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden: 403 Forbidden. Only the authenticated CEO can execute platform-wide database purge.'
    });
  }

  try {
    // Execute real SQL transactional deletion across all database tables
    db.exec('BEGIN TRANSACTION;');
    db.exec('DELETE FROM attendance_punch;');
    db.exec('DELETE FROM audit_log;');
    db.exec('DELETE FROM batch;');
    db.exec('DELETE FROM candidate;');
    db.exec('COMMIT;');

    // Also clear server-side state file if present
    const serverStateFile = path.join(__dirname, 'server_db_state.json');
    if (fs.existsSync(serverStateFile)) {
      fs.writeFileSync(serverStateFile, JSON.stringify({ candidates: [], batches: [], expenseClaims: [], leaves: [], attendancePunches: [], tours: [], maintenanceTickets: [] }));
    }

    console.log('[Server Audit] Centralized SQL database purge successfully executed by CEO.');
    return res.status(200).json({
      success: true,
      message: 'Centralized SQL database tables truncated successfully. Zero-state initialized.'
    });
  } catch (error) {
    try { db.exec('ROLLBACK;'); } catch {}
    console.error('Centralized database purge failed:', error);
    return res.status(500).json({ success: false, message: 'Server centralized database purge failed' });
  }
});

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

// Determine listening port:
const port = Number(process.env.PORT) || 3000;
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Production server running on http://0.0.0.0:${port} with Centralized SQL Database (node:sqlite)`);
});
