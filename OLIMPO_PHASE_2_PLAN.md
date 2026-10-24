# OLIMPO — plano proposto para fase 2

**Versão:** 1.0 · **Data:** 24/10/2026 · Este plano é uma proposta ordenada; não é aprovação de arquitetura, orçamento ou cronograma.

## Objetivo

Evoluir o protótipo demonstrativo para um piloto comunitário seguro, começando por decisões de produto e segurança e só então substituindo o adaptador em memória. Preservar os contratos de domínio onde forem adequados, manter o mapa 2D completo e carregar 3D somente sob demanda.

## Fase A — decisões e critérios de piloto

**Trabalho:** confirmar público, propósito das salas, regras de comunidade, privacidade, retenção, acessibilidade, expectativa de escala, suporte e métricas consentidas.

**Saída para avançar:** requisitos e riscos aprovados pelos responsáveis; critérios de piloto e limites de custo definidos. Sem essa saída, não selecionar infraestrutura.

## Fase B — avaliação técnica e modelo de acesso

**Trabalho:** comparar opções de autenticação, Postgres, autorização por sala, eventos de presença, armazenamento, backup, observabilidade e custos. Supabase pode ser avaliado para Auth, PostgreSQL/RLS, Realtime e Storage, junto a alternativas adequadas.

**Saída para avançar:** decisão registrada e revisão de segurança/privacidade concluída. Esta documentação não escolhe Supabase e nenhuma integração está conectada.

## Fase C — identidade, autorização e persistência

**Trabalho:** implementar identidade de conta, propriedade de perfil, membership de sala, persistência de mensagens e conexões, validação no servidor, retenção e exclusão. Revisar políticas por operação e testar cenários de negação antes de expor dados.

**Dependência:** fases A e B aprovadas. Não tratar o adaptador demo ou os IDs recebidos pela UI como autorização.

**Saída:** duas sessões de demonstração autenticadas veem apenas os dados permitidos; mensagens e convites sobrevivem a recarga dentro das regras aprovadas.

## Fase D — networking, salas e segurança operacional

**Trabalho:** substituir simulação de respostas por ações autenticadas do destinatário; decidir notificações; criar denúncia, bloqueio, limite de frequência, moderação, auditoria e resposta a abuso. Implementar presença apenas com política de retenção e estados definidos.

O protótipo OLIMPO-019 inclui somente preferências locais para categorias de avisos fictícios; isso não define canal, consentimento de produção, opt-out de e-mail/push ou entrega por servidor.

**Dependência:** identidade, autorização e modelo de dados. Mensagens privadas permanecem fora até avaliação e decisão explícitas.

**Saída:** transições de convite e acesso a sala são validadas no servidor; usuários conseguem denunciar/bloquear conforme política; há procedimento de resposta a incidentes.

## Fase E — acessibilidade, performance e piloto controlado

**Trabalho:** auditoria de teclado/leitor de tela/contraste, teste em dispositivos móveis e navegadores sem WebGL, métricas de FPS e peso transferido, perfil de custos, logs minimizados, backup/restauração e monitoramento do piloto.

**Dependência:** operações reais instrumentadas com minimização de dados e ambientes configurados.

**Saída:** critérios internos de acessibilidade, performance, recuperação e custo atendidos; responsáveis e limites de piloto documentados. Se o chunk 3D continuar pesado, manter 2D como caminho principal até correção mensurável.

## Riscos e decisões que permanecem abertas

- Provedor de identidade/backend e localização dos dados.
- Escala esperada, custo por participante e retenção de presença/mensagens.
- Modelo de salas públicas/privadas, visibilidade de perfil e moderação.
- Necessidade de Storage para imagens ou avatares; o protótipo atual usa avatares emoji e não precisa de Storage.
- Instrumentação permitida, consentimento e prazo de retenção.
- Critério para lançar, adiar ou reduzir a experiência 3D.

## Referências

[Backlog do MVP](OLIMPO_MVP_BACKLOG.md) · [Segurança](OLIMPO_SECURITY.md) · [Modelo de dados](OLIMPO_DATA_MODEL.md) · [Arquitetura 2D/3D](OLIMPO_2D_3D_ARCHITECTURE.md).
