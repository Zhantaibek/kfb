import type { Request, Response } from "express";
import { z } from "zod";
import { search } from "./search.service";

const searchQuery = z.object({
  q: z.string().trim().max(120).catch(""),
  limit: z.coerce.number().int().min(1).max(100).catch(5),
});

/** GET /api/public/search?q=&limit= — поиск по всему сайту, результаты по группам. */
export async function getSearch(req: Request, res: Response) {
  const { q, limit } = searchQuery.parse(req.query);
  res.json(await search(q, limit));
}
