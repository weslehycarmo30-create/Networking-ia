# OLIMPO — arquitetura 2D/3D

**Versão:** 1.0 · **Data:** 24/10/2026 · Estado implementado em `codex/olimpo-002-foundation`.

## Visão geral

Aplicação cliente em React 19, TypeScript e Vite. A apresentação 3D usa Three.js por meio de React Three Fiber (`@react-three/fiber`). Os tipos e regras de domínio ficam em `src/domain/`; contratos e adaptador demonstrativo ficam em `src/services/`; conteúdo fictício fica em `src/data/`.

```text
src/ui/App.tsx ──┬── services/contracts.ts
                 ├── services/demo.ts ── domain/rules.ts
                 │                       domain/models.ts
                 ├── data/demo.ts ── data/territories.ts
                 └── lazy import ── scenes/City3D.tsx ── React Three Fiber / Three.js
```

## Camadas implementadas

- **Domínio:** `Avatar`, `Profile`, `TerritoryRoom`, `Message`, `Presence`, `Connection`, `DemoNotification` e `GamificationProgress`; validação de mensagens, convites e transições de conexão.
- **Serviços:** interfaces de salas, participantes, mensagens, perfil, conexões, encontros, notificações e gamificação.
- **Adaptador demo:** associa mensagens e presença a `roomId`; fornece perfis e conteúdo fictícios. Entrada/saída de sala é controlada por `ParticipantService` e a presença do perfil atual existe apenas em memória. Avatar, mensagens, conexões, inscrições de encontros e notificações são serializados de forma versionada no `localStorage` por `src/services/demo-storage.ts`; presença e restante do estado temporário ficam fora desse payload. Não é uma implementação de autenticação, realtime ou persistência de produção.
- **Apresentação:** `App.tsx` coordena navegação, seleção e consumo dos serviços. `ProfilePicker.tsx` é reutilizado na praça 2D e sobre a cena 3D.
- **Cena:** `City3D.tsx` recebe salas, perfis e callbacks do estado compartilhado. Não consulta uma fonte de dados independente.

## Caminho de renderização e fallback

1. A página abre na landing; a etapa de avatar antecede a entrada na praça.
2. A Praça Central começa no mapa 2D. A cena 3D é um `React.lazy()` carregado apenas após escolha explícita.
3. Na entrada, a aplicação verifica disponibilidade de WebGL. Se indisponível, o botão 3D fica indisponível e o mapa 2D permanece ativo.
4. Erro de renderização tratado por `SceneBoundary`, perda de contexto WebGL ou desempenho abaixo de 20 FPS em duas janelas consecutivas de 1,5 s retornam a interface ao 2D.
5. Controles HTML de território e perfil continuam ao redor da cena; a alternativa 2D oferece mapa, cartões de território e acesso às salas.

O fallback não substitui a necessidade de validar o comportamento em navegadores e dispositivos reais. Os marcadores geométricos no Canvas são selecionáveis por ponteiro; os controles HTML adjacentes oferecem seleção por teclado/toque.

## Desempenho observado e limite

O uso direto de `@react-three/drei` foi removido; geometria, antialiasing e DPR foram reduzidos. No build verificado durante OLIMPO-005, o chunk 3D ficou em aproximadamente **872,76 kB** e **235,27 kB gzip**. Esse valor varia com a compilação. Vite ainda avisa que o chunk ultrapassa 500 kB; o projeto não aumenta o limite nem esconde o aviso.

### Auditoria OLIMPO-013

Build local em `codex/olimpo-002-foundation` com Vite 6.4.5: `City3D` **879,72 kB / 236,66 kB gzip**; o chunk principal da aplicação é **272,48 kB / 83,42 kB gzip**. A cena permanece em importação dinâmica, portanto o chunk 3D só é solicitado ao escolher essa visualização. O total necessário à cena 3D é o chunk `City3D` indicado acima.

A inspeção do grafo Rollup identificou `three` como a maior parte do caminho 3D (núcleo, renderer e geometrias), seguido por `@react-three/fiber` (Canvas, eventos e integração React); o módulo da cena contém a construção dos marcos e controles. Não há `drei`, assets externos ou outros pacotes 3D. Todos os imports diretos em `City3D.tsx` são usados: Canvas e monitor de frame do Fiber, hooks de geometria instanciada, constructors de Three.js e seletor de perfis. A árvore já usa imports nomeados, `InstancedMesh` para colunas, sem antialiasing e DPR limitado. A compilação atual fica **6,96 kB / 1,39 kB gzip acima** da referência anterior ao OLIMPO-012. Remover esses recursos para atingir a referência reduziria conteúdo visual ou controles; dividir chunks apenas deslocaria o total transferido. Não foi encontrada dependência ou import não utilizado que pudesse ser removido com segurança. O alerta de Vite continua ativo; redução adicional depende de uma revisão arquitetural da cena ou de redução deliberada de conteúdo, não aprovada aqui.

## Limites atuais

- O adaptador é síncrono. Avatar, mensagens, conexões, denúncias, inscrições e notificações fictícios sobrevivem a recargas no mesmo navegador; presença e estado de interface reiniciam. O reset restaura o snapshot namespaced inicial sem dados de sessão.
- Dados persistidos inválidos retornam aos dados iniciais fictícios; erros de leitura/escrita e quota mantêm fallback em memória com aviso na interface. Presença não sincroniza entre usuários, abas ou dispositivos.
- Não há API, banco, autenticação, sincronização entre navegadores ou presença real.
- A cena 3D não é necessária para acessar mensagens, perfis ou networking.
- O `package.json` não inclui Supabase nem outros serviços externos.

## Evolução planejada, ainda sem decisão de implementação

Manter os contratos e trocar o adaptador por implementações de produção apenas após definir autenticação, autorização, armazenamento, atualização em tempo real, moderação, observabilidade e custos. Supabase pode ser avaliado para Auth, PostgreSQL/RLS, Realtime e Storage; nenhum projeto ou integração foi criado ou aprovado nesta missão. Ver [segurança](OLIMPO_SECURITY.md) e [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
