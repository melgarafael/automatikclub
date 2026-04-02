'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { CheckEmailResponse } from '../types';

interface EmailGateProps {
  onAuthenticated: (email: string, isStudent: boolean) => void;
  onNewLead: (email: string) => void;
}

export function EmailGate({ onAuthenticated, onNewLead }: EmailGateProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Digite um email valido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/free-content/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao verificar email');
      }

      const data: CheckEmailResponse = await res.json();

      if (data.status === 'student') {
        onAuthenticated(trimmed, true);
      } else if (data.status === 'lead') {
        onAuthenticated(trimmed, false);
      } else {
        onNewLead(trimmed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-2 border-border bg-bg-raised p-6 rounded-[2px] shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue mb-1">
        // ACESSE O CONTEUDO
      </p>
      <p className="font-body text-[13px] text-text-2 mb-5">
        Digite seu email para continuar
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          autoFocus
        />

        {error && (
          <p className="font-body text-[12px] text-[#EF5350]">{error}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Verificando...' : 'Continuar →'}
        </Button>
      </form>
    </div>
  );
}
