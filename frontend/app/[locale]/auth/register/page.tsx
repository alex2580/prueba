'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { OTPStep } from '@/components/auth/OTPStep';

export default function RegisterPage() {
  const t = useTranslations('auth');
  const router = useRouter();
  const { user, register, verifyOTP, reenviarOTP, loading, error, otpPending, otpEmailHint, otpCanales, emailConfirmPending, emailConfirmEmail } = useAuth();

  useEffect(() => {
    if (user) router.push('/panel');
  }, [user, router]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--r4)', overflow: 'hidden',
        width: 'min(440px, 100%)', boxShadow: 'var(--s5)',
      }}>
        <div style={{ height: 5, background: 'linear-gradient(90deg, var(--orange), var(--amber) 40%, var(--blue) 70%, var(--mint))' }} />
        <div style={{ padding: '2rem' }}>
          {emailConfirmPending ? (
            <div style={{ textAlign: 'center', padding: '.5rem 0' }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '.75rem' }}>📧</div>
              <h2 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.2rem', marginBottom: '.6rem' }}>
                Revisá tu email
              </h2>
              <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '.5rem' }}>
                Te enviamos un link de confirmación a{' '}
                <strong style={{ color: 'var(--text)' }}>{emailConfirmEmail}</strong>.
              </p>
              <p style={{ color: 'var(--text2)', fontSize: '.88rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Hacé clic en ese link para activar tu cuenta y acceder al código de verificación.
              </p>
              <p style={{ fontSize: '.78rem', color: 'var(--text3)' }}>
                ¿No llegó? Revisá la carpeta de spam.
              </p>
            </div>
          ) : !otpPending ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '1.8rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '.5rem' }}>🚀</div>
                <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: '1.4rem', marginBottom: '.25rem' }}>
                  {t('registerTitulo')}
                </h1>
                <p style={{ color: 'var(--text2)', fontSize: '.85rem' }}>{t('registerDesc')}</p>
              </div>
              <RegisterForm
                onRegister={register}
                onSwitch={() => router.push('/auth/login')}
                loading={loading}
                error={error}
              />
            </>
          ) : (
            <OTPStep
              emailHint={otpEmailHint}
              canales={otpCanales}
              onVerify={verifyOTP}
              onReenviar={reenviarOTP}
              loading={loading}
              error={error}
            />
          )}
        </div>
      </div>
    </div>
  );
}
