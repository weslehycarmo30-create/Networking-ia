# OLIMPO — decisões pendentes do proprietário

**Versão:** 1.0 · **Data:** 24/10/2026 · **Estado geral:** nenhuma recomendação abaixo foi aprovada. As opções são pontos de decisão, não requisitos definidos.

Este documento organiza bloqueios que aparecem no [backlog do MVP](OLIMPO_MVP_BACKLOG.md), na [especificação do produto](OLIMPO_PRODUCT_SPEC.md), no [modelo de dados](OLIMPO_DATA_MODEL.md), na [arquitetura 2D/3D](OLIMPO_2D_3D_ARCHITECTURE.md), em [segurança e privacidade](OLIMPO_SECURITY.md) e no [plano de fase 2](OLIMPO_PHASE_2_PLAN.md). O protótipo atual continua local, demonstrativo e baseado em dados fictícios.

## Decisões que requerem aprovação

### D-01 — público, elegibilidade e regras da comunidade

- **Pergunta:** qual público e faixa etária podem participar do primeiro piloto, quais conteúdos são permitidos e quais regras de convivência se aplicam?
- **Opções:** (a) piloto fechado, por convite, para adultos e com regras curtas publicadas; (b) aceitar participantes menores com requisitos de consentimento e salvaguardas definidos por assessoria apropriada; (c) comunidade aberta, após políticas e operação compatíveis.
- **Recomendação inicial:** começar com piloto fechado para adultos, centrado no público pretendido já descrito (criadores de SaaS, desenvolvedores e pessoas que constroem com IA), e publicar regras simples antes de convidar participantes. Confirmar elegibilidade e linguagem com responsáveis por produto e privacidade.
- **Impacto:** (a) reduz exposição e escopo de operação, mas limita acesso; (b) aumenta obrigações de proteção e operação; (c) amplia alcance e também abuso, suporte e custo de moderação.
- **Bloqueia:** backend de membership/políticas: parcialmente; beta fechado: sim; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-02 — espaços públicos/privados e visibilidade de perfil

- **Pergunta:** quais salas e campos de perfil serão visíveis a todos, e haverá espaços privados no primeiro MVP?
- **Opções:** (a) salas públicas e perfil mínimo público, sem territórios privados; (b) perfis com campos de visibilidade e salas privadas desde o início; (c) piloto fechado com visibilidade restrita aos participantes autorizados.
- **Recomendação inicial:** limitar o piloto a salas públicas de acesso restrito por convite, mostrar somente campos de perfil necessários à descoberta e adiar salas privadas até haver autorização por membership.
- **Impacto:** (a) reduz complexidade, mas expõe campos publicados a todos os membros; (b) exige controles por campo e sala, suporte e revisão de acesso; (c) reduz exposição, mas ainda exige controle confiável de membership.
- **Bloqueia:** esquema e autorização de backend: sim; beta fechado: sim, para escopo e acesso; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-03 — retenção, exportação e exclusão

- **Pergunta:** por quanto tempo manter perfis, mensagens, conexões, denúncias e presença, e o que excluir ou anonimizar quando uma conta for removida?
- **Opções:** (a) prazos mínimos separados por categoria, exclusão automatizada e retenção excepcional documentada; (b) retenção até solicitação de exclusão, com remoção imediata quando possível; (c) prazos mais longos definidos por necessidade operacional comprovada.
- **Recomendação inicial:** coletar o mínimo e definir prazos curtos por categoria antes de persistência real; não manter presença após a sessão; decidir separadamente o tratamento de denúncias e registros necessários a uma apuração.
- **Impacto:** prazos menores reduzem exposição e armazenamento, mas limitam histórico e investigação; prazos maiores aumentam risco, custo e obrigações de exclusão. Exportação requer verificar identidade e limitar os dados entregues.
- **Bloqueia:** esquema, jobs e políticas de backend: sim; beta fechado com dados reais: sim; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-04 — denúncia, moderação e resposta a abuso

- **Pergunta:** quem recebe denúncias reais, qual prazo e processo de análise se aplica, como tratar conteúdo urgente e existe recurso de decisões?
- **Opções:** (a) equipe interna nomeada com fila, prazos, escalação e recurso; (b) provedor de moderação contratado e processo interno de supervisão; (c) manter a experiência sem conteúdo comunitário real até aprovar operação.
- **Recomendação inicial:** não abrir salas a conteúdo real até haver responsável, processo de triagem e escalação, instruções ao participante e capacidade de resposta. Manter bloqueio e moderação como escopo separado, a ser decidido antes da implementação.
- **Impacto:** operação interna oferece controle e exige disponibilidade; provedor reduz parte do trabalho e adiciona custo, compartilhamento de dados e dependência; adiar interação real limita utilidade, mas evita prometer resposta inexistente.
- **Bloqueia:** backend de denúncias/moderação: sim; beta fechado com conteúdo real: sim; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-05 — identidade, papéis e autorização de acesso

- **Pergunta:** qual mecanismo verificará identidade e recuperação de conta, quais papéis existirão e quais operações cada papel pode executar em cada sala?
- **Opções:** (a) provedor gerenciado a avaliar, incluindo Supabase como uma opção, com autorização no servidor e políticas RLS revisadas; (b) outro serviço gerenciado após comparação; (c) adiar backend e manter apenas protótipo local.
- **Recomendação inicial:** comparar opções após aprovar público, visibilidade e retenção; definir participante, moderador e administrador somente com permissões mínimas documentadas. Para qualquer opção, especificar regras por operação para ler/escrever perfil, mensagem, conexão, denúncia e presença; revisar negações e acesso entre salas antes de piloto.
- **Impacto:** serviço gerenciado pode reduzir trabalho de operação, mas cria custo e dependência; implementação própria exige equipe e resposta de segurança; adiar não permite contas, dados compartilhados ou beta autenticado. RLS sem modelo aprovado não define autorização por si só.
- **Bloqueia:** backend, identidade, membership e RLS: sim; beta fechado autenticado: sim; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-06 — canais, consentimento e orçamento de notificações

- **Pergunta:** quais avisos podem sair da aplicação, por quais canais, com qual consentimento, preferências e limite de custo?
- **Opções:** (a) somente central dentro da aplicação; (b) e-mail opcional; (c) push opcional; (d) combinar canais com preferências e limites separados.
- **Recomendação inicial:** começar com avisos dentro da aplicação e opt-in explícito antes de qualquer canal externo; manter opt-out fácil e um orçamento máximo por participante. As preferências existentes no protótipo só controlam registros fictícios locais.
- **Impacto:** central interna tem menor custo e não alcança quem está ausente; e-mail/push aumentam alcance, consentimento, dados de contato, operação, suporte e custo.
- **Bloqueia:** implementação de entrega externa: sim; backend principal: não necessariamente; beta fechado/lançamento público: bloqueia somente canais externos até consentimento e orçamento aprovados.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-07 — métricas, observabilidade e resposta a incidentes

- **Pergunta:** quais métricas operacionais são necessárias, quem pode acessá-las e qual orçamento e processo de incidente serão mantidos?
- **Opções:** (a) métricas agregadas e minimizadas, sem conteúdo de mensagens, com retenção curta; (b) nenhuma telemetria além de métricas operacionais indispensáveis; (c) instrumentação mais detalhada apenas após consentimento e avaliação de privacidade.
- **Recomendação inicial:** começar sem analytics de produto; aprovar métricas agregadas estritamente necessárias, retenção, acesso, backup/restauração, responsável por incidentes e limite mensal de custo antes de um piloto.
- **Impacto:** menos dados reduz risco e custo, mas limita diagnóstico; maior detalhe pode melhorar decisões e aumenta exposição, retenção, suporte e despesas.
- **Bloqueia:** operação de backend em produção: sim; beta fechado: sim para monitoramento, suporte e recuperação mínimos; lançamento público: sim.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

### D-08 — critério de disponibilidade da experiência 3D

- **Pergunta:** qual orçamento de download e desempenho, em quais dispositivos, deve ser atendido para disponibilizar o 3D amplamente?
- **Opções:** (a) manter 3D opcional e restrito até medições em dispositivos-alvo; (b) reduzir geometria/efeitos/conteúdo para cumprir um orçamento aprovado; (c) adotar limite de download e desempenho definido após pesquisa e medições.
- **Recomendação inicial:** manter 2D como caminho principal e o 3D sob demanda; só ampliar disponibilidade depois de aprovar dispositivos-alvo, limites de transferência total/gzip, FPS e comportamento térmico. A cena atual mede 879,72 kB / 236,66 kB gzip para o chunk principal e mantém o aviso acima de 500 kB.
- **Impacto:** restringir 3D preserva acesso e custo previsível, com menor destaque visual; reduzir conteúdo pode afetar fidelidade; limites mais altos elevam transferência, tempo de carregamento e consumo em aparelhos modestos.
- **Bloqueia:** backend: não; beta fechado: bloqueia apenas disponibilizar 3D sem restrição; lançamento público: sim para a promessa de 3D amplo, não para uma experiência 2D completa sem 3D.
- **Estado:** AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO.

## Validações técnicas pendentes — não são decisões do proprietário

Estas etapas podem ser executadas pela equipe quando houver navegador, dispositivos e leitor de tela utilizáveis; não exigem converter recomendações acima em decisões:

- **Acessibilidade P0 — parcial:** percorrer entrada/avatar, Praça Central 2D/3D, sala/chat, perfil/conexões, encontros, notificações e reset por teclado; verificar foco, diálogos, retorno de foco, nomes e atualizações com leitor de tela; revisar contraste renderizado; inspecionar 320, 390, 768 e 1280 px; testar `prefers-reduced-motion` e fallback quando WebGL falhar. A tentativa OLIMPO-018 não abriu aba CUA (`Browser is not available: iab` / `chrome`); não há evidência manual, logo o P0 permanece aberto. Ver a checklist reproduzível em [backlog](OLIMPO_MVP_BACKLOG.md).
- **3D:** medir transferência total necessária, tempo até interatividade, FPS e consumo em dispositivos-alvo após definir os limites de D-08. A evidência atual de build é o chunk 3D principal; não substitui medição em dispositivo.
- **Operação/custo:** elaborar cenários de carga, recuperação e custo após decisões D-05 e D-07, sem conectar serviços nesta etapa.

## Como registrar aprovação

O proprietário pode responder com os IDs e a opção escolhida, indicar uma alternativa ou deixar qualquer ponto pendente. Só então registrar uma decisão aprovada com data, responsável e impacto; até lá, manter o estado literal **AGUARDANDO APROVAÇÃO DO PROPRIETÁRIO**. Nenhuma recomendação deste documento autoriza criar infraestrutura ou integrar um provedor.
