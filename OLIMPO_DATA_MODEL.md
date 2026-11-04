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

O serviço inicia com mensagens distintas por sala e registros fictícios de conexão (convite recebido de Lia e conexão aceita com Caio). `src/services/demo-storage.ts` usa a chave namespaced `olimpo:demo-state` e payload com versão de schema `10`. O payload inclui avatar, mensagens por sala, rascunhos por sala, conexões, denúncias, inscrições, notificações com estado de leitura, preferências e referências de mensagens salvas. Versões `1` a `9` migram sem perder campos existentes; campos introduzidos depois são preenchidos pelos valores padrão correspondentes. Versões `1` a `4` migram com as duas preferências ativadas por padrão. Falha de leitura/escrita/quota mantém o serviço em memória e expõe um aviso.

Presença, estado de navegação/visualização, toasts e feedback transitório não entram no payload. Rascunhos ficam no snapshot persistido como texto separado por sala e não são enviados até a ação explícita de envio. Ao entrar, o serviço associa o participante atual à sala; ao voltar à Praça Central, remove sua presença. A troca de visualização 2D/3D mantém a mesma sala ativa. **Reiniciar demonstração** remove o snapshot anterior de `olimpo:demo-state`, limpa a presença temporária e apaga os registros de denúncia e rascunhos, restaurando avatar, mensagens, conexões, inscrições e notificações vazias, além de reativar as duas preferências locais, sem recarregar; os encontros fixos permanecem disponíveis. Denúncias não são exibidas a outros participantes e nunca são recebidas por moderadores. Não há conta, backend, banco ou sincronização entre usuários, abas ou dispositivos; essa persistência local não é armazenamento de produção.

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

## Reações locais às mensagens (OLIMPO-066)

Cada `Message` contém `reactions`, uma lista de registros `{ profileId, emoji }`. A demonstração aceita 👍, 💡 e ❤️ e mantém no máximo uma reação por mensagem, pertencente ao perfil fictício atual. Selecionar outra troca a reação; selecionar a mesma remove. Os dados seguem junto das mensagens no estado namespaced `olimpo:demo-state`, agora na versão `7`. Estados válidos das versões `1` a `5` migram com `reactions: []`; o carregamento valida emoji permitido, perfil atual e cardinalidade. **Reiniciar demonstração** recria as mensagens iniciais e apaga as reações. Se `localStorage` estiver indisponível, o serviço continua funcionando em memória. Reações são locais a este navegador e não representam atividade de outras pessoas, não são sincronizadas e não são enviadas.

## Mensagens salvas locais (OLIMPO-067)

`SavedMessageReference` guarda somente `messageId` e `roomId`; o conteúdo, autor, horário e reações continuam sendo obtidos de `Message`. O serviço demonstrativo mantém as mesmas referências consumidas pela interface, compartilhadas pela sala independentemente de a praça estar em 2D ou 3D. A lista apresenta mensagens agrupadas pelo território, permite remover uma referência e abrir a sala de origem com a mensagem focada e trazida à vista. Referências sem mensagem disponível são omitidas ao carregar; a interface também oferece remoção segura se uma mensagem ficar indisponível durante a sessão.

O schema namespaced `olimpo:demo-state` passou da versão `6` para `7` ao introduzir `savedMessages`, e da versão `7` para `8` ao introduzir `draftsByRoom`. A migração de `7` para `8` preserva todos os campos existentes e acrescenta rascunhos vazios; versões `1` a `6` também chegam ao schema atual pelas migrações compatíveis existentes. A validação de `draftsByRoom` é independente: aceita somente IDs de salas conhecidas e strings não vazias de até 300 caracteres; entradas inválidas são ignoradas sem invalidar o restante do estado.

Salvar persiste apenas as referências, no mesmo snapshot local do navegador. Referências inválidas, de outra sala ou duplicadas são descartadas individualmente na carga e na importação; o restante do estado válido é mantido. Falha de leitura ou gravação mantém a lista em memória durante a sessão e informa essa limitação. **Reiniciar demonstração** limpa `savedMessages` junto com o avatar, mensagens, reações, convites, notificações, inscrições e preferências reiniciadas. Os itens salvos não são compartilhados com outras pessoas, servidores, abas ou dispositivos; não há backend ou sincronização.

## Rascunhos locais por sala (OLIMPO-070)

`MessageService` lê e grava um rascunho por ID de sala no mesmo serviço demonstrativo compartilhado pelas vistas 2D e 3D. A troca de sala carrega o texto da sala de destino sem enviar nem misturar mensagens. Sugestões estáticas substituem ou acrescentam ao rascunho atual respeitando o limite de 300 caracteres. O serviço limpa somente o rascunho da sala atual depois de criar e registrar uma mensagem com sucesso; texto vazio/inválido ou erro mantém o rascunho.

O schema `8` persiste `draftsByRoom` como um mapa de IDs de sala para strings. Ao carregar/importar, IDs desconhecidos, valores que não sejam strings ou textos acima de 300 caracteres são descartados individualmente, sem invalidar avatar, mensagens, reações, salvos, convites, denúncias, notificações, preferências ou inscrições. Schemas `1` a `7` migram com `{}` para rascunhos. A exportação schema `8` inclui os rascunhos; a importação de schemas antigos mantém a migração atual e importa rascunhos vazios. O reset limpa todos os rascunhos. Se o armazenamento local falhar, mudanças permanecem no serviço em memória durante esta sessão e a interface informa esse limite. Rascunhos são locais ao navegador, não enviados e não compartilhados.

## Respostas locais no chat (OLIMPO-071)

`Message.replyToMessageId?: Message['id']` vincula uma resposta à mensagem direta de origem na mesma sala. O serviço valida a existência da origem dentro da coleção da sala ao enviar; referências cruzadas, ausentes e autorreferências não são aceitas. A interface exibe o autor e um trecho do texto original no compositor e no balão da resposta. A citação é sempre da mensagem direta, sem encadear respostas. Cancelar a resposta limpa somente a referência selecionada e preserva o draft por sala. Se a origem ficar indisponível, a mensagem mantém o conteúdo e mostra um aviso sem link quebrado.

O schema namespaced passou de `8` para `9`; a migração mantém as mensagens antigas sem vínculo de resposta e preserva drafts, reações, salvos, perfil/avatar, mensagens, convites, denúncias, eventos, inscrições, notificações e preferências. Na validação, mensagens e referências são resolvidas em duas passagens por sala: uma origem ausente, cruzada ou autorreferente tem somente seu ID removido, com `replyUnavailable: true` para exibir o contexto indisponível; os demais dados permanecem válidos. Exportação/importação mantém o envelope `formatVersion: 1`, inclui os vínculos no schema `9` e aceita schemas de estado `1` a `9`. Respostas e mensagens pertencem somente à demonstração local; não são enviadas a servidores nem compartilhadas.

## Edição e remoção de mensagens (OLIMPO-072)

O serviço expõe edição e remoção por sala e ID; cada operação procura a mensagem somente na coleção daquela sala e compara `authorId` ao perfil atual. A edição passa por `normalizeMessageText` (trim, não vazio e até 300 caracteres) e atualiza somente o texto, preservando sala, autoria, horário, reações, respostas e denúncias.

A remoção é lógica. O registro permanece com o mesmo ID, sala, autor, horário e reações, mas recebe `deleted: true` e texto marcador. Assim, mensagens de resposta, referências salvas e denúncias continuam resolvidas; a interface mostra o marcador em respostas e itens salvos. Apenas mensagens não removidas do perfil atual exibem os controles de edição e remoção, e a remoção pede confirmação explícita.

O schema `10` acrescenta a marca `deleted` às mensagens. Estados e arquivos schemas `1` a `9` continuam aceitos; mensagens antigas sem essa marca migram como ativas. Quando a marca existe, a carga/importação substitui qualquer texto pelo marcador antes de expor ou exportar o estado. Reações ausentes, malformadas ou excedentes são descartadas até restar no máximo uma válida. Denúncias, notas de denúncia, referências salvas e `readAt` inválidos são descartados individualmente. IDs de mensagem são únicos entre salas; colisões invalidam o snapshot para evitar que reações, salvos e denúncias apontem para uma mensagem ambígua. Exportação inclui os marcadores; importação mantém referências válidas, denúncias, reações e salvos. Reset restaura as mensagens fictícias iniciais. Se o armazenamento falhar, as operações duram somente na memória da sessão. A persistência é local e fictícia, não uma autorização de segurança de produção.

## Exportação e importação manual (OLIMPO-068)

A transferência usa o envelope JSON `{ format: "olimpo-demo-data", formatVersion: 1, exportedAt, state }`. `state` é o snapshot persistido validado pelo serviço, schema `10`: avatar, mensagens, vínculos de resposta, marcadores de remoção e reações, rascunhos por sala, referências salvas, conexões/convites, denúncias demonstrativas, inscrições, notificações e preferências. Presença temporária e estado da interface ficam de fora. A exportação é gerada no dispositivo e baixada como arquivo; nenhum envio remoto ocorre.

A importação limita o arquivo a 5 MiB, exige JSON e o identificador/versão de formato reconhecidos e valida o snapshot com `validatePersistedDemoState`. São aceitos schemas `1` a `10`, migrados para `10`; versões `1` a `7` recebem rascunhos vazios e versões `1` a `8` recebem mensagens sem vínculo de resposta. Vínculos inválidos têm somente a referência removida, sem rejeitar os demais dados válidos. Valores inválidos de rascunho, reações, denúncias e referências salvas são ignorados individualmente. Schemas `7` a `10` limitam a lista bruta a 2.500 referências; referências inválidas ou duplicadas não substituem nem descartam mensagens válidas. IDs de mensagem duplicados entre salas tornam o snapshot ambíguo e são rejeitados. Uma prévia resume os dados normalizados e a substituição só ocorre após confirmação explícita. Arquivo inválido não altera o serviço nem o armazenamento.

Após confirmar, o mesmo serviço substitui todos os campos persistidos e limpa a presença temporária. Se o `localStorage` não aceitar a gravação, o novo snapshot permanece em memória nesta sessão e a interface avisa que será perdido ao fechar a aba. **Reiniciar demonstração** continua restaurando o estado fictício inicial e não depende de exportação/importação. O arquivo JSON pode conter mensagens e outros dados fictícios; permanece no dispositivo, sem criptografia, e deve ser guardado com cuidado.
