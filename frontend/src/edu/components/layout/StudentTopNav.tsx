import { NavLink, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { useAuthStore } from '../../store/authStore';
import { useEducation } from '../../embed/EducationContext';
import { fullName, cn } from '../../utils';
import toast from 'react-hot-toast';
import heroPhoto from '../../assets/student-hero.jpg';

const items = [
  { path: 'messages', label: 'Сообщения' },
  { path: 'dashboard', label: 'Обучение' },
  { path: 'assignments', label: 'Задания' },
  { path: 'payments', label: 'Оплаты' },
  { path: 'settings', label: 'Профиль' },
];

export function StudentTopNav() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { onLogout: hostLogout, path } = useEducation();
  const navigate = useNavigate();
  const name = fullName(user);
  const short =
    user?.profile?.firstName && user?.profile?.lastName
      ? `${user.profile.firstName} ${user.profile.lastName.slice(0, 1)}.`
      : name;

  return (
    <header className="sticky top-3 z-30 px-3 pb-2">
      <div className="kse-chrome mx-auto flex h-16 max-w-[1480px] items-center gap-4 px-4 sm:px-5">
        <BrandLogo className="shrink-0" />
        <nav className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto">
          {items.map((item) => (
            <NavLink
              key={item.path}
              to={path(item.path)}
              end={item.path === 'dashboard'}
              className={({ isActive }) =>
                cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition',
                  isActive ? 'bg-brand-50 text-brand-800' : 'text-kse-muted hover:bg-brand-50/70 hover:text-ink',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      isActive ? 'bg-brand-400' : 'bg-kse-border',
                    )}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          className="hidden shrink-0 text-sm font-medium text-ink sm:block"
          onClick={() => navigate('/settings')}
        >
          {short}
        </button>
        <button
          type="button"
          className="text-xs font-medium text-kse-muted hover:text-ink"
          onClick={() => {
            if (hostLogout) {
              hostLogout();
              return;
            }
            logout();
            toast.success('Вы вышли из системы');
            navigate('/login');
          }}
        >
          Выйти
        </button>
      </div>
    </header>
  );
}

export function StudentHero({ title = 'Учебный центр КФБ' }: { title?: string }) {
  return (
    <div className="student-hero relative h-44 overflow-hidden sm:h-52">
      <img
        src={heroPhoto.src}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
      />
      <div className="student-hero-overlay pointer-events-none absolute inset-0" />
      <div className="relative mx-auto flex h-full max-w-6xl items-end px-4 pb-7 sm:px-6">
        <h1 className="font-display text-3xl font-semibold tracking-[-0.045em] text-white drop-shadow-sm sm:text-4xl">
          {title}
        </h1>
      </div>
    </div>
  );
}

export function StudentPage({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</div>;
}
