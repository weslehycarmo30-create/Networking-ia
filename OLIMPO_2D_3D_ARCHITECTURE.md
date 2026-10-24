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

- **Domínio:** `Avatar`, `Profile`, `TerritoryRoom`, `Message`, `Presence`, `Connection` e `GamificationProgress`; validação de mensagens, convites e transições de conexão.
- **Serviços:** interfaces de salas, participantes, mensagens, perfil, conexões e gamificação.
- **Adaptador demo:** associa mensagens e presença a `roomId`; fornece perfis e conteúdo fictícios. Avatar, mensagens e conexões são serializados de forma versionada no `localStorage` por `src/services/demo-storage.ts`; o restante do estado fica em memória. Não é uma implementação de autenticação ou persistência de produção.
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

## Limites atuais

- O adaptador é síncrono. Avatar, mensagens e conexões fictícios sobrevivem a recargas no mesmo navegador; presença e estado de interface reiniciam. O reset remove somente a chave namespaced do OLIMPO.
- Dados persistidos inválidos retornam aos dados iniciais fictícios; erros de leitura/escrita e quota mantêm fallback em memória com aviso na interface.
- Não há API, banco, autenticação, sincronização entre navegadores ou presença real.
- A cena 3D não é necessária para acessar mensagens, perfis ou networking.
- O `package.json` não inclui Supabase nem outros serviços externos.

## Evolução planejada, ainda sem decisão de implementação

Manter os contratos e trocar o adaptador por implementações de produção apenas após definir autenticação, autorização, armazenamento, atualização em tempo real, moderação, observabilidade e custos. Supabase pode ser avaliado para Auth, PostgreSQL/RLS, Realtime e Storage; nenhum projeto ou integração foi criado ou aprovado nesta missão. Ver [segurança](OLIMPO_SECURITY.md) e [plano de fase 2](OLIMPO_PHASE_2_PLAN.md).
