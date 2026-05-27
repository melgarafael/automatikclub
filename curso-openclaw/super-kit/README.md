# AutomatikLabs Super Kit para OpenClaw

Kit de configuracao profissional que transforma seu agente OpenClaw em um operador autonomo otimizado. Baseado nos best practices de 350K+ usuarios da comunidade OpenClaw.

## Instalacao (3 minutos)

1. Extraia o zip no workspace do seu OpenClaw
2. Escolha o template do seu setor em `templates/`
3. Copie os 3 arquivos do template (AGENTS.md, SOUL.md, HEARTBEAT.md) para a raiz do workspace
4. Edite `USER.md` com seus dados pessoais e do negocio
5. Reinicie o OpenClaw: `openclaw gateway restart`

O agente vai ler os arquivos automaticamente e se auto-configurar.

## O que esta incluido

| Pasta | Conteudo |
|-------|----------|
| `/` (raiz) | Arquivos core: AGENTS.md, SOUL.md, USER.md, HEARTBEAT.md, BOOTSTRAP.md |
| `templates/` | 6 templates por setor (e-commerce, clinica, imobiliaria, B2B, contabilidade, infoprodutor) |
| `memory-system/` | Sistema de memoria em 3 camadas (episodica, semantica, procedural) |
| `guardrails/` | Regras de seguranca, escalacao e auditoria |
| `cron-recipes/` | 6 receitas de cron prontas para copiar e usar |
| `self-improvement/` | Sistema de auto-melhoria continua do agente |
| `checklists/` | Checklists de pre-producao, manutencao e troubleshooting |

## Como usar os templates por setor

Cada template ja vem com standing orders, papel operacional e heartbeat configurados para o setor. Voce so precisa personalizar com os dados do SEU negocio.

```bash
# Exemplo: usando template de e-commerce
cp templates/ecommerce/AGENTS.md ./AGENTS.md
cp templates/ecommerce/SOUL.md ./SOUL.md
cp templates/ecommerce/HEARTBEAT.md ./HEARTBEAT.md
```

Depois edite cada arquivo substituindo os placeholders [ENTRE_COLCHETES] pelos seus dados reais.

## Como funciona a auto-melhoria

O arquivo `self-improvement/SELF-IMPROVE.md` contem instrucoes que o agente executa semanalmente para:
- Revisar logs e identificar falhas
- Curar memoria removendo informacao obsoleta
- Refinar standing orders que nao estao funcionando
- Otimizar crons baseado em resultados reais

Para ativar, adicione ao seu HEARTBEAT.md:
```
### Sexta 17:00 — Auto-Melhoria Semanal
- Ler e executar self-improvement/SELF-IMPROVE.md
```

## Creditos

Curado pela AutomatikLabs com base nos best practices da comunidade OpenClaw.
Patterns extraidos de: Self-Improving Agent (419K+ downloads), Proactive Agent, Elite Long-Term Memory, e 11 skills consolidadas.
