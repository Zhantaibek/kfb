export type Role = 'ADMIN' | 'TEACHER' | 'STUDENT';
export type UserStatus = 'ACTIVE' | 'BLOCKED';
export type CourseStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
export type CourseLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'REVIEWED' | 'LATE';

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  phone?: string | null;
}

export interface User {
  id: string;
  email: string;
  role: Role;
  status: UserStatus;
  createdAt: string;
  telegramChatId?: string | null;
  telegramUsername?: string | null;
  telegram2faEnabled?: boolean;
  profile?: Profile | null;
  coursesCount?: number;
  progress?: number;
  _count?: { enrollments?: number; taughtCourses?: number };
  enrollments?: Array<{
    id: string;
    progressPercent: number;
    course: { id: string; title: string; status: CourseStatus };
  }>;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  _count?: { courses: number };
}

export interface Lesson {
  id: string;
  title: string;
  contentType: string;
  content?: string | null;
  videoUrl?: string | null;
  fileUrl?: string | null;
  linkUrl?: string | null;
  videoUrls?: string[];
  imageUrls?: string[];
  durationMin: number;
  order: number;
  moduleId: string;
}

export interface Module {
  id: string;
  title: string;
  order: number;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl?: string | null;
  level: CourseLevel;
  durationHours: number;
  price: number | string;
  status: CourseStatus;
  rating: number;
  teacherId: string;
  categoryId: string;
  createdAt: string;
  teacher?: User;
  category?: Category;
  modules?: Module[];
  locked?: boolean;
  _count?: { enrollments: number; assignments?: number; reviews?: number };
}

export interface CourseReview {
  id: string;
  courseId: string;
  userId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface ChatContact {
  courseId: string;
  courseTitle: string;
  peer: User;
  teacher?: User;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  courseId: string;
  studentId: string;
  teacherId: string;
  lastMessageAt: string;
  createdAt: string;
  course?: { id: string; title: string };
  student?: User;
  teacher?: User;
  lastMessage?: ChatMessage | null;
  unreadCount?: number;
  messages?: ChatMessage[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline?: string | null;
  materialUrl?: string | null;
  courseId: string;
  course?: { id: string; title: string };
  creator?: User;
  submissions?: Submission[];
  _count?: { submissions: number };
  createdAt: string;
}

export interface Submission {
  id: string;
  status: SubmissionStatus;
  textAnswer?: string | null;
  fileUrl?: string | null;
  linkUrl?: string | null;
  grade?: number | null;
  comment?: string | null;
  submittedAt?: string | null;
  student?: User;
}

export interface Payment {
  id: string;
  amount: number | string;
  status: PaymentStatus;
  paymentMethod: string;
  createdAt: string;
  paidAt?: string | null;
  user?: User;
  course?: { id: string; title: string };
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  stats: {
    students: number;
    teachers: number;
    courses: number;
    activeCourses: number;
    completedCourses: number;
    revenue: number;
    newUsersMonth: number;
  };
  registrationChart: Array<{ month: string; count: number }>;
  salesChart: Array<{ month: string; total: number }>;
  popularCourses: Course[];
  recentUsers: User[];
  recentPayments: Payment[];
  activity: Array<{
    id: string;
    progressPercent: number;
    lastActivityAt?: string | null;
    user?: User;
    course?: { title: string };
  }>;
}

export interface Paginated<T> {
  success: boolean;
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
}
