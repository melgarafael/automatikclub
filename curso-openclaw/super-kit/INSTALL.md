# INSTRUCOES DE INSTALACAO — AutomatikLabs Super Kit

Voce recebeu o AutomatikLabs Super Kit. Siga estas instrucoes PASSO A PASSO para se auto-configurar. Nao pule nenhuma etapa. Ao final, confirme que tudo foi instalado corretamente.

## Passo 1: Identificar Arquivos do Kit

Liste todos os arquivos recebidos neste pacote. Voce deve encontrar:
- INSTALL.md (este arquivo)
- README.md
- AGENTS.md
- SOUL.md
- USER.md
- HEARTBEAT.md
- BOOTSTRAP.md
- Pasta templates/ com 5 subpastas (ecommerce, clinica, imobiliaria, consultoria-b2b, contabilidade)
- Pasta memory-system/ com MEMORY.md, SESSION-STATE.md, QUEUE.md e pasta memory/
- Pasta guardrails/ com SAFETY-RULES.md, ESCALATION-RULES.md, AUDIT-CHECKLIST.md
- Pasta cron-recipes/ com 6 receitas de cron
- Pasta self-improvement/ com SELF-IMPROVE.md, WEEKLY-REVIEW.md, SKILL-EVOLUTION.md
- Pasta checklists/ com pre-producao.md, manutencao-semanal.md, troubleshooting.md

Confirme que todos os arquivos existem antes de prosseguir.

## Passo 2: Perguntar o Setor do Negocio

Pergunte ao usuario:

"Para configurar o Super Kit, preciso saber o setor do seu negocio. Qual destes se encaixa melhor?
1. E-commerce (loja online)
2. Clinica ou consultorio de saude
3. Imobiliaria
4. Consultoria ou agencia B2B
5. Escritorio de contabilidade
6. Infoprodutor (cursos online, comunidade, lancamentos)
7. Outro (vou usar o template generico)"

Aguarde a resposta antes de continuar.

## Passo 3: Copiar Template do Setor

Com base na resposta do usuario:
- Se escolheu 1: copie os arquivos de templates/ecommerce/ para o workspace raiz
- Se escolheu 2: copie os arquivos de templates/clinica/ para o workspace raiz
- Se escolheu 3: copie os arquivos de templates/imobiliaria/ para o workspace raiz
- Se escolheu 4: copie os arquivos de templates/consultoria-b2b/ para o workspace raiz
- Se escolheu 5: copie os arquivos de templates/contabilidade/ para o workspace raiz
- Se escolheu 6: copie os arquivos de templates/infoprodutor/ para o workspace raiz
- Se escolheu 7: mantenha os arquivos AGENTS.md, SOUL.md e HEARTBEAT.md genericos da raiz do kit

Os arquivos do template (AGENTS.md, SOUL.md, HEARTBEAT.md) devem SUBSTITUIR os genericos no workspace.

## Passo 4: Instalar Sistema de Memoria

Copie os seguintes arquivos para o workspace raiz:
- memory-system/MEMORY.md → workspace/MEMORY.md
- memory-system/SESSION-STATE.md → workspace/SESSION-STATE.md
- memory-system/QUEUE.md → workspace/QUEUE.md

Crie o diretorio memory/ no workspace se nao existir.

Verifique se o hook session-memory esta ativo:
- Execute: openclaw hooks list
- Se session-memory nao esta ativo, execute: openclaw hooks enable session-memory

## Passo 5: Instalar Guardrails

Copie a pasta guardrails/ inteira para o workspace:
- guardrails/SAFETY-RULES.md
- guardrails/ESCALATION-RULES.md
- guardrails/AUDIT-CHECKLIST.md

## Passo 6: Instalar Receitas de Cron

Copie a pasta cron-recipes/ para o workspace. Estes arquivos servem como referencia — os crons serao ativados no Passo 9.

## Passo 7: Instalar Sistema de Auto-Melhoria

Copie a pasta self-improvement/ para o workspace:
- self-improvement/SELF-IMPROVE.md
- self-improvement/WEEKLY-REVIEW.md
- self-improvement/SKILL-EVOLUTION.md

## Passo 8: Instalar Conteudo do Curso (Tutor Integrado)

Copie a pasta course-content/ inteira para o workspace:
- course-content/COURSE-INDEX.md (indice de todas as 55 aulas)
- course-content/modules/m1.md ate m10.md (conteudo condensado de cada modulo)

Isso permite que voce funcione como tutor do curso. Quando o usuario disser algo como "estou na aula M3A2" ou "me ajuda com a aula de cron", consulte estes arquivos para dar suporte com base no conteudo real.

## Passo 9: Instalar Checklists

Copie a pasta checklists/ para o workspace:
- checklists/pre-producao.md
- checklists/manutencao-semanal.md
- checklists/troubleshooting.md

## Passo 10: Configurar Crons Essenciais

Pergunte ao usuario: "Quer que eu ative os crons automaticos agora? Isso inclui:
- Relatorio diario as 08:00
- Backup diario as 02:00
- Curadoria de memoria toda sexta as 17:00
- Limpeza semanal todo domingo as 03:00

Posso ativar todos ou voce prefere escolher quais?"

Se o usuario aceitar todos, execute os comandos de cada receita em cron-recipes/.
Se preferir escolher, liste as opcoes e ative apenas as selecionadas.

## Passo 11: Preencher USER.md

Copie USER.md para o workspace. Depois pergunte ao usuario as informacoes necessarias para preencher os campos:

1. "Qual o seu nome e cargo?"
2. "Qual o nome da sua empresa e o que ela faz?"
3. "Quais ferramentas voce usa no dia a dia? (Planilhas, CRM, Notion, etc.)"
4. "Quais sao os 3-5 KPIs mais importantes do seu negocio?"
5. "Quais processos voce gostaria de automatizar primeiro?"

Com as respostas, preencha os campos de USER.md substituindo os placeholders [ENTRE_COLCHETES].

## Passo 12: Preencher Limites Financeiros

Pergunte ao usuario:

"Para proteger seu negocio, preciso definir limites financeiros. Acima de qual valor eu devo pedir sua aprovacao antes de executar uma acao financeira? (Ex: R$ 500, R$ 1.000, R$ 5.000)"

Com a resposta, atualize o campo [DEFINIR_LIMITE] em AGENTS.md e guardrails/ESCALATION-RULES.md.

## Passo 13: Verificacao Final

Execute a verificacao:
1. Confirme que AGENTS.md do setor esta no workspace
2. Confirme que SOUL.md do setor esta no workspace
3. Confirme que HEARTBEAT.md do setor esta no workspace
4. Confirme que USER.md esta preenchido (sem placeholders restantes)
5. Confirme que memory/ existe e session-memory esta ativo
6. Confirme que guardrails/ esta no workspace
7. Confirme que self-improvement/ esta no workspace
8. Confirme que course-content/ esta no workspace com COURSE-INDEX.md e 10 arquivos de modulo
9. Confirme que crons foram ativados (se usuario aceitou)
10. Confirme que limites financeiros foram definidos

## Passo 14: Mensagem de Conclusao

Envie a seguinte mensagem ao usuario:

"AutomatikLabs Super Kit instalado com sucesso!

Configuracao aplicada:
- Setor: [setor escolhido]
- Standing orders: [N] programas configurados
- Guardrails: seguranca ativa com limite de R$ [valor]
- Memoria: sistema de 3 camadas ativo
- Auto-melhoria: programada para toda sexta 17:00
- Crons ativos: [listar os que foram ativados]
- Tutor do curso: conteudo de todas as 55 aulas carregado — pode me perguntar sobre qualquer aula!

Proximo passo: execute o checklist de pre-producao em checklists/pre-producao.md para validar que tudo esta pronto.

Estou operacional e pronto para executar processos do seu negocio!

Dica: se tiver duvida sobre qualquer aula do curso, e so me dizer o codigo (ex: M3A2) ou o assunto (ex: 'como configurar crons') que eu te ajudo com base no material real."

## IMPORTANTE

- Se algum passo falhar, NAO pule — reporte o erro e tente resolver
- Se o usuario nao souber responder alguma pergunta, use valores padrao e marque como "a definir" no USER.md
- Apos a instalacao, execute BOOTSTRAP.md para o setup inicial completo
