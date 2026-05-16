import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';
import { User } from '../models/User.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required', 401);
    }
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) {
      throw new AppError('Invalid session', 401);
    }
    req.user = user;
    req.tokenPayload = payload;
    next();
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError('Invalid or expired token', 401);
  }
}

export function requireOwner(req, res, next) {
  if (req.user.role !== 'Owner') {
    throw new AppError('Owner access required', 403);
  }
  next();
}

export function signToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function socketAuthenticate(socket, next) {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.query?.token?.replace?.(/^Bearer\s+/i, '');
    if (!token) {
      return next(new Error('Unauthorized'));
    }
    const payload = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user || !user.isActive) {
      return next(new Error('Unauthorized'));
    }
    socket.userId = user._id.toString();
    socket.user = user;
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
}
