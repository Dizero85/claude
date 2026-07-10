import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// Minimal .env loader (no dependency): KEY=VALUE per line, # comments, blank
// lines ignored. Real deployments should still just export real env vars.
function loadDotEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadDotEnv(path.join(ROOT, '.env'));

export const config = {
  root: ROOT,
  port: Number(process.env.PORT) || 3000,
  databasePath: process.env.DATABASE_PATH
    ? path.resolve(ROOT, process.env.DATABASE_PATH)
    : path.join(ROOT, 'data', 'wardwell.sqlite'),
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  alertFrom: process.env.ALERT_FROM || 'alerts@wardwell.local',
  alertTo: process.env.ALERT_TO || '',
  courtWatch: {
    provider: process.env.COURT_WATCH_PROVIDER || 'mock',
    enabled: String(process.env.COURT_WATCH_ENABLED).toLowerCase() === 'true',
  },
};
