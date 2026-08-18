import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  registerSchema,
  verifyRegistrationSchema,
  type IRegistrationPending,
  type LoginDTO,
  type RegisterDTO,
  type VerifyRegistrationDTO,
} from '@programme/contracts';
import { ArrowLeft, ArrowRight, MailCheck, RefreshCw, ShieldCheck, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { getApiMessage } from '../../../shared/api/axiosClient';
import { useAuthStore } from '../store';
import {
  useLogin,
  useRegister,
  useResendRegistrationOtp,
  useVerifyRegistration,
} from '../hooks/useAuth';

function LoginForm() {
  const mutation = useLogin();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginDTO>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const submit = (dto: LoginDTO) =>
    mutation.mutate(dto, {
      onSuccess: ({ user }) =>
        navigate(
          user.role === 'admin'
            ? '/admin'
            : ((location.state as { from?: string } | null)?.from ?? '/'),
          { replace: true },
        ),
    });
  return (
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      {mutation.isError && (
        <p className="form-alert" role="alert">
          {getApiMessage(mutation.error)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? (
          'Checking the list…'
        ) : (
          <>
            Enter Fetefolio <ArrowRight size={18} />
          </>
        )}
      </Button>
    </form>
  );
}
function OtpVerificationForm({
  registration,
  onBack,
}: {
  registration: IRegistrationPending;
  onBack: () => void;
}) {
  const { email } = registration;
  const verify = useVerifyRegistration();
  const resend = useResendRegistrationOtp();
  const navigate = useNavigate();
  const [resendAvailableAt, setResendAvailableAt] = useState(
    () => Date.now() + registration.resendAvailableInSeconds * 1000,
  );
  const [resendSeconds, setResendSeconds] = useState(registration.resendAvailableInSeconds);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VerifyRegistrationDTO>({
    resolver: zodResolver(verifyRegistrationSchema),
    defaultValues: { email, otp: '' },
  });
  const submit = (dto: VerifyRegistrationDTO) =>
    verify.mutate(dto, { onSuccess: () => navigate('/', { replace: true }) });

  useEffect(() => {
    const getRemainingSeconds = () =>
      Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
    setResendSeconds(getRemainingSeconds());
    const timer = window.setInterval(() => {
      const remainingSeconds = getRemainingSeconds();
      setResendSeconds(remainingSeconds);
      if (remainingSeconds === 0) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendAvailableAt]);

  const handleResend = () =>
    resend.mutate(
      { email },
      {
        onSuccess: (pending) =>
          setResendAvailableAt(Date.now() + pending.resendAvailableInSeconds * 1000),
      },
    );

  return (
    <div className="otp-step">
      <div className="otp-step__notice">
        <MailCheck aria-hidden="true" />
        <span>
          <strong>Check your inbox</strong>
          <small>We sent a six-digit code to {email}. It expires in 10 minutes.</small>
        </span>
      </div>
      <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
        <input type="hidden" {...register('email')} />
        <Input
          label="Verification code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          error={errors.otp?.message}
          {...register('otp', {
            onChange: (event) => {
              event.target.value = event.target.value.replace(/\D/g, '').slice(0, 6);
            },
          })}
        />
        {verify.isError && (
          <p className="form-alert" role="alert">
            {getApiMessage(verify.error)}
          </p>
        )}
        {resend.isError && (
          <p className="form-alert" role="alert">
            {getApiMessage(resend.error)}
          </p>
        )}
        {resend.isSuccess && (
          <p className="form-success" role="status">
            A fresh code is on its way.
          </p>
        )}
        <Button type="submit" disabled={verify.isPending}>
          {verify.isPending ? (
            'Verifying…'
          ) : (
            <>
              Verify and create account <ArrowRight size={18} />
            </>
          )}
        </Button>
      </form>
      <div className="otp-step__actions" aria-label="Verification code options">
        <button className="otp-action otp-action--change" type="button" onClick={onBack}>
          <ArrowLeft aria-hidden="true" />
          Change email
        </button>
        <button
          className="otp-action otp-action--resend"
          type="button"
          disabled={resend.isPending || resendSeconds > 0}
          onClick={handleResend}
        >
          <RefreshCw className={resend.isPending ? 'is-spinning' : ''} aria-hidden="true" />
          {resend.isPending
            ? 'Sending code…'
            : resendSeconds > 0
              ? `Resend in ${resendSeconds}s`
              : 'Resend OTP'}
        </button>
      </div>
    </div>
  );
}

function RegisterForm() {
  const mutation = useRegister();
  const [pendingRegistration, setPendingRegistration] = useState<IRegistrationPending | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterDTO>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const submit = (dto: RegisterDTO) =>
    mutation.mutate(dto, { onSuccess: (pending) => setPendingRegistration(pending) });
  if (pendingRegistration)
    return (
      <OtpVerificationForm
        registration={pendingRegistration}
        onBack={() => {
          mutation.reset();
          setPendingRegistration(null);
        }}
      />
    );
  return (
    <form className="auth-form" onSubmit={handleSubmit(submit)} noValidate>
      <Input
        label="Your name"
        autoComplete="name"
        error={errors.name?.message}
        {...register('name')}
      />
      <Input
        label="Email address"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Create password"
        type="password"
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <p className="field-hint">8+ characters, with an uppercase letter and a number.</p>
      {mutation.isError && (
        <p className="form-alert" role="alert">
          {getApiMessage(mutation.error)}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? (
          'Sending verification code…'
        ) : (
          <>
            Continue with email <ArrowRight size={18} />
          </>
        )}
      </Button>
    </form>
  );
}

export function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const user = useAuthStore((state) => state.user);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;
  const login = mode === 'login';
  return (
    <section className="auth-page">
      <div className="auth-story">
        <span className="auth-ticket-icon">
          <Ticket />
        </span>
        <span className="eyebrow">YOUR INVITATION</span>
        <h1>Every remarkable gathering starts with a good list.</h1>
        <p>
          Find considered people and places for the day you have in mind — then keep every booking
          together in Fetefolio.
        </p>
        <div className="auth-trust">
          <ShieldCheck />
          <span>
            <strong>Thoughtful, secure booking</strong>
            <small>Your dates and total are always verified by the server.</small>
          </span>
        </div>
      </div>
      <div className="auth-panel">
        <div className="auth-panel__head">
          <span className="eyebrow">{login ? 'WELCOME BACK' : 'RESERVE YOUR PLACE'}</span>
          <h2>{login ? 'Pick up where you left off.' : 'Create your guest account.'}</h2>
          <p>
            {login
              ? 'Sign in to see your bookings or manage your call sheet.'
              : 'One account keeps your dates, totals and confirmations together.'}
          </p>
        </div>
        {login ? <LoginForm /> : <RegisterForm />}
        <p className="auth-switch">
          {login ? 'New to Fetefolio?' : 'Already on the list?'}{' '}
          <Link to={login ? '/register' : '/login'}>{login ? 'Create an account' : 'Sign in'}</Link>
        </p>
      </div>
    </section>
  );
}
