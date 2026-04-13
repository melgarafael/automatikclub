"use server";

import { verifyPull, rotateSeed, getUserFairnessHistory } from "../services/fairness-engine";
import { verifyFairnessSchema, rotateSeedSchema } from "../schemas";
import type {
  FairnessVerification,
  SeedRotationResult,
  FairnessRecord,
} from "../types";

// -- Verify a single pull --

export type VerifyFairnessResult = {
  verification?: FairnessVerification;
  error?: string;
};

export async function verifyFairnessAction(
  pullId: string
): Promise<VerifyFairnessResult> {
  const parsed = verifyFairnessSchema.safeParse({ pullId });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Input invalido" };
  }

  try {
    const verification = await verifyPull(parsed.data.pullId);
    return { verification };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao verificar pull",
    };
  }
}

// -- Rotate seed --

export type RotateSeedResult = {
  result?: SeedRotationResult;
  error?: string;
};

export async function rotateSeedAction(): Promise<RotateSeedResult> {
  // No input needed, but validate shape for consistency
  const parsed = rotateSeedSchema.safeParse({});
  if (!parsed.success) {
    return { error: "Input invalido" };
  }

  try {
    const result = await rotateSeed();
    return { result };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao rotacionar seed",
    };
  }
}

// -- Get fairness history --

export type FairnessHistoryResult = {
  records?: FairnessRecord[];
  error?: string;
};

export async function getFairnessHistoryAction(
  limit?: number
): Promise<FairnessHistoryResult> {
  try {
    const records = await getUserFairnessHistory(limit);
    return { records };
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erro ao buscar historico",
    };
  }
}
