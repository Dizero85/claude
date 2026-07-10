import { Router } from 'express';
import { listNotifications, listTasks, listSyncs } from '../store.js';

export function feedsRouter(db) {
  const router = Router();
  router.get('/notifications', (req, res) => res.json(listNotifications(db)));
  router.get('/tasks', (req, res) => res.json(listTasks(db)));
  router.get('/syncs', (req, res) => res.json(listSyncs(db)));
  return router;
}
