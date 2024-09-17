import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { ClientError } from './client-error.js';

const hashKey = process.env.TOKEN_SECRET ?? '';
if (!hashKey) throw new Error('TOKEN_SECRET not found in env');

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const auth = req.get('Authorization');
  const token = auth?.split('Bearer ')[1];
  if (!auth || !token) {
    throw new ClientError(401, 'authentication required');
  }
  try {
    const payload = jwt.verify(token, hashKey);
    req.user = payload as Request['user'];
    next();
  } catch {
    throw new ClientError(401, 'authentication required');
  }
}
