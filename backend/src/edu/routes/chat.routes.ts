import { Router } from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { openConversationSchema, sendMessageSchema } from '../validators/index.js';

const messagesRouter = Router();

messagesRouter.use(authenticate);
messagesRouter.get('/conversations', chatController.list);
messagesRouter.get('/contacts', chatController.contacts);
messagesRouter.post('/conversations', validate(openConversationSchema), chatController.open);
messagesRouter.get('/conversations/:id', chatController.get);
messagesRouter.get('/conversations/:id/messages', chatController.listMessages);
messagesRouter.post('/conversations/:id/messages', validate(sendMessageSchema), chatController.send);
messagesRouter.post('/conversations/:id/read', chatController.markRead);

export { messagesRouter };
