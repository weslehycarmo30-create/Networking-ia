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

As decisões do proprietário que bloqueiam esses itens e a prontidão do produto estão enumeradas em [OLIMPO_OWNER_DECISIONS.md](OLIMPO_OWNER_DECISIONS.md) (D-01 a D-08). Validações técnicas pendentes, incluindo acessibilidade manual e desempenho 3D, estão separadas naquele documento; o P0 de acessibilidade continua parcial até haver evidência manual.

### Acompanhamento OLIMPO-017/018 — acessibilidade dos fluxos críticos

**Status: parcial; P0 permanece aberto.** A revisão estática confirmou controles HTML para entrada/avatar, navegação, salas, chat, perfis, conexões, encontros, notificações e reset; foco visível global para botões e campos, e regra `prefers-reduced-motion`. O mapa 3D oferece controles HTML adjacentes e o código mantém a vista 2D/fallback. A medição WCAG de combinações sólidas identificou texto pequeno insuficiente em `.section-count` e `.territory-number`; ambos agora usam `--muted`.

**Evidência e limites:** proporções calculadas a partir dos valores CSS reais: `#75817e` sobre `#101820` = 4,43:1 e sobre `#172229` = 4,01:1 (abaixo de 4,5:1 para texto normal); após a correção, `#9ca7a6` sobre esses fundos = 7,24:1 e 6,55:1. Também foram medidos `#e9e5dc` sobre `#101820` = 14,24:1, foco `#75d9d0` sobre `#101820`/`#172229`/`#23413d` = 10,73:1/9,71:1/6,65:1, placeholder `#84908c` sobre `#111c21` = 5,24:1 e estado ativo `#c8efe3` sobre `#23413d` = 8,92:1. São amostras de pares sólidos, não uma auditoria exaustiva de gradientes, estados, territórios ou renderização real. O CSS declara layout mínimo de 320 px e breakpoints em 900, 760, 680 e 380 px; renderização nessas larguras ainda precisa ser observada em navegador.

**Resultado OLIMPO-018:** pré-voo confirmado em `codex/olimpo-002-foundation`, HEAD local/remoto `7a1b31b72f4fa92e525ec76d1e67e31a1959eaf3`, working tree limpo; origin corresponde ao repositório informado. Checklist e controles foram relidos por código. O servidor Vite 6.4.5 iniciou em `http://127.0.0.1:5173/` usando `--host 127.0.0.1` e foi encerrado após a tentativa. O inventário CUA mostrou Chrome/Edge em execução, porém sem provedores de navegador utilizáveis. Abrir a URL explicitamente com `createBrowserTab` retornou `Browser is not available: iab` e `Browser is not available: chrome`. Portanto, nenhum fluxo interativo foi percorrido e nenhum resultado de teclado, foco, diálogo, viewport, `prefers-reduced-motion` ou fallback WebGL foi inferido. A busca por processos `Narrator`, `NVDA` e `JAWS` não encontrou leitor em execução; leitor de tela permanece pendente do proprietário.

**Validação manual pendente:** (1) abrir `http://127.0.0.1:5173/` no navegador local e percorrer avatar, Praça Central 2D/3D, sala/chat, perfil/conexões, encontros, notificações e reset com Tab/Shift+Tab/Enter/Espaço/Esc; observar ordem, contorno, retorno de foco e ausência de armadilhas; (2) inspecionar 320, 390, 768 e 1280 px; (3) emular `prefers-reduced-motion`; (4) desativar WebGL ou provocar falha reversível e confirmar o mapa 2D; (5) se houver leitor de tela utilizável, registrar nome/versão e resultados de nomes e atualizações; (6) revisar contraste renderizado de gradientes, estados e cores territoriais. Registrar ambiente, resultado e falha de cada passo. Não declarar o P0 concluído até registrar essas validações.

## P1 — após validação do núcleo

| Prioridade | Item | Dependências |
|---|---|---|
| P1 | Perfil completo, preferências de descoberta e controles de visibilidade | Esquema de perfil e privacidade |
| P1 | Notificações de convite e atividade, com preferências e opt-out | Canal, consentimento e orçamento |
| P1 | Gamificação com regras transparentes e prevenção de manipulação | Objetivos de comunidade e métricas aprovadas |
| P1 | Evolução visual do 3D, mantendo chunk sob demanda e alternativa 2D | Pesquisa de uso, orçamento de performance |
| P1 | Novos territórios ou eventos | Dados de uso e curadoria comunitária |

**OLIMPO-019 — parcela demonstrativa concluída:** este item estava pendente: o contrato `NotificationService` só expunha lista/leitura e a versão `4` do payload não continha preferências. A central local agora permite optar por categorias de convite e atividade de encontros. A preferência fica no estado namespaced versionado; desativar remove avisos existentes da categoria e evita novos registros locais. Isso não entrega notificações reais nem satisfaz dependências de canal, consentimento ou orçamento para produção.

Mensagens privadas não fazem parte deste backlog entregue; sua necessidade, segurança e impacto de moderação ainda não foram avaliados.

## Critério geral de conclusão de item

Item de produção só muda para concluído quando tem responsável, comportamento verificável, autorização/privacidade revisadas quando aplicável, acessibilidade considerada, observabilidade/custo avaliados e evidência de validação registrada. Ver [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
