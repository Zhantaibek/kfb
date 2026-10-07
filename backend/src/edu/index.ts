import { Router } from "express";
import { eduBridge } from "./bridge.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import eduRoutes from "./routes/index.js";

/** API учебного центра внутри бэкенда сайта: /api/edu/… (раньше — отдельный сервер на :4100). */
export const eduApi = Router();
eduApi.use(eduBridge);
eduApi.use(eduRoutes);
eduApi.use(notFoundHandler);
eduApi.use(errorHandler);
