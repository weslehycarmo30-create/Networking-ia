# OLIMPO — modelo de dados

**Versão:** 1.0 · **Data:** 24/10/2026 · Contratos TypeScript atuais e separação entre demonstração e produção.

## Modelo conceitual implementado

Os tipos estão em `src/domain/models.ts`. Os objetos são usados pelo adaptador `createDemoServices()` e são preenchidos com dados inteiramente fictícios. Uma parte do estado demonstrativo fica em memória e uma whitelist serializada é salva apenas no `localStorage` do navegador.

| Conceito | Campos atuais principais | Observações |
|---|---|---|
| `Avatar` | `id`, `label`, `emoji` | Seis opções ilustrativas; não são fotos nem identidade verificada. |
| `Profile` | `id`, `displayName`, `handle`, `avatar`, `bio`, `interests`, `territoryAffinities`, `gamification` | Perfil atual e perfis fictícios. `territoryAffinities` usa IDs de `TerritoryRoom` e expressa temas que o perfil quer explorar. |
| `TerritoryRoom` | `id`, `name`, `domain`, `symbol`, `description`, `people`, `color`, `position`, `prompt` | `id` é a chave usada para separar mensagens e presença. `people` é número ilustrativo. |
| `Message` | `id`, `roomId`, `authorId`, `authorName`, `avatar`, `createdAt`, `text` | Cada mensagem tem `roomId`; envio é roteado e listado por sala. Limite local de texto: 300 caracteres. |
| `Presence` | `id`, `roomId`, `profileId`, `displayName`, `avatar`, `role`, `status` | Perfis fictícios de catálogo mais o perfil atual somente na sala em que entrou. O estado atual é temporário em memória; `online` não é heartbeat, realtime ou presença real. |
| `Connection` | `id`, `fromProfileId`, `toProfileId`, `status`, `createdAt` | Estados: `pending`, `accepted`, `declined`, `cancelled`. Regras validam remetente/destinatário em ações locais. |
| `DemoReport` | `id`, `targetType`, `targetId`, `reason`, `note?`, `createdAt` | Registro demonstrativo local para mensagem ou perfil fictício; um por item, sem fila de moderação. Nota opcional limitada a 240 caracteres. |
| `GamificationProgress` | `level`, `points`, `badges` | Conteúdo estático demonstrativo. Não existe cálculo, ledger ou concessão de pontos. |
| `CommunityEvent` | `id`, `title`, `description`, `startsAt`, `territoryId`, `organizerProfileId`, `participantCount` | Encontro fictício estático ligado a um território e a um perfil organizador existente. |
| `EventRegistration` | `eventId`, `profileId` | Inscrição local do participante atual; única alteração do participante persistida para encontros. |
| `DemoNotification` | `id`, `kind`, referência de perfil/convite ou evento, `createdAt`, `readAt?` | Convite de exemplo ou atualização local de inscrição; itens lidos recebem `readAt`. Não representa entrega por servidor. |
| `NotificationPreferences` | `connectionInvites`, `eventActivity` | Preferências locais para geração dos avisos fictícios de convite e atividade de eventos; não controlam canais externos. |

## Serviços e regras

`src/services/contracts.ts` define interfaces para salas, participantes, mensagens, perfil, conexões e progresso. `src/services/demo.ts` implementa as interfaces em memória. `src/domain/rules.ts` contém validações de mensagens e transições de conexão, fora dos componentes visuais.

O serviço inicia com mensagens distintas por sala e registros fictícios de conexão (convite recebido de Lia e conexão aceita com Caio). `src/services/demo-storage.ts` usa a chave namespaced `olimpo:demo-state` e payload com versão de schema `5`. O payload inclui avatar, mensagens por sala, conexões, denúncias, inscrições, notificações com estado de leitura e preferências locais de notificações. Versões `1` a `4` migram com as duas preferências ativadas por padrão; dados de notificações e leitura da versão `4` são preservados e validados. As preferências são validadas como booleanos. Categorias desativadas têm seus avisos demonstrativos removidos e novos avisos de atividade local não são registrados; reativar não recria itens passados. Falha de leitura/escrita/quota mantém o serviço em memória e expõe um aviso.

Presença, estado de navegação/visualização, rascunhos, toasts e feedback transitório não entram no payload. Ao entrar, o serviço associa o participante atual à sala; ao voltar à Praça Central, remove sua presença. A troca de visualização 2D/3D mantém a mesma sala ativa. **Reiniciar demonstração** remove o snapshot anterior de `olimpo:demo-state`, limpa a presença temporária e apaga os registros de denúncia, restaurando avatar, mensagens, conexões, inscrições e notificações vazias, além de reativar as duas preferências locais, sem recarregar; os encontros fixos permanecem disponíveis. Denúncias não são exibidas a outros participantes e nunca são recebidas por moderadores. Não há conta, backend, banco ou sincronização entre usuários, abas ou dispositivos; essa persistência local não é armazenamento de produção.

`Profile.territoryAffinities` contém IDs existentes do catálogo `TerritoryRoom` e é preenchido com afinidades inteiramente fictícias nos perfis iniciais. A Ágora filtra por território e interesse em conjunto com a busca textual. Afinidade temática descreve assuntos que o perfil quer explorar; não indica em qual sala está. Presença continua sendo um estado separado, temporário e nunca é inferida nem salva a partir das afinidades.

## Relações conceituais

```text
Profile 1 ── * Message * ── 1 TerritoryRoom
Profile 1 ── * Presence * ── 1 TerritoryRoom
Profile (from) 1 ── * Connection * ── 1 Profile (to)
Profile 1 ── 1 Avatar
Profile 1 ── 1 GamificationProgress
```

## Mapeamento futuro, ainda não aprovado

Uma persistência de produção precisaria definir chaves estáveis, timestamps e regras de retenção; separar conteúdo de presença transitória; evitar expor mensagens de salas sem autorização; e modelar notificações/abuso. Se Supabase for escolhido após avaliação, uma opção conceitual seria PostgreSQL para perfis, salas, mensagens e conexões, RLS para autorização, Realtime para eventos de sala e Storage somente se houver mídia aprovada. Isso não é schema, migração nem decisão aprovada. Ver [segurança](OLIMPO_SECURITY.md) e [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).

## Encontros demonstrativos (OLIMPO-014)

`CommunityEvent` define `id`, `title`, `description`, `startsAt`, `territoryId`, `organizerProfileId` e `participantCount`. Os encontros fictícios ficam em `src/data/events.ts`; `territoryId` usa os IDs tipados existentes e `organizerProfileId` aponta para um perfil fictício já disponível. A contagem é demonstrativa e calculada pelo serviço a partir do número inicial e da inscrição local ativa.

`EventRegistration` contém apenas `eventId` e `profileId`. O serviço permite inscrever/cancelar somente o perfil atual, evita duplicatas e valida o ID do encontro. A versão `3` do payload namespaced `olimpo:demo-state` adiciona `eventRegistrations`; versões anteriores válidas migram com lista vazia. O carregamento valida IDs de evento e perfil, limita o tamanho e rejeita duplicatas; dados inválidos voltam ao estado inicial fictício. O reset remove as inscrições junto com os demais dados demonstrativos persistidos. Nem os eventos nem as inscrições são publicados ou compartilhados, e não há criação de evento, calendário ou presença ao vivo.

`DemoNotification` é um registro local tipado: convites apontam para a conexão e perfil fictícios existentes; atualizações apontam para evento existente e ação local de inscrição/cancelamento. O texto é montado com os perfis e eventos do catálogo. `NotificationPreferences` controla localmente se cada categoria pode gerar avisos nesta demonstração. Opt-out remove os itens já registrados daquela categoria e impede novos registros locais; reativar não recria avisos anteriores. A versão `5` inclui `notifications`, `readAt` e preferências; versões `1` a `4` migram com preferências ativadas, preservando os avisos válidos da versão `4`. O reset apaga o histórico e restaura as preferências padrão ativadas.
