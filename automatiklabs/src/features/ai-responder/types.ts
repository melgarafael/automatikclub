// ── AI Responder Configuration ──

export interface AIResponderConfig {
  ai_auto_reply_enabled: boolean;
  ai_auto_reply_delay_minutes: number;
  ai_model: string;
  ai_system_prompt: string;
}

export interface LessonContext {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  content_md: string | null;
}

export interface ThreadMessage {
  id: string;
  content: string;
  author_name: string;
  is_ai_response: boolean;
  created_at: string;
}

export interface AIResponseResult {
  content: string;
  model: string;
  confidence: "high" | "medium" | "low";
}

export type TriggerAIResponseState = {
  error?: string;
  success?: boolean;
  response?: string;
};

export type ConfigureAIState = {
  error?: string;
  success?: boolean;
};

export const DEFAULT_AI_CONFIG: AIResponderConfig = {
  ai_auto_reply_enabled: false,
  ai_auto_reply_delay_minutes: 30,
  ai_model: "claude-sonnet-4-20250514",
  ai_system_prompt: `Voce e um tutor educacional da AutomatikClub, uma plataforma de ensino sobre IA e monetizacao digital. Responda de forma clara, didatica e encorajadora. Use exemplos praticos quando possivel. Se nao tiver certeza sobre algo, diga que vai verificar. Mantenha respostas concisas (maximo 3 paragrafos).`,
};
