'use client';

import { useEffect, useState, useCallback } from 'react';
import { EmailGate } from './email-gate';
import { LeadRegistration } from './lead-registration';
import type { Lead, UnlockResponse } from '../types';

type GateState = 'loading' | 'email' | 'register' | 'unlocking' | 'authenticated';

interface ContentGateProps {
  slug: string;
  unlockKey: string | undefined;
  children: React.ReactNode;
}

function hasActiveSession(): boolean {
  return document.cookie.split(';').some(c => c.trim().startsWith('fc_active='));
}

export function ContentGate({ slug, unlockKey, children }: ContentGateProps) {
  const [state, setState] = useState<GateState>('loading');
  const [pendingEmail, setPendingEmail] = useState('');
  const [coinsEarned, setCoinsEarned] = useState(0);
  const [error, setError] = useState('');

  const unlock = useCallback(async () => {
    setState('unlocking');
    try {
      const res = await fetch('/api/free-content/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, key: unlockKey }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao desbloquear');
      }

      const data: UnlockResponse = await res.json();
      setCoinsEarned(data.coinsEarned);
      setState('authenticated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
      setState('email');
    }
  }, [slug, unlockKey]);

  useEffect(() => {
    if (hasActiveSession()) {
      unlock();
    } else {
      setState('email');
    }
  }, [unlock]);

  function handleAuthenticated() {
    unlock();
  }

  function handleNewLead(email: string) {
    setPendingEmail(email);
    setState('register');
  }

  function handleRegistered(_lead: Lead) {
    unlock();
  }

  if (state === 'loading' || state === 'unlocking') {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 animate-pulse">
          // {state === 'loading' ? 'VERIFICANDO SESSAO' : 'DESBLOQUEANDO'}...
        </p>
      </div>
    );
  }

  if (state === 'email') {
    return (
      <div className="flex flex-col items-center py-8">
        {error && (
          <p className="font-body text-[12px] text-[#EF5350] mb-4">{error}</p>
        )}
        <div className="w-full max-w-[400px]">
          <EmailGate
            onAuthenticated={handleAuthenticated}
            onNewLead={handleNewLead}
          />
        </div>
      </div>
    );
  }

  if (state === 'register') {
    return (
      <div className="flex flex-col items-center py-8">
        <div className="w-full max-w-[400px]">
          <LeadRegistration
            email={pendingEmail}
            onRegistered={handleRegistered}
          />
        </div>
      </div>
    );
  }

  // authenticated
  return (
    <div>
      {coinsEarned > 0 && (
        <div className="border-2 border-border bg-bg-raised rounded-[2px] px-4 py-3 mb-4 flex items-center gap-2 shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
          <span className="text-[16px]">🪙</span>
          <p className="font-mono text-[13px] text-cyan">
            +{coinsEarned} coins desbloqueados!
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
