import type { NextFunction, Request, Response } from 'express';
import type { Role } from '../prisma-client/index.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { verifyToken } from '../utils/jwt.js';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Missing bearer token'));
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
}

export function authorize(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }
    if (roles.length && !roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }
    next();
  };
}
