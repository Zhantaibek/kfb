import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FolderTree,
  CreditCard,
  ClipboardCheck,
  MessageCircle,
  UserRound,
  House,
  X,
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { useEducation } from '../../embed/EducationContext';
import { cn } from '../../utils';

const allItems = [
  { path: 'dashboard', label: 'Обзор', studentLabel: 'Главная', icon: LayoutDashboard, studentIcon: House, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { path: 'students', label: 'Студенты', icon: Users, roles: ['ADMIN', 'TEACHER'] },
  { path: 'teachers', label: 'Преподаватели', icon: GraduationCap, roles: ['ADMIN'] },
  { path: 'courses', label: 'Курсы', studentLabel: 'Мои курсы', icon: BookOpen, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { path: 'categories', label: 'Категории', icon: FolderTree, roles: ['ADMIN'] },
  { path: 'assignments', label: 'Задания', icon: ClipboardCheck, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { path: 'messages', label: 'Сообщения', icon: MessageCircle, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
  { path: 'payments', label: 'Оплаты', icon: CreditCard, roles: ['ADMIN', 'STUDENT'] },
  { path: 'settings', label: 'Профиль', icon: UserRound, roles: ['STUDENT'] },
];

export function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const { sidebarCollapsed, mobileSidebarOpen, setMobileSidebar } = useUiStore();
  const { path } = useEducation();
  const role = user?.role ?? 'STUDENT';
  const isStudent = role === 'STUDENT';
  const items = allItems.filter((i) => i.roles.includes(role));

  const content = (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-[var(--card-border)] bg-panel/80 backdrop-blur-xl dark:bg-panel-dark/85 dark:border-border-dark',
        sidebarCollapsed ? 'w-[76px]' : 'w-64',
      )}
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-kse-border px-4 dark:border-border-dark">
        <BrandLogo collapsed={sidebarCollapsed} />
        <button
          type="button"
          className="rounded-lg p-1.5 text-kse-muted hover:bg-kse-surface dark:hover:bg-border-dark lg:hidden"
          onClick={() => setMobileSidebar(false)}
        >
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-3">
        {items.map((item) => {
          const to = path(item.path);
          const Icon = isStudent && item.studentIcon ? item.studentIcon : item.icon;
          const label = isStudent && item.studentLabel ? item.studentLabel : item.label;
          return (
            <NavLink
              key={item.path}
              to={to}
              end={item.path === 'dashboard'}
              onClick={() => setMobileSidebar(false)}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition duration-200',
                  isActive
                    ? 'nav-active-rail bg-brand-50 text-brand-700 dark:bg-brand-800/35 dark:text-brand-200'
                    : 'text-kse-muted hover:bg-kse-surface hover:text-ink dark:text-kse-gray dark:hover:bg-border-dark/50 dark:hover:text-white',
                  sidebarCollapsed && 'justify-center px-2',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={18}
                    className={cn(
                      'shrink-0 transition',
                      isActive ? 'text-brand-500' : 'text-kse-gray group-hover:text-brand-500',
                    )}
                  />
                  {!sidebarCollapsed && <span>{label}</span>}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {!sidebarCollapsed && (
        <div className="border-t border-kse-border p-3 dark:border-border-dark">
          <div className="rounded-xl bg-gradient-to-br from-brand-50 to-brand-100/60 px-3 py-2.5 dark:from-brand-900/40 dark:to-brand-800/20">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-300">
              {isStudent ? 'Кабинет ученика' : 'Учебный центр КФБ'}
            </div>
            <div className="mt-0.5 text-xs text-kse-muted dark:text-kse-gray">
              {isStudent ? 'Курсы · задания · прогресс' : 'Курсы · биржа · квалификация'}
            </div>
          </div>
        </div>
      )}
    </aside>
  );

  return (
    <>
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-30 lg:flex">{content}</div>
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileSidebar(false)} />
          <div className="absolute inset-y-0 left-0 shadow-2xl">{content}</div>
        </div>
      )}
    </>
  );
}
