'use client';

import { SiteHeader } from '@/components/ui/SiteHeader';
import { ContactoForm } from '@/components/contacto/ContactoForm';

export default function ContactoPage() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <SiteHeader />

      <div style={{ flex: 1 }}>
        <div style={{ maxWidth: 560, margin: '0 auto', padding: '3rem 1.5rem 4rem' }}>
          <h1 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', marginBottom: '.5rem', color: 'var(--text)' }}>
            💬 Contactanos
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '.95rem', marginBottom: '2rem' }}>
            Consultas, reclamos o sugerencias. Te respondemos a la brevedad.
          </p>

          <ContactoForm />
        </div>
      </div>
    </div>
  );
}
