# OLIMPO — modelo de dados

**Versão:** 1.0 · **Data:** 24/10/2026 · Contratos TypeScript atuais e separação entre demonstração e produção.

## Modelo conceitual implementado

Os tipos estão em `src/domain/models.ts`. Os objetos são usados pelo adaptador `createDemoServices()` e são preenchidos com dados inteiramente fictícios. Uma parte do estado demonstrativo fica em memória e uma whitelist serializada é salva apenas no `localStorage` do navegador.

| Conceito | Campos atuais principais | Observações |
|---|---|---|
| `Avatar` | `id`, `label`, `emoji` | Seis opções ilustrativas; não são fotos nem identidade verificada. |
| `Profile` | `id`, `displayName`, `handle`, `avatar`, `bio`, `interests`, `gamification` | Perfil atual e perfis fictícios da comunidade. |
| `TerritoryRoom` | `id`, `name`, `domain`, `symbol`, `description`, `people`, `color`, `position`, `prompt` | `id` é a chave usada para separar mensagens e presença. `people` é número ilustrativo. |
| `Message` | `id`, `roomId`, `authorId`, `authorName`, `avatar`, `createdAt`, `text` | Cada mensagem tem `roomId`; envio é roteado e listado por sala. Limite local de texto: 300 caracteres. |
| `Presence` | `id`, `roomId`, `profileId`, `displayName`, `avatar`, `role`, `status` | Perfis fictícios de catálogo mais o perfil atual somente na sala em que entrou. O estado atual é temporário em memória; `online` não é heartbeat, realtime ou presença real. |
| `Connection` | `id`, `fromProfileId`, `toProfileId`, `status`, `createdAt` | Estados: `pending`, `accepted`, `declined`, `cancelled`. Regras validam remetente/destinatário em ações locais. |
| `GamificationProgress` | `level`, `points`, `badges` | Conteúdo estático demonstrativo. Não existe cálculo, ledger ou concessão de pontos. |

## Serviços e regras

`src/services/contracts.ts` define interfaces para salas, participantes, mensagens, perfil, conexões e progresso. `src/services/demo.ts` implementa as interfaces em memória. `src/domain/rules.ts` contém validações de mensagens e transições de conexão, fora dos componentes visuais.

O serviço inicia com mensagens distintas por sala e registros fictícios de conexão (convite recebido de Lia e conexão aceita com Caio). `src/services/demo-storage.ts` usa a chave namespaced `olimpo:demo-state` e payload com versão de schema `1`. O payload inclui somente ID do avatar atual, mensagens demonstrativas indexadas por sala e conexões. Mensagens e conexões são validadas contra IDs, salas, perfis, avatares, status, datas e limites conhecidos antes de uso. Versões ou dados inválidos retornam aos dados iniciais fictícios; falha de leitura/escrita/quota mantém o serviço em memória e expõe um aviso.

Presença, estado de navegação/visualização, rascunhos e notificações transitórias não entram no payload. Ao entrar, o serviço associa o participante atual à sala; ao voltar à Praça Central, remove sua presença. A troca de visualização 2D/3D mantém a mesma sala ativa. **Reiniciar demonstração** remove somente `olimpo:demo-state`, limpa a presença temporária e repõe o avatar, mensagens e conexões iniciais em memória sem recarregar. Não há conta, backend, banco ou sincronização entre usuários, abas ou dispositivos; essa persistência local não é armazenamento de produção.

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
