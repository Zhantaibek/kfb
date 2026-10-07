import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '../../utils/zodResolver';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import { PageHeader, Card, Avatar } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput, Textarea } from '../../components/ui/Input';
import { fullName, getErrorMessage } from '../../utils';

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Введите текущий пароль'),
    newPassword: z.string().min(8, 'Новый пароль не менее 8 символов'),
    confirmPassword: z.string().min(1, 'Повторите новый пароль'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  })
  .refine((v) => v.currentPassword !== v.newPassword, {
    message: 'Новый пароль должен отличаться от текущего',
    path: ['newPassword'],
  });

type PasswordForm = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const fetchMe = useAuthStore((s) => s.fetchMe);
  const isStudent = user?.role === 'STUDENT';
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
    defaultValues: {
      firstName: user?.profile?.firstName ?? '',
      lastName: user?.profile?.lastName ?? '',
      phone: user?.profile?.phone ?? '',
      bio: user?.profile?.bio ?? '',
      avatarUrl: user?.profile?.avatarUrl ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const avatarUrl = form.watch('avatarUrl');

  const onSubmit = async (values: {
    firstName: string;
    lastName: string;
    phone: string;
    bio: string;
    avatarUrl: string;
  }) => {
    if (!user) return;
    try {
      await api.patch(`/students/${user.id}`, {
        ...values,
        avatarUrl: values.avatarUrl || null,
      });
      await fetchMe();
      toast.success('Профиль обновлён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onChangePassword = async (values: PasswordForm) => {
    try {
      await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      toast.success('Пароль изменён');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const onAvatarFile = async (file: File | undefined) => {
    if (!file || !user) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Выберите изображение (jpg, png, webp, gif)');
      return;
    }
    setUploadingAvatar(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { data } = await api.post('/media/upload', body);
      const url = String(data.data.url);
      form.setValue('avatarUrl', url, { shouldDirty: true });
      await api.patch(`/students/${user.id}`, { avatarUrl: url });
      await fetchMe();
      toast.success('Фото загружено');
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearAvatar = async () => {
    if (!user) return;
    form.setValue('avatarUrl', '', { shouldDirty: true });
    try {
      await api.patch(`/students/${user.id}`, { avatarUrl: null });
      await fetchMe();
      toast.success('Фото удалено');
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className={isStudent ? 'mx-auto max-w-6xl px-4 py-8 sm:px-6' : undefined}>
      <PageHeader title={isStudent ? 'Профиль' : 'Настройки'} description="Профиль и безопасность" />
      <div className="grid max-w-2xl gap-4">
        <Card className="p-6">
          <p className="mb-4 text-sm text-kse-muted">
            Email для входа: <span className="font-semibold text-ink dark:text-white">{user?.email}</span>
          </p>
          <form className="grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="sm:col-span-2 flex flex-wrap items-center gap-4">
              <Avatar
                name={fullName(user) || 'Профиль'}
                src={avatarUrl || user?.profile?.avatarUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1 space-y-2">
                <p className="text-sm font-medium text-ink dark:text-white">Фото профиля</p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={uploadingAvatar}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploadingAvatar ? 'Загрузка…' : 'Загрузить фото'}
                  </Button>
                  {(avatarUrl || user?.profile?.avatarUrl) && (
                    <Button type="button" variant="ghost" disabled={uploadingAvatar} onClick={() => void clearAvatar()}>
                      Удалить
                    </Button>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => void onAvatarFile(e.target.files?.[0])}
                />
              </div>
            </div>
            <Input label="Имя" {...form.register('firstName')} />
            <Input label="Фамилия" {...form.register('lastName')} />
            <Input label="Телефон" {...form.register('phone')} />
            <div className="sm:col-span-2">
              <Textarea label="О себе" {...form.register('bio')} />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Сохранить</Button>
            </div>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="font-display text-lg font-bold text-ink dark:text-white">Смена пароля</h2>
          <p className="mt-1 text-sm text-kse-muted">
            После смены используйте новый пароль при следующем входе.
          </p>
          <form className="mt-5 grid gap-4" onSubmit={passwordForm.handleSubmit(onChangePassword)}>
            <PasswordInput
              label="Текущий пароль"
              autoComplete="current-password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword')}
            />
            <PasswordInput
              label="Новый пароль"
              autoComplete="new-password"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword')}
            />
            <PasswordInput
              label="Повтор нового пароля"
              autoComplete="new-password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword')}
            />
            <div>
              <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
                {passwordForm.formState.isSubmitting ? 'Сохранение…' : 'Изменить пароль'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
