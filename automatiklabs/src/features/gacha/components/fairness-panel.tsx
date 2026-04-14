"use client";

import { useState, useTransition } from "react";
import { cn } from "@/shared/utils";
import { RarityBadge } from "./rarity-badge";
import {
  verifyFairnessAction,
  rotateSeedAction,
  getFairnessHistoryAction,
} from "../actions/verify-fairness";
import type { FairnessRecord, FairnessVerification } from "../types";

// -- Sub-components --

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <code className="block break-all rounded bg-muted px-2 py-1 font-mono text-xs text-foreground">
        {value}
      </code>
    </div>
  );
}

function VerificationDetail({
  verification,
}: {
  verification: FairnessVerification;
}) {
  return (
    <div className="space-y-3 rounded border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="font-mono text-sm font-medium">
          Verificacao do Pull
        </h4>
        <span
          className={cn(
            "rounded px-2 py-0.5 font-mono text-[10px] font-bold uppercase",
            verification.verified
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-amber-500/10 text-amber-500"
          )}
        >
          {verification.verified ? "VERIFICAVEL" : "SEED ATIVA"}
        </span>
      </div>

      <CodeBlock label="Server Seed Hash" value={verification.serverSeedHash} />
      <CodeBlock label="Nonce" value={String(verification.nonce)} />

      {verification.serverSeed && (
        <CodeBlock label="Server Seed (revelada)" value={verification.serverSeed} />
      )}
      {verification.clientSeed && (
        <CodeBlock label="Client Seed" value={verification.clientSeed} />
      )}

      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Resultado:</span>
        <RarityBadge rarity={verification.resultRarity} />
      </div>

      <p className="text-xs text-muted-foreground">{verification.message}</p>
    </div>
  );
}

// -- Main Panel --

interface FairnessPanelProps {
  className?: string;
}

export function FairnessPanel({ className }: FairnessPanelProps) {
  const [records, setRecords] = useState<FairnessRecord[]>([]);
  const [verification, setVerification] =
    useState<FairnessVerification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadHistory() {
    startTransition(async () => {
      setError(null);
      const result = await getFairnessHistoryAction(20);
      if (result.error) {
        setError(result.error);
      } else {
        setRecords(result.records ?? []);
        setLoaded(true);
      }
    });
  }

  function handleVerify(pullId: string) {
    startTransition(async () => {
      setError(null);
      setVerification(null);
      const result = await verifyFairnessAction(pullId);
      if (result.error) {
        setError(result.error);
      } else if (result.verification) {
        setVerification(result.verification);
      }
    });
  }

  function handleRotateSeed() {
    startTransition(async () => {
      setError(null);
      const result = await rotateSeedAction();
      if (result.error) {
        setError(result.error);
      } else {
        // Reload history to show newly revealed seeds
        const histResult = await getFairnessHistoryAction(20);
        if (histResult.records) setRecords(histResult.records);
      }
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="space-y-1">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider">
          Provably Fair
        </h3>
        <p className="text-xs text-muted-foreground">
          Cada pull usa HMAC-SHA256 para garantir que o resultado nao pode ser
          manipulado. Rotacione sua seed para revelar a seed anterior e
          verificar pulls passados.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!loaded && (
          <button
            onClick={loadHistory}
            disabled={isPending}
            className="rounded bg-primary px-3 py-1.5 font-mono text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Carregando..." : "Ver Historico"}
          </button>
        )}
        <button
          onClick={handleRotateSeed}
          disabled={isPending}
          className="rounded border border-border bg-card px-3 py-1.5 font-mono text-xs font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Rotacionar Seed
        </button>
      </div>

      {/* Error */}
      {error && (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      )}

      {/* Verification detail */}
      {verification && <VerificationDetail verification={verification} />}

      {/* History table */}
      {loaded && records.length > 0 && (
        <div className="overflow-x-auto rounded border border-border">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-border bg-muted/50">
              <tr>
                <th className="px-3 py-2">Item</th>
                <th className="px-3 py-2">Raridade</th>
                <th className="px-3 py-2">Nonce</th>
                <th className="px-3 py-2">Seed Hash</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {records.map((r) => (
                <tr key={r.pullId} className="border-b border-border/50">
                  <td className="px-3 py-2">{r.itemName}</td>
                  <td className="px-3 py-2">
                    <RarityBadge rarity={r.rarity} showStars={false} />
                  </td>
                  <td className="px-3 py-2 tabular-nums">{r.nonce}</td>
                  <td className="max-w-[120px] truncate px-3 py-2 text-muted-foreground">
                    {r.serverSeedHash.slice(0, 16)}...
                  </td>
                  <td className="px-3 py-2">
                    {r.serverSeed ? (
                      <span className="text-emerald-500">Revelada</span>
                    ) : (
                      <span className="text-amber-500">Ativa</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => handleVerify(r.pullId)}
                      disabled={isPending}
                      className="text-primary underline-offset-2 hover:underline disabled:opacity-50"
                    >
                      Verificar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loaded && records.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nenhum pull encontrado. Faca seu primeiro pull na Forja!
        </p>
      )}

      {/* How it works */}
      <details className="group">
        <summary className="cursor-pointer font-mono text-xs font-medium text-muted-foreground hover:text-foreground">
          Como verificar?
        </summary>
        <div className="mt-2 space-y-2 rounded border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
          <p>
            <strong>1.</strong> Antes de cada pull, o hash da server seed (SHA-256) e
            registrado no seu historico.
          </p>
          <p>
            <strong>2.</strong> Ao rotacionar a seed, a server seed anterior e revelada.
          </p>
          <p>
            <strong>3.</strong> Voce pode verificar que:{" "}
            <code className="rounded bg-muted px-1">
              SHA256(server_seed) == server_seed_hash
            </code>
          </p>
          <p>
            <strong>4.</strong> O resultado do pull foi determinado por:{" "}
            <code className="rounded bg-muted px-1">
              HMAC_SHA256(server_seed, client_seed + &quot;:&quot; + nonce)
            </code>
          </p>
          <p>
            Isso garante que nem voce nem o servidor puderam manipular o resultado
            apos o hash ser publicado.
          </p>
        </div>
      </details>
    </div>
  );
}
