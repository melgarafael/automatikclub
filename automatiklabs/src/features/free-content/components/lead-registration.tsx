'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import type { Lead } from '../types';

interface LeadRegistrationProps {
  email: string;
  onRegistered: (lead: Lead) => void;
}

export function LeadRegistration({ email, onRegistered }: LeadRegistrationProps) {
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Digite seu nome');
      return;
    }
    if (!whatsapp.trim() || whatsapp.trim().length < 10) {
      setError('Digite um WhatsApp valido');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/free-content/register-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name.trim(),
          whatsapp: whatsapp.trim().replace(/\D/g, ''),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao registrar');
      }

      const data = await res.json();
      onRegistered(data.lead);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="border-2 border-border bg-bg-raised p-6 rounded-[2px] shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-blue mb-1">
        // COMPLETE SEU CADASTRO
      </p>
      <p className="font-body text-[13px] text-text-2 mb-5">
        Preencha para desbloquear o conteudo
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-1 block">
            Email
          </label>
          <p className="font-mono text-[13px] text-text-2 bg-bg-inset border-2 border-border rounded-[2px] px-3 py-[6px]">
            {email}
          </p>
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-1 block">
            Nome
          </label>
          <Input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading}
            autoFocus
          />
        </div>

        <div>
          <label className="font-mono text-[10px] uppercase tracking-[0.1em] text-text-3 mb-1 block">
            WhatsApp
          </label>
          <Input
            type="tel"
            placeholder="Ex: 11999998888"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            disabled={loading}
          />
        </div>

        {error && (
          <p className="font-body text-[12px] text-[#EF5350]">{error}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Registrando...' : 'Desbloquear Conteudo →'}
        </Button>
      </form>
    </div>
  );
}
