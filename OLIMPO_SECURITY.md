# OLIMPO — segurança, privacidade e operação

**Versão:** 1.0 · **Data:** 24/10/2026 · Distingue controles presentes de requisitos de produção.

## Estado de segurança do protótipo

- Dados e perfis de catálogo são fictícios.
- Avatar escolhido, mensagens de demonstração e convites/conexões são salvos localmente no navegador sob a chave namespaced `olimpo:demo-state`, com versão e validação de conteúdo. Presença e estado de interface não são salvos. A demonstração não envia esses dados a um backend.
- Se o acesso ao `localStorage` falhar ou exceder a quota, a demonstração continua em memória e mostra um aviso de que as mudanças duram apenas a sessão. Dados inválidos voltam aos valores iniciais fictícios.
- O controle **Reiniciar demonstração** apaga apenas a chave `olimpo:demo-state`; não limpa outras chaves do site ou do navegador.
- Limite de 300 caracteres e validação de mensagem vazia são regras de domínio locais.
- O adaptador valida sala existente, duplicidade de convite pendente, destinatário de convite e remetente de cancelamento.
- Não há Supabase, Auth, banco, Storage, Realtime, analytics ou serviço externo.

Essas validações e a chave namespaced melhoram a demonstração, mas **não são uma fronteira de segurança nem armazenamento de produção**: código cliente e `localStorage` podem ser inspecionados/alterados pelo usuário, e o estado não é compartilhado. Não inserir dados sensíveis ou pessoais em campos de demonstração. O aviso de armazenamento local não deve sugerir sincronização ou backup.

## Requisitos antes de produção

### Identidade e autorização

- Definir autenticação, recuperação e ciclo de sessão antes de armazenar conteúdo de usuário.
- Autorizar no servidor cada leitura/escrita de sala, perfil, mensagem e convite; não confiar em `profileId` ou `roomId` enviados pelo navegador.
- Modelar membership e acesso a territórios; decidir perfis públicos, campos privados, bloqueios e visibilidade de convites.
- Se Supabase for avaliado, revisar RLS para cada tabela, testar isolamento por usuário e evitar chaves privilegiadas no cliente. Supabase é somente uma opção em aberto, sem projeto ou serviço conectado.

### Mensagens, salas e abuso

- Definir limites de taxa, tamanho, frequência de convites, deduplicação, bloqueio e denúncia.
- Planejar moderação, resposta a conteúdo abusivo, recurso de decisão, retenção e trilha de auditoria com acesso restrito.
- Codificar conteúdo como texto; se rich text for introduzido, sanitizar no servidor e evitar HTML arbitrário.
- Estabelecer acesso a histórico, exclusão, exportação, retenção e tratamento de mensagens reportadas.

Não há moderação, denúncia, bloqueio, rate limiting ou mensagens privadas implementados no protótipo.

### Privacidade e dados

- Definir finalidade e base legal, aviso de privacidade, minimização, retenção e exclusão antes de coletar perfis reais.
- Evitar gravar conteúdo de chat, identificadores ou texto em logs de diagnóstico sem necessidade e controle de acesso.
- Rever riscos de exposição de presença, grafos de conexão e interesses; estes dados podem revelar relações e preferências.
- O código atual não usa dados pessoais reais; nomes e apresentações de exemplo são fictícios.

### Acessibilidade e desempenho

- Manter navegação por teclado, foco visível, rótulos e feedback acessível; validar com leitores de tela e dispositivos assistivos.
- Preservar a vista 2D como alternativa completa e o fallback automático quando WebGL falha ou o desempenho cai.
- O chunk 3D continua acima do alerta padrão de 500 kB. Medir em dispositivos-alvo e otimizar sem esconder o aviso.
- Planejar limites de tráfego, armazenamento, conexões realtime, logs, backups e custo por participante/sala antes de escolher infraestrutura.

## Resposta a incidentes e controles ainda por definir

Não há processo de incidentes, monitoramento, backups ou SLA para o protótipo. Antes de produção, definir responsáveis, severidade, contenção, comunicação, restauração, revisão de acesso e contato de privacidade. Os custos não foram estimados.

Ver [modelo de dados](OLIMPO_DATA_MODEL.md), [arquitetura](OLIMPO_2D_3D_ARCHITECTURE.md) e [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
