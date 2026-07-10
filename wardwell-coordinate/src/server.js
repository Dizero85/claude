import express from 'express';
import path from 'node:path';
import { config } from './config.js';
import { openDb } from './db.js';
import { wardsRouter } from './routes/wards.js';
import { feedsRouter } from './routes/feeds.js';
import { courtWatchRouter } from './routes/courtWatch.js';
import { startCourtWatchScheduler } from './services/courtWatch/scheduler.js';

const db = openDb();

const app = express();
app.use(express.json());
app.use(express.static(path.join(config.root, 'public')));
app.use('/samples', express.static(path.join(config.root, 'samples')));

app.use('/api', wardsRouter(db));
app.use('/api', feedsRouter(db));
app.use('/api', courtWatchRouter(db));

app.get('/api/health', (req, res) => res.json({ ok: true }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'internal error', message: err.message });
});

app.listen(config.port, () => {
  console.log(`Wardwell Coordinate listening on http://localhost:${config.port}`);
  startCourtWatchScheduler(db);
});
