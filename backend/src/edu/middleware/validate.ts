import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod3';

type RequestPart = 'body' | 'query' | 'params';

export function validate(schema: ZodTypeAny, part: RequestPart = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req[part]);
      // В Express 5 req.query — геттер без сеттера, поэтому подменяем свойство целиком.
      Object.defineProperty(req, part, { value: parsed, writable: true, configurable: true, enumerable: true });
      next();
    } catch (error) {
      next(error);
    }
  };
}
