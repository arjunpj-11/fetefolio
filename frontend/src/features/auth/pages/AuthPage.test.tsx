import type { IRegistrationPending } from '@programme/contracts';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthPage } from './AuthPage';

const pendingRegistration: IRegistrationPending = {
  email: 'guest@example.com',
  expiresInSeconds: 600,
  resendAvailableInSeconds: 60,
};

const authMocks = vi.hoisted(() => ({
  register: {
    isPending: false,
    isError: false,
    mutate: vi.fn(),
    reset: vi.fn(),
  },
  resend: { isPending: false, isError: false, isSuccess: false, mutate: vi.fn() },
  verify: { isPending: false, isError: false, mutate: vi.fn() },
  login: { isPending: false, isError: false, mutate: vi.fn() },
}));

vi.mock('../hooks/useAuth', () => ({
  useRegister: () => authMocks.register,
  useResendRegistrationOtp: () => authMocks.resend,
  useVerifyRegistration: () => authMocks.verify,
  useLogin: () => authMocks.login,
}));

vi.mock('../store', () => ({ useAuthStore: () => null }));

describe('AuthPage OTP actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows a resend cooldown and lets the user return to change their email', async () => {
    authMocks.register.mutate.mockImplementationOnce(
      (_dto: unknown, options: { onSuccess: (pending: IRegistrationPending) => void }) =>
        options.onSuccess(pendingRegistration),
    );

    render(
      <MemoryRouter>
        <AuthPage mode="register" />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Your name'), { target: { value: 'Guest User' } });
    fireEvent.change(screen.getByLabelText('Email address'), {
      target: { value: pendingRegistration.email },
    });
    fireEvent.change(screen.getByLabelText('Create password'), {
      target: { value: 'Programme123' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue with email/i }));

    const resendButton = await screen.findByRole('button', { name: 'Resend in 60s' });
    expect(resendButton).toBeDisabled();
    expect(resendButton).toHaveClass('otp-action--resend');

    fireEvent.click(screen.getByRole('button', { name: 'Change email' }));
    expect(authMocks.register.reset).toHaveBeenCalledOnce();
    expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  });

  it('shows friendly validation messages for empty login fields', async () => {
    render(
      <MemoryRouter>
        <AuthPage mode="login" />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: /Enter Fetefolio/i }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
    expect(screen.getByText('Enter your password')).toBeInTheDocument();
  });
});
