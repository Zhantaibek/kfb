import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '../../utils/zodResolver';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { AuthShell } from '../../components/auth/AuthShell';
import { CheckEmailSent } from '../../components/auth/CheckEmailSent';
import { Button } from '../../components/ui/Button';
import { Input, PasswordInput } from '../../components/ui/Input';
import { getErrorMessage } from '../../utils';
import { EDU_ASSETS } from '../../config';

const schema = z
  .object({
    firstName: z.string().min(1, 'Укажите имя'),
    lastName: z.string().min(1, 'Укажите фамилию'),
    email: z.string().email('Некорректный email'),
    password: z.string().min(8, 'Пароль не менее 8 символов'),
    confirmPassword: z.string().min(1, 'Повторите пароль'),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword'],
  });

type FormValues = z.infer<typeof schema>;

export function RegisterPage() {
  const registerUser = useAuthStore((s) => s.register);
  const requestMagicLink = useAuthStore((s) => s.requestMagicLink);
  const verifyEmailOtp = useAuthStore((s) => s.verifyEmailOtp);
  const navigate = useNavigate();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [resending, setResending] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const email = values.email.trim().toLowerCase();
      const result = await registerUser({
        email,
        password: values.password,
        firstName: values.firstName,
        lastName: values.lastName,
        role: 'STUDENT',
      });
      if (!result.delivered) {
        toast.success('Аккаунт создан. Войдите с паролем — письмо на почту не ушло.');
        navigate('/login');
        return;
      }
      setSentEmail(email);
      setSent(true);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const onResend = async () => {
    setResending(true);
    try {
      const result = await requestMagicLink(sentEmail);
      if (!result.delivered) {
        toast.error('Письмо не ушло на почту.');
        return;
      }
      toast.success('Код отправлен на почту');
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell wide>
      {!sent && (
        <div className="mb-7 text-center sm:text-left">
          <img
            src={`${EDU_ASSETS}kse-logo.png`}
            alt="Кыргызская фондовая биржа"
            className="mx-auto mb-4 h-11 w-auto max-w-[260px] object-contain sm:mx-0"
          />
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-ink dark:text-white">
            Создайте аккаунт
          </h1>
          <p className="mt-1.5 text-sm text-kse-muted dark:text-kse-gray">
            После регистрации пришлём код для входа на email
          </p>
        </div>
      )}

      {sent ? (
        <CheckEmailSent
          email={sentEmail}
          title="Подтвердите email"
          description={
            <>
              Аккаунт создан. Введите код, чтобы войти как{' '}
              <span className="font-semibold text-ink dark:text-white">{sentEmail}</span>
            </>
          }
          resending={resending}
          onVerifyCode={async (code) => {
            try {
              await verifyEmailOtp(sentEmail, code);
              toast.success('Добро пожаловать');
              navigate('/dashboard');
            } catch (error) {
              toast.error(getErrorMessage(error));
            }
          }}
          onResend={onResend}
          onChangeEmail={() => {
            setSent(false);
            setValue('email', sentEmail);
          }}
        />
      ) : (
        <form className="grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
          <Input label="Имя" autoFocus error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Фамилия" error={errors.lastName?.message} {...register('lastName')} />
          <div className="sm:col-span-2">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>
          <PasswordInput
            label="Пароль"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordInput
            label="Повтор пароля"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <div className="sm:col-span-2">
            <Button className="w-full" size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Создаём…' : 'Зарегистрироваться'}
            </Button>
          </div>
        </form>
      )}

      {!sent && (
        <p className="mt-6 text-center text-sm text-kse-muted">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Войти
          </Link>
        </p>
      )}
    </AuthShell>
  );
}
