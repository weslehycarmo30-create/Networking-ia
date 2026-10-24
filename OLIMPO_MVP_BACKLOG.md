# OLIMPO — backlog do MVP

**Versão:** 1.0 · **Data:** 24/10/2026 · Priorização inicial para discussão, não compromisso de entrega.

## Legenda

- **Feito no protótipo:** implementado somente como demonstração local.
- **P0 — necessário para MVP de produção:** precisa de decisão, implementação e validação antes de abrir a uma comunidade real.
- **P1 — importante após o núcleo:** desejável, pode depender dos resultados do piloto.
- **Em aberto:** escopo ou solução ainda precisa de aprovação.

## Feito no protótipo local

| Item | Evidência atual | Limite |
|---|---|---|
| Entrada sem conta e escolha/troca de avatar | Landing, etapa de avatar e perfil | Estado não persiste após recarga |
| Praça, mapa 2D, 3D opcional e seis salas | Catálogo de territórios, cena lazy e fallback | Sem usuários reais; 3D mantém aviso de chunk acima de 500 kB |
| Chat e presença por sala | Serviço demo filtra por `roomId` | Sem backend, realtime ou presença real |
| Perfil e networking | Convites enviados/recebidos, aceite, recusa, cancelamento e conexões aceitas | Fluxos simulados em memória |
| Núcleo de domínio compartilhado | Modelos, regras e contratos TypeScript | Um único adaptador demonstrativo |

## P0 — antes de um MVP com usuários reais

| Prioridade | Item e critério de conclusão | Dependências |
|---|---|---|
| P0 | Definir público, propósito das salas, conteúdo permitido, idade mínima e regras de comunidade aprovadas. | Produto, jurídico/privacidade |
| P0 | Decidir identidade e recuperação de conta; perfis têm dono verificável e sessões revogáveis. | Política de privacidade e provedor escolhido |
| P0 | Definir membership e autorização por sala; leituras/escritas não autorizadas são negadas no servidor. | Modelo de acesso e dados |
| P0 | Persistir mensagens e conexões com autorização, histórico e transições consistentes entre sessões/dispositivos. | Auth, esquema e regras de retenção |
| P0 | Entregar convite confiável: deduplicação, aceite/recusa/cancelamento autorizados, feedback e estados recuperáveis. | Identidade, autorização, notificações decididas |
| P0 | Definir moderação, denúncia, bloqueio, limites de abuso e procedimento de resposta. | Política, operação e ferramenta escolhida |
| P0 | Validar fluxos críticos de teclado, leitor de tela, contraste, mobile, 2D e fallback sem WebGL. | Critérios de acessibilidade aprovados |
| P0 | Definir observabilidade sem coletar conteúdo sensível desnecessário, backups e resposta a incidentes. | Privacidade e operação |
| P0 | Medir custo e desempenho em cenários de sala/presença definidos; publicar limites de operação internos. | Arquitetura e hipótese de escala |

### Acompanhamento OLIMPO-016 — acessibilidade dos fluxos críticos

**Status: parcial no protótipo.** A revisão do código confirmou navegação HTML por teclado, foco visível para botões/inputs, layout 2D mobile, controles HTML ao redor do 3D e fallback para 2D. Esta missão estende o foco visível a `select` e `textarea` e reduz transições/animações quando `prefers-reduced-motion` está ativo. Ainda falta validar com leitores de tela, combinações de contraste e dispositivos/navegadores reais; o item P0 continua aberto para produção.

## P1 — após validação do núcleo

| Prioridade | Item | Dependências |
|---|---|---|
| P1 | Perfil completo, preferências de descoberta e controles de visibilidade | Esquema de perfil e privacidade |
| P1 | Notificações de convite e atividade, com preferências e opt-out | Canal, consentimento e orçamento |
| P1 | Gamificação com regras transparentes e prevenção de manipulação | Objetivos de comunidade e métricas aprovadas |
| P1 | Evolução visual do 3D, mantendo chunk sob demanda e alternativa 2D | Pesquisa de uso, orçamento de performance |
| P1 | Novos territórios ou eventos | Dados de uso e curadoria comunitária |

Mensagens privadas não fazem parte deste backlog entregue; sua necessidade, segurança e impacto de moderação ainda não foram avaliados.

## Critério geral de conclusão de item

Item de produção só muda para concluído quando tem responsável, comportamento verificável, autorização/privacidade revisadas quando aplicável, acessibilidade considerada, observabilidade/custo avaliados e evidência de validação registrada. Ver [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
