import { z } from 'zod3';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Пароль не менее 8 символов'),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.literal('STUDENT').optional().default('STUDENT'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const magicLinkRequestSchema = z.object({
  email: z.string().email(),
});

export const verifyMagicLinkSchema = z.object({
  token: z.string().min(16),
});

export const verifyEmailOtpSchema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/, 'Код из 6 цифр'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, 'Пароль не менее 8 символов'),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  status: z.string().optional(),
  role: z.string().optional(),
  categoryId: z.string().optional(),
  teacherId: z.string().optional(),
  level: z.string().optional(),
  courseId: z.string().optional(),
});

export const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().min(1).optional().nullable(),
  status: z.enum(['ACTIVE', 'BLOCKED']).optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  role: z.literal('STUDENT').optional().default('STUDENT'),
});

export const createTeacherSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
});

export const createCourseSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  coverUrl: z.string().url().optional().nullable(),
  categoryId: z.string().min(1),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
  durationHours: z.coerce.number().nonnegative().optional(),
  price: z.coerce.number().nonnegative(),
  teacherId: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const createCategorySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const createModuleSchema = z.object({
  title: z.string().min(2),
  order: z.coerce.number().int().positive().optional(),
});

export const updateModuleSchema = createModuleSchema.partial();

export const createLessonSchema = z.object({
  moduleId: z.string().min(1).optional(),
  title: z.string().min(2),
  contentType: z.enum(['VIDEO', 'TEXT', 'PDF', 'LINK', 'ASSIGNMENT', 'IMAGE']).optional(),
  content: z.string().optional(),
  videoUrl: z.string().min(1).optional().nullable(),
  fileUrl: z.string().min(1).optional().nullable(),
  linkUrl: z.string().min(1).optional().nullable(),
  videoUrls: z.array(z.string().min(1)).optional(),
  imageUrls: z.array(z.string().min(1)).optional(),
  durationMin: z.coerce.number().int().nonnegative().optional(),
  order: z.coerce.number().int().positive().optional(),
});

export const createVideoSchema = z
  .object({
    title: z.string().min(2),
    description: z.string().optional(),
    videoUrl: z.string().min(1).optional(),
    videoUrls: z.array(z.string().min(1)).optional(),
    imageUrls: z.array(z.string().min(1)).optional(),
    order: z.coerce.number().int().positive().optional(),
  })
  .refine((d) => Boolean(d.videoUrl) || Boolean(d.videoUrls?.length) || Boolean(d.imageUrls?.length), {
    message: 'Добавьте видео или фото',
  });

export const updateVideoSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  videoUrl: z.string().min(1).optional().nullable(),
  videoUrls: z.array(z.string().min(1)).optional(),
  imageUrls: z.array(z.string().min(1)).optional(),
  order: z.coerce.number().int().positive().optional(),
});

export const updateLessonSchema = createLessonSchema.partial().omit({ moduleId: true });

export const generateAssignmentSchema = z.object({
  topic: z.string().optional().default(''),
  program: z.string().optional().default(''),
});

export const createAssignmentSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().min(2),
  description: z.string().min(5),
  deadline: z.string().datetime().optional().nullable(),
  materialUrl: z.string().url().optional().nullable(),
});

export const updateAssignmentSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().min(5).optional(),
  deadline: z.string().datetime().optional().nullable(),
  materialUrl: z.string().url().optional().nullable(),
});

export const submitAssignmentSchema = z.object({
  textAnswer: z.string().optional(),
  fileUrl: z.string().url().optional().nullable(),
  linkUrl: z.string().url().optional().nullable(),
});

export const reviewSubmissionSchema = z.object({
  grade: z.coerce.number().int().min(0).max(100),
  comment: z.string().optional(),
});

export const createPaymentSchema = z.object({
  courseId: z.string().min(1),
  paymentMethod: z.enum(['CARD', 'PAYPAL', 'BANK_TRANSFER', 'MOCK', 'QR']).optional(),
  /** Mock only: force FAILED status (also triggered if cardLast4 ends with 0000) */
  simulateFail: z.boolean().optional(),
  cardLast4: z.string().regex(/^\d{4}$/).optional(),
});

export const enrollSchema = z.object({
  courseId: z.string().min(1),
});

export const completeLessonSchema = z.object({
  lessonId: z.string().min(1),
});

export const upsertCourseReviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().min(3, 'Напишите комментарий').max(2000),
});

export const sendMessageSchema = z.object({
  body: z.string().trim().min(1, 'Введите сообщение').max(4000),
});

export const openConversationSchema = z.object({
  courseId: z.string().min(1),
  studentId: z.string().min(1).optional(),
});
