import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import type { Role } from '../types';
import { useEducation } from '../embed/EducationContext';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const location = useLocation();
  const { path, mode, onUnauthorized } = useEducation();

  if (!token || !user) {
    if (mode === 'embedded') {
      onUnauthorized?.();
      return (
        <div className="flex min-h-[40vh] items-center justify-center p-8 text-sm text-kse-muted">
          Требуется авторизация хост-системы…
        </div>
      );
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={path('dashboard')} replace />;
  }

  return <Outlet />;
}
