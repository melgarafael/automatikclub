import type {
  LessonContext,
  ThreadMessage,
  AIResponseResult,
  AIResponderConfig,
} from "../types";
import { DEFAULT_AI_CONFIG } from "../types";

// ── System prompt builder ──

function buildSystemPrompt(
  config: AIResponderConfig,
  lessonContext: LessonContext
): string {
  const tagList =
    lessonContext.tags.length > 0
      ? `Tags: ${lessonContext.tags.join(", ")}`
      : "";

  return `${config.ai_system_prompt}

--- CONTEXTO DA AULA ---
Titulo: ${lessonContext.title}
${lessonContext.description ? `Descricao: ${lessonContext.description}` : ""}
${tagList}
${lessonContext.content_md ? `\nConteudo da aula:\n${lessonContext.content_md.slice(0, 3000)}` : ""}
--- FIM DO CONTEXTO ---

Regras:
- Responda SOMENTE sobre o conteudo da aula ou topicos diretamente relacionados.
- Se a pergunta nao tem relacao com a aula, diga educadamente que nao pode ajudar com esse topico.
- Nao invente informacoes. Se nao souber, diga que vai verificar.
- Use formatacao Markdown quando apropriado (listas, negrito, codigo).
- Maximo 500 tokens na resposta.`;
}

// ── Thread context formatter ──

function formatThreadHistory(threadHistory: ThreadMessage[]): string {
  if (threadHistory.length === 0) return "";

  return threadHistory
    .map((msg) => {
      const role = msg.is_ai_response ? "Tutor IA" : msg.author_name;
      return `[${role}]: ${msg.content}`;
    })
    .join("\n\n");
}

// ── Confidence check ──
// Returns null if the response seems uncertain or off-topic

function checkConfidence(response: string): "high" | "medium" | "low" | null {
  const uncertainPhrases = [
    "nao tenho certeza",
    "nao sei responder",
    "nao consigo ajudar",
    "fora do meu escopo",
    "nao tenho informacao suficiente",
    "nao posso responder",
  ];

  const lowerResponse = response.toLowerCase();
  const hasUncertainty = uncertainPhrases.some((phrase) =>
    lowerResponse.includes(phrase)
  );

  if (hasUncertainty) return null;
  if (response.length < 50) return "low";
  if (response.length < 150) return "medium";
  return "high";
}

// ── Core response generator ──
// Placeholder implementation: returns a well-formatted template response.
// Actual Claude API integration is a deployment concern (requires ANTHROPIC_API_KEY).

export async function generateResponse(
  lessonContext: LessonContext,
  commentContent: string,
  threadHistory: ThreadMessage[],
  config?: Partial<AIResponderConfig>
): Promise<AIResponseResult | null> {
  const mergedConfig = { ...DEFAULT_AI_CONFIG, ...config };

  // Build the full prompt context (ready for Claude API)
  const _systemPrompt = buildSystemPrompt(mergedConfig, lessonContext);
  const _threadContext = formatThreadHistory(threadHistory);

  // ── Placeholder response ──
  // In production, this would call the Claude API:
  //
  //   const anthropic = new Anthropic();
  //   const message = await anthropic.messages.create({
  //     model: mergedConfig.ai_model,
  //     max_tokens: 500,
  //     system: systemPrompt,
  //     messages: [
  //       ...threadHistory.map(m => ({
  //         role: m.is_ai_response ? "assistant" : "user",
  //         content: m.content,
  //       })),
  //       { role: "user", content: commentContent },
  //     ],
  //   });

  const placeholderResponse = buildPlaceholderResponse(
    lessonContext,
    commentContent
  );

  const confidence = checkConfidence(placeholderResponse);

  if (confidence === null) {
    return null;
  }

  return {
    content: placeholderResponse,
    model: mergedConfig.ai_model,
    confidence,
  };
}

// ── Placeholder response builder ──

function buildPlaceholderResponse(
  lessonContext: LessonContext,
  commentContent: string
): string {
  const isQuestion =
    commentContent.includes("?") ||
    commentContent.toLowerCase().startsWith("como") ||
    commentContent.toLowerCase().startsWith("por que") ||
    commentContent.toLowerCase().startsWith("o que");

  if (isQuestion) {
    return `Otima pergunta! Baseado no conteudo da aula **"${lessonContext.title}"**, posso te ajudar com isso.

${lessonContext.tags.length > 0 ? `Esse topico esta relacionado com ${lessonContext.tags.slice(0, 3).join(", ")}. ` : ""}A resposta envolve entender alguns conceitos fundamentais que foram abordados na aula.

Recomendo revisar a secao principal da aula e, se a duvida persistir, poste novamente com mais detalhes sobre o ponto especifico que ficou confuso. Estou aqui para ajudar!`;
  }

  return `Obrigado pela contribuicao! Seu comentario sobre **"${lessonContext.title}"** e muito relevante.

${lessonContext.tags.length > 0 ? `Esse e um ponto importante dentro de ${lessonContext.tags[0]}. ` : ""}Continue engajando com o conteudo e compartilhando suas experiencias com a comunidade.

Se tiver alguma duvida adicional sobre o tema, pode perguntar aqui mesmo!`;
}
