# OLIMPO — especificação do produto

**Versão:** 1.0 · **Data:** 24/10/2026 · **Referência:** protótipo local na branch `codex/olimpo-002-foundation`.

## Como ler este documento

- **Implementado no protótipo** descreve comportamento verificável no código atual.
- **Demonstrativo/local** significa estado em memória, perfis fictícios e conteúdo de exemplo; não é dado de produção.
- **Planejado** é trabalho futuro, não disponível hoje.
- **Em aberto** requer decisão do produto ou validação técnica.

## Visão do produto

OLIMPO é uma cidade digital temática para encontrar pessoas, trocar ideias e explorar conversas por assunto. A experiência combina uma Praça Central, territórios especializados, perfis demonstrativos e salas de conversa.

O público inicial pretendido são criadores de SaaS, desenvolvedores e pessoas que constroem produtos, experimentos ou fluxos com inteligência artificial. A hipótese a validar é que organizar a comunidade como lugares com temas claros facilita descobrir conversas e iniciar conexões.

## Problema e proposta de valor

Comunidades digitais podem ser difíceis de explorar quando toda a atividade aparece em uma lista única. OLIMPO propõe uma praça visual e territórios nomeados para orientar a descoberta. O participante escolhe um avatar ilustrativo, entra sem conta e pode conhecer perfis fictícios.

## Escopo atual

### Implementado no protótipo

- Landing page com entrada na demonstração sem conta.
- Escolha de seis avatares ilustrativos antes de entrar na Praça Central; troca disponível no perfil.
- Praça Central com mapa 2D como vista inicial e cena 3D opcional.
- Seis territórios e navegação para salas com mensagens demonstrativas separadas por sala.
- Presença e perfis fictícios para exploração na praça e nas salas.
- Perfil demonstrativo com apresentação, interesses e gamificação ilustrativa.
- Convites locais de conexão: enviar, aceitar, recusar e cancelar enquanto pendente. Há registros fictícios iniciais para mostrar convites recebidos e conexões aceitas.
- Feedback de ações em região de status acessível.

### Demonstrativo/local

`createDemoServices()` mantém o perfil atual, mensagens e conexões em memória e salva uma cópia validada de avatar, mensagens por sala e conexões no `localStorage` namespaced deste navegador. Uma recarga restaura somente esses dados demonstrativos. Presença, navegação, vista selecionada, rascunhos e feedback temporário continuam efêmeros. **Reiniciar demonstração** remove apenas a chave do OLIMPO e restaura os dados fictícios iniciais. Se o armazenamento estiver indisponível, a aplicação continua em memória e avisa que as mudanças duram apenas a sessão. As listas de salas, mensagens iniciais, presença e perfis vêm de dados fictícios em `src/data/`. Não há conta, servidor, autenticação ou atualização em tempo real; `localStorage` não é persistência de produção.

Os pontos, níveis e medalhas são exemplos estáticos; não existe um mecanismo que calcule ou conceda progresso. A presença representa uma lista demonstrativa, não pessoas realmente online. Os convites simulam decisões de perfis fictícios dentro da interface.

### Fora do escopo implementado

Contas reais, mensagens privadas, sincronização entre participantes/dispositivos, persistência de produção, moderação operacional, notificações externas, pagamentos, administração de comunidade e serviços de produção.

## Princípios do produto

1. **Exploração sem barreira:** a demonstração começa sem conta e sem dados pessoais.
2. **Lugares compreensíveis:** os seis territórios comunicam seu tema antes da entrada.
3. **Escolha visual:** o 2D é a alternativa completa e acessível; o 3D é opcional.
4. **Networking contextual:** conhecer um perfil e enviar um convite não inicia uma conversa privada.
5. **Transparência:** conteúdo e ações locais são apresentados como demonstrativos.

## Indicadores a validar, ainda sem instrumentação

Planejar métricas somente após definir privacidade, consentimento e retenção. Hipóteses: conclusão da entrada, territórios explorados, salas visitadas, convites enviados e aceitos, retorno à comunidade e acessibilidade dos fluxos. O protótipo atual não coleta analytics.

## Decisões em aberto

- Qual segmento e caso de uso devem liderar o MVP público?
- Qual será o limite entre comunidade aberta e espaços privados?
- Quais métricas podem ser coletadas com consentimento e retenção mínima?
- O formato de gamificação deve existir no primeiro lançamento?

## Documentos relacionados

[Identidade visual](OLIMPO_VISUAL_IDENTITY.md) · [Arquitetura 2D/3D](OLIMPO_2D_3D_ARCHITECTURE.md) · [Mapa do mundo](OLIMPO_WORLD_MAP.md) · [Fluxos](OLIMPO_USER_FLOWS.md) · [Modelo de dados](OLIMPO_DATA_MODEL.md) · [Segurança](OLIMPO_SECURITY.md) · [Backlog do MVP](OLIMPO_MVP_BACKLOG.md) · [Plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
