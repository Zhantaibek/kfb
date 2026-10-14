import type { Request, Response } from "express";
import { requireSession } from "../auth/auth.service";
import { createRequest, getAdminData, getIssuerData, getPublicContent, mutateCollection } from "./cms.service";
import type { MutableCollection } from "../../validation/cms";
import { readIssuerDisclosures } from "../../db/repositories/cms.repository";

export async function readAdminData(req: Request, res: Response) {
  requireSession(req);
  res.json(await getAdminData());
}

export async function writeAdminData(req: Request, res: Response) {
  const session = requireSession(req);
  res.json(await mutateCollection(session, req.body ?? {}));
}

export function createCollectionItem(collection: MutableCollection) {
  return async (req: Request, res: Response) => {
    const session = requireSession(req);
    res.status(201).json(
      await mutateCollection(session, {
        op: "create",
        collection,
        item: req.body ?? {},
      }),
    );
  };
}

export function updateCollectionItem(collection: MutableCollection) {
  return async (req: Request, res: Response) => {
    const session = requireSession(req);
    res.json(
      await mutateCollection(session, {
        op: "update",
        collection,
        id: req.params.id,
        item: req.body ?? {},
      }),
    );
  };
}

export function deleteCollectionItem(collection: MutableCollection) {
  return async (req: Request, res: Response) => {
    const session = requireSession(req);
    res.json(
      await mutateCollection(session, {
        op: "delete",
        collection,
        id: req.params.id,
      }),
    );
  };
}

export async function readPublicContent(_req: Request, res: Response) {
  res.json(await getPublicContent());
}

export async function readIssuerData(_req: Request, res: Response) {
  res.json(await getIssuerData());
}

/** Существенные факты эмитента для страницы /disclosure/<slug>. */
export async function readIssuerDisclosureList(req: Request, res: Response) {
  const slug = String(req.params.slug ?? "").slice(0, 160);
  res.json({ items: await readIssuerDisclosures(slug) });
}

export async function postRequest(req: Request, res: Response) {
  const body = req.body as { source: string; payload: Record<string, string> };
  await createRequest(body.source, body.payload);
  res.json({ ok: true });
}

