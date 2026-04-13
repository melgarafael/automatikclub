---
name: opportunity-research
description: Pesquisa oportunidades lucrativas resolvíveis com IA. Descobre, avalia e documenta oportunidades em formato Obsidian para alimentar o pipeline de criação de trilhas do AutomatikLabs.
---

# Opportunity Research

Pesquisa autônoma de oportunidades de negócio resolvíveis com IA, com output direto no Obsidian vault.

## Input

O usuário fornece um direcionamento em linguagem natural como argumento:

```
/opportunity-research encontre oportunidades para quem domina Claude Code em 2026
```

Se o direction estiver vazio, peça ao usuário para fornecer uma direção de pesquisa.

## Workflow

### Phase 1: Pipeline (Deterministic)

Rode o pipeline Python para fazer web search via Firecrawl e vault enrichment via ripgrep:

```bash
cd /Users/rafaelmelgaco/educational-team/tools/opportunity-research && uv run python -m opportunity_research.pipeline "<DIRECTION>" config.yaml
```

O pipeline imprime o run directory path na última linha (`Run directory: .runs/<timestamp>`). Leia-o para saber onde está o `pipeline_output.json`.

**Pré-requisito:** a variável `FIRECRAWL_API_KEY` deve estar definida no ambiente. Se não estiver, informe o usuário:
> Defina FIRECRAWL_API_KEY no seu ambiente antes de rodar. Obtenha em https://firecrawl.dev

Se o pipeline retornar 0 resultados, informe que a busca não encontrou resultados para essa direção e sugira termos alternativos.

### Phase 2: Score & Deep Dive (Qualitative — YOU do this)

Agora VOCÊ (o Claude que executa esta skill) faz o trabalho qualitativo:

1. **Leia** o `pipeline_output.json` do run directory.

2. **Avalie** CADA oportunidade nas 9 dimensões (score 0.0 a 1.0):

   | Dimensão | O que medir |
   |---|---|
   | `revenue_potential` | Potencial de receita absoluta |
   | `speed_to_result` | Quão rápido se chega ao primeiro resultado |
   | `entry_barrier` | Barreira de entrada (**alto = ruim**, será invertido pelo scorer) |
   | `scalability` | Escalabilidade do modelo |
   | `ai_fit` | Fit com ferramentas de IA |
   | `proven_demand` | Demanda comprovada no mercado |
   | `durability` | Durabilidade da oportunidade |
   | `practical_solutions` | Viabilidade de soluções práticas |
   | `commercialization` | Facilidade de comercialização |

3. **Escreva** `scores.json` no run directory:
   ```json
   {
     "Título da Oportunidade": {
       "revenue_potential": 0.8,
       "speed_to_result": 0.7,
       ...
     }
   }
   ```

4. **Rode** o scorer via bridge:
   ```bash
   cd /Users/rafaelmelgaco/educational-team/tools/opportunity-research && uv run python -m opportunity_research.agent_bridge score-and-rank <run_dir>/pipeline_output.json <run_dir>/scores.json
   ```

5. **Deep Dive** — Para cada oportunidade do TOP (output do comando acima), produza:

   - `practical_solutions`: 3-5 soluções concretas implementáveis com IA. Cada uma com: name, description, tech_stack (lista), effort_estimate ("low"/"medium"/"high")
   - `commercialization_strategy`: target_audience, pricing_model ("hourly"/"project"/"SaaS"/"subscription"/"hybrid"), price_range (em BRL), sales_channels (lista), packaging_suggestion
   - `deep_analysis_md`: análise qualitativa detalhada em Português BR — mínimo 500 palavras, substantiva, sem placeholders

6. **Escreva** `deep_dives.json` no run directory:
   ```json
   {
     "Título da Oportunidade": {
       "practical_solutions": [...],
       "commercialization_strategy": {...},
       "deep_analysis_md": "# Análise\n..."
     }
   }
   ```

7. **Rode** build-enriched:
   ```bash
   cd /Users/rafaelmelgaco/educational-team/tools/opportunity-research && uv run python -m opportunity_research.agent_bridge build-enriched <run_dir>/scored_output.json <run_dir>/deep_dives.json <run_dir>/enriched_output.json
   ```

### Phase 3: Generate Obsidian Output

```bash
cd /Users/rafaelmelgaco/educational-team/tools/opportunity-research && uv run python -m opportunity_research.agent_bridge generate-obsidian <run_dir>/enriched_output.json "~/Documents/Obsidian Vault/Opportunity Research/"
```

### Phase 4: Report

Informe ao usuário:
- Quantas oportunidades foram encontradas e avaliadas
- **Top 5** com título, score total, e as 2 dimensões mais fortes
- Path completo da pasta gerada no Obsidian vault
- Sugestão de próximos passos (ex: revisar no Obsidian, refinar direção)

## Error Handling

| Situação | Ação |
|---|---|
| `FIRECRAWL_API_KEY` não definida | Informe o usuário que precisa definir a variável |
| Pipeline retorna 0 resultados | Informe e sugira termos alternativos |
| Vault não tem matches | Continue sem vault enrichment (normal para temas novos) |
| Direction vazio | Peça ao usuário para fornecer uma direção |

## Important

- Toda análise deve ser em **Português BR**
- Seja **substantivo** nos deep dives — não use placeholders ou frases genéricas
- O output final é um **folder no Obsidian vault**, não texto no terminal
- O working directory para todos os comandos é `/Users/rafaelmelgaco/educational-team/tools/opportunity-research`
