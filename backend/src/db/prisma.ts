import { AsyncLocalStorage } from "node:async_hooks";
import { PrismaClient, type Prisma } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const client =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = client;
}

const activeTransaction = new AsyncLocalStorage<Prisma.TransactionClient>();

/**
 * Общий клиент базы. Внутри inTransaction() те же вызовы (prisma.news.update и т.д.) идут в открытую
 * транзакцию — репозиториям не нужно передавать клиент параметром.
 */
export const prisma = new Proxy(client, {
  get(target, property) {
    const source = (activeTransaction.getStore() ?? target) as unknown as Record<PropertyKey, unknown>;
    const value = source[property];
    return typeof value === "function" ? (value as (...args: unknown[]) => unknown).bind(source) : value;
  },
}) as PrismaClient;

/** Всё внутри fn — одна транзакция: при ошибке откатываются все записи. Вложенный вызов использует внешнюю. */
export function inTransaction<T>(fn: () => Promise<T>): Promise<T> {
  if (activeTransaction.getStore()) return fn();
  return client.$transaction((tx) => activeTransaction.run(tx, fn), { timeout: 15_000 });
}
