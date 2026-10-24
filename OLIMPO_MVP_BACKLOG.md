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

### Acompanhamento OLIMPO-017 — acessibilidade dos fluxos críticos

**Status: parcial; P0 permanece aberto.** A revisão estática confirmou controles HTML para entrada/avatar, navegação, salas, chat, perfis, conexões, encontros, notificações e reset; foco visível global para botões e campos, e regra `prefers-reduced-motion`. O mapa 3D oferece controles HTML adjacentes e o código mantém a vista 2D/fallback. A medição WCAG de combinações sólidas identificou texto pequeno insuficiente em `.section-count` e `.territory-number`; ambos agora usam `--muted`.

**Evidência e limites:** proporções calculadas a partir dos valores CSS reais: `#75817e` sobre `#101820` = 4,43:1 e sobre `#172229` = 4,01:1 (abaixo de 4,5:1 para texto normal); após a correção, `#9ca7a6` sobre esses fundos = 7,24:1 e 6,55:1. Também foram medidos `#e9e5dc` sobre `#101820` = 14,24:1, foco `#75d9d0` sobre `#101820`/`#172229`/`#23413d` = 10,73:1/9,71:1/6,65:1, placeholder `#84908c` sobre `#111c21` = 5,24:1 e estado ativo `#c8efe3` sobre `#23413d` = 8,92:1. São amostras de pares sólidos, não uma auditoria exaustiva de gradientes, estados, territórios ou renderização real. O CSS declara layout mínimo de 320 px e breakpoints em 900, 760, 680 e 380 px; renderização nessas larguras ainda precisa ser observada em navegador.

**Validação manual pendente:** (1) percorrer cada fluxo só com Tab/Shift+Tab/Enter/Espaço/Esc e conferir ordem, retorno de foco e ausência de armadilha; (2) testar leitor de tela disponível e verificar nomes/atualizações; (3) revisar contraste de texto, foco e estados dinâmicos sobre gradientes e cores territoriais; (4) inspecionar larguras 320, 390, 768 e 1280 px em navegador real; (5) desativar WebGL ou provocar falha e confirmar acesso 2D. Repetição: iniciar `npm.cmd run dev -- --host 127.0.0.1`, abrir `http://127.0.0.1:5173/` no navegador, completar os fluxos acima e registrar leitor/versão, viewport, resultado e falha encontrada. Nesta execução a automação CUA reiniciou após `trusted Node process exited unexpectedly; kernel reset`, listou Chrome/Edge, mas não conseguiu vincular a janela porque não determinou a URL atual com confiança. Nenhuma etapa de navegador ou leitor de tela foi considerada verificada. Não declarar o P0 concluído até registrar esses resultados.

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
