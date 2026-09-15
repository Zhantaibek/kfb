import type { Request, Response, NextFunction, RequestHandler } from "express";

export class AppError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "AppError";
    this.status = status;
  }
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}

export function errorHandler(error: Error, _req: Request, res: Response, _next: NextFunction) {
  if (error.name === "Unauthorized") {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (error.name === "Forbidden") {
    res.status(403).json({ error: error.message || "forbidden" });
    return;
  }
  if (error.message === "not-found") {
    res.status(404).json({ error: "Не найдено" });
    return;
  }
  if (error instanceof AppError) {
    res.status(error.status).json({ error: error.message });
    return;
  }
  if (
    error.message === "Некорректная коллекция" ||
    error.message === "Некорректный запрос" ||
    error.message === "Укажите пароль" ||
    error.message.startsWith("Укажите ") ||
    error.message.startsWith("Пароль ") ||
    error.message.startsWith("Выберите ") ||
    error.message.startsWith("Этот e-mail") ||
    error.message.startsWith("Можно загрузить")
  ) {
    res.status(400).json({ error: error.message });
    return;
  }
  console.error(error);
  res.status(500).json({ error: "Внутренняя ошибка сервера" });
}
