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
3. Na entrada e antes de cada tentativa, a aplicação verifica a criação de um contexto WebGL temporário e libera esse contexto de sondagem. Se WebGL não estiver disponível nessa verificação, o botão 3D fica indisponível, o mapa 2D permanece ativo e a pessoa pode verificar novamente.
4. Erro tratado por `SceneBoundary`, perda de contexto WebGL e desempenho abaixo de 20 FPS em duas janelas consecutivas de 1,5 s são causas separadas de fallback. Todas retornam ao mapa 2D sem alterar a disponibilidade detectada de WebGL.
5. Após falha recuperável, uma mensagem informa a causa e oferece **Tentar 3D novamente**; o controle de visualização 3D também permanece disponível. Cada pedido explícito incrementa a chave da cena e remonta `City3D`/Canvas, reiniciando o monitor de frames e o limite de tentativa. Não há repetição automática nem ciclo de fallback. A seleção de território pertence a `App` e é preservada.
6. Controles HTML de território e perfil continuam ao redor da cena; a alternativa 2D oferece mapa, cartões de território e acesso às salas.

O fallback não substitui a necessidade de validar o comportamento em navegadores e dispositivos reais. Os marcadores geométricos no Canvas são selecionáveis por ponteiro; os controles HTML adjacentes oferecem seleção por teclado/toque.

### Diagnóstico de retorno ao 3D (OLIMPO-069)

A causa do bloqueio era o estado de fallback no `App.tsx`: `failScene` tratava erro de renderização, perda de contexto e FPS baixo como `webgl=false`. Isso mostrava a mensagem incorreta de WebGL indisponível e desabilitava o controle 3D. Voltar ao mapa 2D apenas mudava `view`, portanto não removia essa flag. Agora `webgl` representa apenas o resultado da sondagem de suporte; `sceneFailure` registra `render-error`, `context-lost` ou `performance`. Falha recuperável preserva o controle de nova tentativa. Um resultado negativo da sondagem diz somente que WebGL não foi disponibilizado naquele momento e oferece nova verificação; não atribui a causa exclusivamente ao navegador.

**Verificação manual em navegador com WebGL:** (1) abrir a Praça Central em 2D; (2) escolher **Explorar 3D** e aguardar a cena; (3) escolher **Mapa 2D**; (4) escolher **Explorar 3D** de novo. A cena deve remontar sem aviso de WebGL indisponível, mantendo o território selecionado. Repetir 2D→3D deve continuar sendo uma ação manual. Para verificar o fallback de contexto em DevTools, com a cena aberta, pode-se executar `const c=document.querySelector('.city-map canvas'); const g=c?.getContext('webgl2')||c?.getContext('webgl'); g?.getExtension('WEBGL_lose_context')?.loseContext()`; deve aparecer a causa de contexto perdido e uma ação para tentar novamente. Para verificar o fallback por FPS, reduzir o desempenho do dispositivo/emulador até o monitor registrar duas janelas consecutivas abaixo de 20 FPS; a mensagem deve identificar desempenho, e nova tentativa permanece explícita. Se a sondagem de suporte falhar, o mapa 2D continua operável e **Verificar WebGL novamente** pode reavaliar a condição.

Na auditoria OLIMPO-069, a inspeção de código confirmou o estado compartilhado, os três motivos de fallback e o remount explícito. O inventário do controlador de computador desta sessão não retornou aplicativos, navegadores nem provedor de browser; portanto, não foi possível reproduzir nem conferir visualmente o ciclo ou os fallbacks. Os passos acima permanecem validação manual pendente.

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
