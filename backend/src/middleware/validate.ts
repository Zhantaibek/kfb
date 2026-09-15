import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodType } from "zod";
import { AppError } from "./error";

export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? "Некорректный запрос";
      next(new AppError(message, 400));
      return;
    }
    req.body = parsed.data;
    next();
  };
}
