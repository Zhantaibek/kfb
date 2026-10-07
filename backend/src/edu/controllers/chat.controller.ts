import type { Request, Response } from 'express';
import { chatService } from '../services/chat.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const chatController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const data = await chatService.list(req.user!);
    return sendSuccess(res, data);
  }),

  contacts: asyncHandler(async (req: Request, res: Response) => {
    const data = await chatService.contacts(req.user!);
    return sendSuccess(res, data);
  }),

  open: asyncHandler(async (req: Request, res: Response) => {
    const conversation = await chatService.open(req.user!, req.body);
    return sendSuccess(res, conversation, 201);
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const conversation = await chatService.get(String(req.params.id), req.user!);
    return sendSuccess(res, conversation);
  }),

  listMessages: asyncHandler(async (req: Request, res: Response) => {
    const after = typeof req.query.after === 'string' ? req.query.after : undefined;
    const messages = await chatService.listMessages(String(req.params.id), req.user!, after);
    return sendSuccess(res, messages);
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const message = await chatService.send(String(req.params.id), req.user!, req.body.body);
    return sendSuccess(res, message, 201);
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    const result = await chatService.markRead(String(req.params.id), req.user!);
    return sendSuccess(res, result);
  }),
};
