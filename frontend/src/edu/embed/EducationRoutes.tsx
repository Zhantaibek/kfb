import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../router/ProtectedRoute';
import { DashboardPage } from '../pages/Dashboard/DashboardPage';
import { StudentsPage, StudentDetailPage } from '../pages/Students/StudentsPage';
import { TeachersPage } from '../pages/Teachers/TeachersPage';
import { CoursesPage } from '../pages/Courses/CoursesPage';
import { CourseDetailPage } from '../pages/Courses/CourseDetailPage';
import { CategoriesPage } from '../pages/Categories/CategoriesPage';
import { AssignmentsPage } from '../pages/Assignments/AssignmentsPage';
import { PaymentsPage } from '../pages/Payments/PaymentsPage';
import { AnalyticsPage } from '../pages/Analytics/AnalyticsPage';
import { SettingsPage } from '../pages/Settings/SettingsPage';
import { MessagesPage } from '../pages/Messages/MessagesPage';
import { useEducation } from './EducationContext';

/**
 * Relative route tree for the education section.
 * Mount under host: <Route path="/education/*" element={<EducationApp ... />} />
 * Or use inside standalone AppRouter.
 */
export function EducationRoutes() {
  const { path } = useEducation();

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to={path('dashboard')} replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="messages/:id" element={<MessagesPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN', 'TEACHER']} />}>
            <Route path="students" element={<StudentsPage />} />
            <Route path="students/:id" element={<StudentDetailPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN']} />}>
            <Route path="teachers" element={<TeachersPage />} />
            <Route path="categories" element={<CategoriesPage />} />
          </Route>
          <Route path="courses" element={<CoursesPage />} />
          <Route path="courses/:id" element={<CourseDetailPage />} />
          <Route path="assignments" element={<AssignmentsPage />} />
          <Route element={<ProtectedRoute roles={['ADMIN', 'STUDENT']} />}>
            <Route path="payments" element={<PaymentsPage />} />
          </Route>
          <Route element={<ProtectedRoute roles={['ADMIN', 'TEACHER']} />}>
            <Route path="analytics" element={<AnalyticsPage />} />
          </Route>
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to={path('dashboard')} replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
