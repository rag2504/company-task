import { User } from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError } from '../utils/AppError.js';

export async function register({ email, password, name, role = 'Owner' }) {
  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw new AppError('Email already registered', 409);
  }
  if (role !== 'Owner') {
    throw new AppError('Public registration is only for Owner accounts', 400);
  }
  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    email: email.toLowerCase(),
    passwordHash,
    name,
    role: 'Owner',
    ownerId: null,
  });
  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function login({ email, password }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401);
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new AppError('Invalid email or password', 401);
  }
  const token = signToken(user._id);
  return {
    token,
    user: {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}
