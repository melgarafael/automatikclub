# Bootstrap — AutomatikLabs Super Kit

## Execucao na Primeira Inicializacao

Quando este arquivo for carregado pela primeira vez, execute os seguintes passos:

### 1. Verificar Ambiente
- Confirmar que AGENTS.md, SOUL.md, USER.md e HEARTBEAT.md existem no workspace
- Verificar que o hook session-memory esta ativo (para persistir memorias)
- Verificar que o diretorio memory/ existe

### 2. Inicializar Sistema de Memoria
- Criar memory/[DATA_HOJE].md como primeiro log episodico
- Registrar: "Agente inicializado com AutomatikLabs Super Kit"
- Criar SESSION-STATE.md se nao existir
- Criar QUEUE.md se nao existir com as 4 secoes (Ready/In Progress/Done/Blocked)

### 3. Validar Configuracao
- Ler USER.md e confirmar que os placeholders foram preenchidos
- Se encontrar [ENTRE_COLCHETES] nao preenchidos, listar quais precisam ser completados
- Ler AGENTS.md e confirmar que os limites financeiros foram definidos

### 4. Teste de Integracao
- Tentar acessar cada integracao configurada
- Reportar status de cada uma: OK ou FALHA + motivo
- Se alguma integracao critica falhou, alertar antes de continuar

### 5. Primeiro Relatorio
- Gerar mensagem de confirmacao:
  "AutomatikLabs Super Kit ativado com sucesso.
   Integracoes: [X] OK, [Y] com problemas.
   Proximo heartbeat: [horario].
   Pronto para operar."

## Execucoes Subsequentes

Nas inicializacoes seguintes, este arquivo apenas confirma que o ambiente esta integro e que nenhum arquivo critico foi removido ou corrompido.
