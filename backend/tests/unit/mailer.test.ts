import { sendWithResend } from '../../src/shared/config/mailer.js';

describe('Resend email delivery', () => {
  it('sends mail through the HTTPS API with bearer authentication', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(new Response(null, { status: 200 }));

    await sendWithResend(
      { to: 'guest@example.com', subject: 'Verify', text: 'Code: 123456' },
      'resend-test-key',
      fetcher,
    );

    expect(fetcher).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer resend-test-key' }),
        body: expect.stringContaining('guest@example.com'),
      }),
    );
  });

  it('rejects unsuccessful email API responses', async () => {
    const fetcher = jest
      .fn<ReturnType<typeof fetch>, Parameters<typeof fetch>>()
      .mockResolvedValue(new Response(null, { status: 403 }));

    await expect(
      sendWithResend(
        { to: 'guest@example.com', subject: 'Verify', text: 'Code: 123456' },
        'resend-test-key',
        fetcher,
      ),
    ).rejects.toThrow('HTTP 403');
  });
});
