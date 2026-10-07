import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import type { ChatContact, ChatMessage, Conversation } from '../../types';
import { PageHeader, Avatar, EmptyState, Skeleton } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { fullName, getErrorMessage } from '../../utils';
import { useAuthStore } from '../../store/authStore';

function formatTime(value?: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export function MessagesPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [active, setActive] = useState<Conversation | null>(null);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);
  const bootstrapped = useRef(false);

  const peerOf = (c: Conversation) => (user?.role === 'STUDENT' ? c.teacher : c.student);

  const loadConversations = async () => {
    const { data } = await api.get('/messages/conversations');
    setConversations(data.data.items);
    return data.data.items as Conversation[];
  };

  const loadContacts = async () => {
    const { data } = await api.get('/messages/contacts');
    setContacts(data.data);
  };

  const openConversation = async (courseId: string, studentId?: string) => {
    const { data } = await api.post('/messages/conversations', { courseId, studentId });
    await loadConversations();
    navigate(`/messages/${data.data.id}`);
    setShowNew(false);
  };

  // Состояние обновляем в колбэках ответа: soft — догрузка новых сообщений при опросе раз в 3 секунды.
  const loadThread = (conversationId: string, soft = false): Promise<void> => {
    if (!soft) {
      return api.get(`/messages/conversations/${conversationId}`).then(({ data }) => {
        setActive(data.data);
        setMessages(data.data.messages ?? []);
        lastIdRef.current = data.data.messages?.at(-1)?.id ?? null;
        void loadConversations();
      });
    }
    const after = lastIdRef.current;
    return api
      .get(`/messages/conversations/${conversationId}/messages`, { params: after ? { after } : undefined })
      .then(({ data }) => {
        const incoming = data.data as ChatMessage[];
        if (!incoming.length) return;
        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const next = [...prev];
          for (const m of incoming) {
            if (!known.has(m.id)) next.push(m);
          }
          return next;
        });
        lastIdRef.current = incoming[incoming.length - 1]?.id ?? lastIdRef.current;
        void loadConversations();
      });
  };

  useEffect(() => {
    // loading изначально true — включать его здесь не нужно.
    const boot = async () => {
      try {
        await Promise.all([loadConversations(), loadContacts()]);
        const courseId = searchParams.get('courseId');
        const studentId = searchParams.get('studentId') ?? undefined;
        if (courseId && !bootstrapped.current) {
          bootstrapped.current = true;
          await openConversation(courseId, studentId);
        }
      } catch (e) {
        toast.error(getErrorMessage(e));
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  // Закрыли диалог (в адресе нет id) — очищаем его прямо в рендере, без лишнего прохода эффекта.
  const [threadFor, setThreadFor] = useState(id);
  if (threadFor !== id) {
    setThreadFor(id);
    if (!id) {
      setActive(null);
      setMessages([]);
    }
  }

  useEffect(() => {
    if (!id) {
      lastIdRef.current = null;
      return;
    }
    void loadThread(id).catch((e) => toast.error(getErrorMessage(e)));
    const tick = setInterval(() => {
      void loadThread(id, true).catch(() => undefined);
    }, 3000);
    return () => clearInterval(tick);
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, id]);

  useEffect(() => {
    const tick = setInterval(() => {
      void loadConversations().catch(() => undefined);
    }, 8000);
    return () => clearInterval(tick);
  }, []);

  const send = async () => {
    if (!id || !body.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/conversations/${id}/messages`, { body: body.trim() });
      setMessages((prev) => [...prev, data.data]);
      lastIdRef.current = data.data.id;
      setBody('');
      void loadConversations();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSending(false);
    }
  };

  if (loading) return <Skeleton className="h-[70vh]" />;

  return (
    <div
      className={
        user?.role === 'STUDENT'
          ? 'flex h-[calc(100vh-3.5rem)] flex-col'
          : '-mx-4 -my-6 flex h-[calc(100vh-4rem)] flex-col sm:-mx-6 lg:-mx-8'
      }
    >
      <div className="border-b border-kse-border px-4 py-3 dark:border-border-dark sm:px-6">
        <PageHeader
          title="Сообщения"
          description={
            user?.role === 'STUDENT'
              ? 'Переписка с преподавателями ваших курсов'
              : 'Переписка со студентами ваших курсов'
          }
          actions={
            <Button size="sm" variant="secondary" onClick={() => setShowNew((v) => !v)}>
              {showNew ? 'Закрыть' : 'Новый диалог'}
            </Button>
          }
        />
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[320px_1fr]">
        <aside className="flex min-h-0 flex-col border-b border-kse-border dark:border-border-dark lg:border-b-0 lg:border-r">
          {showNew && (
            <div className="max-h-56 overflow-y-auto border-b border-kse-border p-3 dark:border-border-dark">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-kse-muted">Кому написать</p>
              {contacts.length === 0 ? (
                <p className="text-sm text-kse-muted">
                  {user?.role === 'STUDENT'
                    ? 'Сначала купите или запишитесь на курс'
                    : 'Пока нет студентов на ваших курсах'}
                </p>
              ) : (
                <div className="space-y-1">
                  {contacts.map((c) => (
                    <button
                      key={`${c.courseId}-${c.peer.id}`}
                      type="button"
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-kse-surface dark:hover:bg-border-dark/50"
                      onClick={() =>
                        void openConversation(
                          c.courseId,
                          user?.role === 'STUDENT' ? undefined : c.peer.id,
                        )
                      }
                    >
                      <Avatar name={fullName(c.peer)} src={c.peer.profile?.avatarUrl} size="sm" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{fullName(c.peer)}</div>
                        <div className="truncate text-xs text-kse-muted">{c.courseTitle}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {conversations.length === 0 ? (
              <EmptyState
                title="Нет диалогов"
                description="Начните переписку с преподавателем или студентом"
              />
            ) : (
              conversations.map((c) => {
                const peer = peerOf(c);
                const selected = c.id === id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => navigate(`/messages/${c.id}`)}
                    className={`mb-1 flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                      selected
                        ? 'bg-brand-50 ring-1 ring-brand-200 dark:bg-brand-900/30 dark:ring-brand-700'
                        : 'hover:bg-kse-surface dark:hover:bg-border-dark/50'
                    }`}
                  >
                    <Avatar name={fullName(peer)} src={peer?.profile?.avatarUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-semibold">{fullName(peer)}</span>
                        {(c.unreadCount ?? 0) > 0 && (
                          <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-bold text-white">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="truncate text-xs text-kse-muted">{c.course?.title}</div>
                      <div className="mt-0.5 truncate text-xs text-kse-gray">
                        {c.lastMessage?.body ?? 'Нет сообщений'}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col bg-kse-surface/40 dark:bg-border-dark/20">
          {!id || !active ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
              <MessageCircle className="text-brand-400" size={36} />
              <p className="text-sm text-kse-muted">Выберите диалог или начните новый</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-kse-border bg-panel px-4 py-3 dark:border-border-dark dark:bg-panel-dark">
                <Avatar
                  name={fullName(peerOf(active))}
                  src={peerOf(active)?.profile?.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0">
                  <div className="truncate font-semibold">{fullName(peerOf(active))}</div>
                  <Link
                    to={`/courses/${active.courseId}`}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    {active.course?.title}
                  </Link>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => {
                  const mine = m.senderId === user?.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                          mine
                            ? 'bg-brand-500 text-white'
                            : 'bg-panel text-ink dark:bg-panel-dark dark:text-white'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        <div
                          className={`mt-1 text-[10px] ${mine ? 'text-white/70' : 'text-kse-muted'}`}
                        >
                          {formatTime(m.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              <form
                className="flex gap-2 border-t border-kse-border bg-panel p-3 dark:border-border-dark dark:bg-panel-dark"
                onSubmit={(e) => {
                  e.preventDefault();
                  void send();
                }}
              >
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Напишите сообщение…"
                  className="h-11 flex-1 rounded-xl border border-kse-border bg-white px-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 dark:border-border-dark dark:bg-panel-dark dark:text-white"
                />
                <Button type="submit" disabled={sending || !body.trim()}>
                  <Send size={16} />
                  Отправить
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
