'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

// global-error kendi <html>/<body> tag'ını sağlamalı (root layout bypass edilir)
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, sans-serif',
          backgroundColor: '#0a0a0a',
          color: '#fafafa',
          display: 'flex',
          minHeight: '100vh',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          gap: '1rem',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'rgba(239,68,68,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <AlertTriangle style={{ width: 32, height: 32, color: '#ef4444' }} />
        </div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>
          Kritik bir hata oluştu
        </h1>
        <p style={{ color: '#a1a1aa', maxWidth: 400, margin: 0 }}>
          Uygulama beklenmedik bir hatayla karşılaştı. Lütfen sayfayı yenileyin.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: '0.5rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.6rem 1.4rem',
            borderRadius: 9999,
            backgroundColor: '#dfff00',
            color: '#050505',
            fontWeight: 600,
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.95rem'
          }}
        >
          <RefreshCw style={{ width: 16, height: 16 }} />
          Tekrar Dene
        </button>
        {error.digest && (
          <p style={{ fontSize: '0.75rem', color: '#52525b', margin: 0 }}>
            Hata kodu: {error.digest}
          </p>
        )}
      </body>
    </html>
  );
}
