import {
  listNotifications,
  markRead,
  markAllRead,
  syncAiNotifications,
} from '../services/notificationService.js';
import { AppError } from '../utils/AppError.js';

export async function list(req) {
  const unreadOnly = req.query.unread === '1' || req.query.unread === 'true';
  return listNotifications(req.user._id, { unreadOnly });
}

export async function readOne(req) {
  const n = await markRead(req.user._id, req.params.id);
  if (!n) throw new AppError('Notification not found', 404);
  return n;
}

export async function readAll(req) {
  return markAllRead(req.user._id);
}

export async function sync(req) {
  const io = req.app.get('io');
  const created = await syncAiNotifications(req.user._id, io);
  return { generated: created.length };
}
