import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  PanelLeftClose,
  PanelLeft,
  Power,
  ChevronDown,
  Settings,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import type { NotificationItem } from '../../types';
import { Avatar } from '../ui/Card';
import { fullName, formatDate } from '../../utils';
import { cn } from '../../utils';
import { useEducation } from '../../embed/EducationContext';

const roleLabel: Record<string, string> = {
  ADMIN: 'Администратор',
  TEACHER: 'Преподаватель',
  STUDENT: 'Ученик',
};

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { onLogout: hostLogout } = useEducation();
  const { toggleSidebar, setMobileSidebar, sidebarCollapsed, theme, toggleTheme } = useUiStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  const displayName = fullName(user) || user?.email || 'Пользователь';
  const handle = user?.email ? `@${user.email.split('@')[0]}` : '';
  const role = roleLabel[user?.role ?? ''] ?? user?.role ?? '';

  const loadNotifications = () =>
    api
      .get('/notifications')
      .then(({ data }) => {
        setNotifications(data.data.items);
        setUnread(data.data.unreadCount);
      })
      .catch(() => {
        /* ignore */
      });

  useEffect(() => {
    void loadNotifications();
    const id = setInterval(() => void loadNotifications(), 30000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!notifOpen && !profileOpen) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (notifOpen && notifRef.current && !notifRef.current.contains(target)) {
        setNotifOpen(false);
      }
      if (profileOpen && profileRef.current && !profileRef.current.contains(target)) {
        setProfileOpen(false);
      }
    };
    // click, не mousedown — иначе пункт меню может размонтироваться до перехода
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [notifOpen, profileOpen]);

  const markAll = async () => {
    await api.post('/notifications/read-all');
    await loadNotifications();
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
  };

  const onLogout = () => {
    setProfileOpen(false);
    // Внутри сайта сессия общая — выход делает сайт.
    if (hostLogout) {
      hostLogout();
      return;
    }
    logout();
    toast.success('Вы вышли из системы');
    navigate('/login');
  };

  const iconBtn =
    'rounded-xl p-2 text-kse-muted transition hover:bg-kse-surface hover:text-ink dark:hover:bg-border-dark dark:hover:text-white';

  return (
    <header className="sticky top-3 z-20 px-3 pb-2">
      <div className="kse-chrome mx-auto flex h-16 items-center gap-3 px-4 sm:px-5">
      <button type="button" className={`${iconBtn} lg:hidden`} onClick={() => setMobileSidebar(true)}>
        <Menu size={18} />
      </button>
      <button type="button" className={`${iconBtn} hidden lg:inline-flex`} onClick={toggleSidebar}>
        {sidebarCollapsed ? <PanelLeft size={18} /> : <PanelLeftClose size={18} />}
      </button>

      <form onSubmit={onSearch} className="relative hidden min-w-0 flex-1 md:block max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-kse-gray" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={user?.role === 'STUDENT' ? 'Найти курс…' : 'Поиск курсов…'}
          className="h-10 w-full rounded-xl border border-kse-border bg-kse-surface/80 pl-9 pr-3 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-400/20 dark:bg-panel-dark dark:border-border-dark dark:focus:bg-panel-dark"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        <button type="button" className={iconBtn} onClick={toggleTheme} aria-label="Тема">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            type="button"
            className={`relative ${iconBtn}`}
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-panel dark:ring-panel-dark">
                {unread}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-2xl border border-kse-border bg-panel shadow-xl dark:bg-panel-dark dark:border-border-dark animate-fade-up">
              <div className="flex items-center justify-between border-b border-kse-border px-4 py-3 dark:border-border-dark">
                <span className="text-sm font-semibold">Уведомления</span>
                <button
                  type="button"
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                  onClick={() => void markAll()}
                >
                  Прочитать все
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="px-4 py-10 text-center text-sm text-kse-muted">Пока тихо</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`border-b border-kse-border/60 px-4 py-3 dark:border-border-dark ${n.isRead ? 'opacity-65' : 'bg-brand-50/40 dark:bg-brand-900/20'}`}
                    >
                      <div className="text-sm font-medium">{n.title}</div>
                      <div className="mt-0.5 text-xs text-kse-muted">{n.message}</div>
                      <div className="mt-1 text-[11px] text-kse-gray">{formatDate(n.createdAt)}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className={cn(
              'flex items-center gap-2.5 rounded-2xl border border-kse-border/80 bg-kse-surface/90 py-1.5 pl-1.5 pr-2.5 text-left transition',
              'hover:border-brand-300 hover:bg-brand-50/60',
              'dark:border-white/10 dark:bg-white/[0.06] dark:hover:border-white/20 dark:hover:bg-white/[0.1]',
              profileOpen && 'border-brand-300 bg-brand-50/80 dark:border-white/20 dark:bg-white/[0.12]',
            )}
          >
            <Avatar name={displayName} src={user?.profile?.avatarUrl} size="sm" />
            <span className="hidden min-w-0 leading-tight sm:block">
              <span className="block truncate text-sm font-semibold tracking-tight text-ink dark:text-white">
                {displayName}
              </span>
              <span className="block truncate text-[11px] text-kse-muted dark:text-kse-gray">{role}</span>
            </span>
            <ChevronDown
              size={14}
              className={cn(
                'hidden text-kse-muted transition sm:block dark:text-kse-gray',
                profileOpen && 'rotate-180',
              )}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-kse-border bg-panel shadow-[0_16px_40px_-16px_rgba(30,44,50,0.45)] dark:border-white/10 dark:bg-[#152428] dark:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] animate-fade-up">
              <div className="px-4 py-3.5">
                <div className="truncate text-sm font-bold tracking-tight text-ink dark:text-white">
                  {displayName}
                </div>
                {handle && (
                  <div className="mt-0.5 truncate text-xs text-kse-muted dark:text-kse-gray">{handle}</div>
                )}
              </div>

              <div className="border-t border-kse-border dark:border-white/10">
                <Link
                  to="/settings"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink transition hover:bg-kse-surface dark:text-white dark:hover:bg-white/[0.06]"
                  onClick={() => setProfileOpen(false)}
                >
                  <Settings size={16} className="shrink-0 text-kse-muted dark:text-kse-gray" />
                  Настройки
                </Link>
              </div>

              <div className="border-t border-kse-border dark:border-white/10">
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-ink transition hover:bg-kse-surface dark:text-white dark:hover:bg-white/[0.06]"
                  onClick={onLogout}
                >
                  <Power size={16} className="shrink-0 text-kse-muted dark:text-kse-gray" />
                  Выйти
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </header>
  );
}
