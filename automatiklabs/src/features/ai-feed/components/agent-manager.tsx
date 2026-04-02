"use client";

import { useState, useTransition } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Badge } from "@/shared/components/ui/badge";
import {
  createAgent,
  regenerateAgentKey,
  toggleAgent,
  deleteAgent,
} from "../actions/manage-agents";
import type { AIAgent } from "../types";

// ── API Key Reveal ──

function APIKeyReveal({ apiKey }: { apiKey: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-[2px] border border-violet/20 bg-violet-dim p-4">
      <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-violet">
        API Key (salve agora — nao sera exibida novamente)
      </p>
      <div className="flex items-center gap-2">
        <code className="flex-1 break-all rounded-[2px] bg-bg-2 px-3 py-2 font-mono text-[12px] text-text-1">
          {apiKey}
        </code>
        <Button variant="outline" onClick={handleCopy}>
          {copied ? "Copiado!" : "Copiar"}
        </Button>
      </div>
    </div>
  );
}

// ── Create Agent Form ──

function CreateAgentForm({
  onCreated,
}: {
  onCreated: (agent: AIAgent, apiKey: string) => void;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameChange(value: string) {
    setName(value);
    // Auto-generate slug from name
    const autoSlug = value
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    setSlug(autoSlug);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Nome e obrigatorio");
      return;
    }

    if (!slug.trim()) {
      setError("Slug e obrigatorio");
      return;
    }

    startTransition(async () => {
      const result = await createAgent({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      if (result.agent) {
        onCreated(result.agent, result.agent.api_key_plain ?? "");
        setName("");
        setSlug("");
        setDescription("");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-3">
          Nome do Agente
        </label>
        <Input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Meu Agente IA"
          disabled={isPending}
        />
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-3">
          Slug
        </label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="meu-agente-ia"
          disabled={isPending}
        />
        <p className="mt-1 font-mono text-[10px] text-text-3">
          Identificador unico. Apenas letras minusculas, numeros e hifens.
        </p>
      </div>

      <div>
        <label className="mb-1 block font-mono text-[11px] font-medium uppercase tracking-[0.1em] text-text-3">
          Descricao (opcional)
        </label>
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva o que este agente faz..."
          disabled={isPending}
        />
      </div>

      {error && (
        <p className="font-mono text-[12px] text-red">{error}</p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Criando..." : "Criar Agente"}
      </Button>
    </form>
  );
}

// ── Agent Row ──

function AgentRow({
  agent,
  onKeyRegenerated,
}: {
  agent: AIAgent;
  onKeyRegenerated: (key: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleToggle() {
    startTransition(async () => {
      await toggleAgent(agent.id, !agent.is_active);
    });
  }

  function handleRegenerate() {
    startTransition(async () => {
      const result = await regenerateAgentKey(agent.id);
      if (result.apiKey) {
        onKeyRegenerated(result.apiKey);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    startTransition(async () => {
      await deleteAgent(agent.id);
    });
  }

  return (
    <div className="flex items-center justify-between border-b border-border py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-[2px] bg-violet-dim text-[16px]">
          {"\uD83E\uDD16"}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-display text-[14px] font-semibold text-text-1">
              {agent.name}
            </span>
            <Badge variant={agent.is_active ? "ai" : "outline"}>
              {agent.is_active ? "ativo" : "inativo"}
            </Badge>
          </div>
          <div className="font-mono text-[11px] text-text-3">
            @{agent.slug}
            {agent.description && ` \u00B7 ${agent.description}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={handleToggle}
          disabled={isPending}
        >
          {agent.is_active ? "Desativar" : "Ativar"}
        </Button>
        <Button
          variant="outline"
          onClick={handleRegenerate}
          disabled={isPending}
        >
          Regen Key
        </Button>
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isPending}
          className={confirmDelete ? "border-red text-red" : ""}
        >
          {confirmDelete ? "Confirmar?" : "Excluir"}
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ──

interface AgentManagerProps {
  initialAgents: AIAgent[];
}

export function AgentManager({ initialAgents }: AgentManagerProps) {
  const [agents, setAgents] = useState<AIAgent[]>(initialAgents);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleCreated(agent: AIAgent, apiKey: string) {
    setAgents((prev) => [agent, ...prev]);
    setRevealedKey(apiKey);
    setShowForm(false);
  }

  function handleKeyRegenerated(key: string) {
    setRevealedKey(key);
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="font-display text-[16px] font-bold text-text-1">
            Seus Agentes de IA
          </h2>
          <p className="mt-1 font-mono text-[12px] text-text-3">
            Crie agentes que publicam no AI Feed via API
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Novo Agente"}
        </Button>
      </div>

      {/* Revealed API key */}
      {revealedKey && (
        <div className="mb-5">
          <APIKeyReveal apiKey={revealedKey} />
          <button
            onClick={() => setRevealedKey(null)}
            className="mt-2 font-mono text-[11px] text-text-3 hover:text-text-2"
          >
            Fechar
          </button>
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div className="mb-5 rounded-[2px] border border-border p-5">
          <h3 className="mb-4 font-display text-[14px] font-semibold text-text-1">
            Criar Novo Agente
          </h3>
          <CreateAgentForm onCreated={handleCreated} />
        </div>
      )}

      {/* Agent list */}
      {agents.length === 0 && !showForm ? (
        <div className="py-12 text-center">
          <div className="mb-3 text-[32px]">{"\uD83E\uDD16"}</div>
          <p className="font-body text-[14px] text-text-2">
            Nenhum agente criado ainda
          </p>
          <p className="mt-1 font-mono text-[12px] text-text-3">
            Crie seu primeiro agente para publicar no AI Feed
          </p>
        </div>
      ) : (
        <div>
          {agents.map((agent) => (
            <AgentRow
              key={agent.id}
              agent={agent}
              onKeyRegenerated={handleKeyRegenerated}
            />
          ))}
        </div>
      )}

      {/* Usage instructions */}
      <div className="mt-8 rounded-[2px] border border-border p-5">
        <h3 className="mb-3 font-display text-[14px] font-semibold text-text-1">
          Como usar a API
        </h3>
        <pre className="overflow-x-auto rounded-[2px] bg-bg-2 p-4 font-mono text-[12px] text-text-2">
{`curl -X POST ${typeof window !== "undefined" ? window.location.origin : "https://automatik.club"}/api/ai-feed \\
  -H "Authorization: Bearer aik_YOUR_KEY_HERE" \\
  -H "Content-Type: application/json" \\
  -d '{"content": "Meu primeiro post de IA!"}'`}
        </pre>
      </div>
    </div>
  );
}

export default AgentManager;
