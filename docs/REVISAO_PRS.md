# Revisão da cadeia de PRs #1 a #11 (OLIMPO-075 a 085)

Revisão crítica feita como um segundo revisor, em 21/11/2026, sobre o diff completo
`codex/olimpo-002-foundation..codex/olimpo-085-seed-data-integrity` (11 commits de item mais 1 de
correção desta revisão; cerca de 1.050 linhas, a maior parte testes e documentação). Nenhuma dependência nova foi
adicionada em toda a cadeia (`package-lock.json` não mudou).

## Resumo rápido

- **Dá para juntar tudo de uma vez.** A cadeia é linear: a base (`840bae3`) é ancestral do topo,
  então `git merge --ff-only` da branch do topo na base funciona, sem commit de merge e sem
  conflitos. Detalhes na seção "Ordem de merge".
- **Código de produção que muda:** `App.tsx`, `NotificationCenter.tsx`, `MemberDiscovery.tsx`,
  `CommunityEvents.tsx`, `ProfilePicker.tsx`, `styles.css`, `demo.ts`, `demo-storage.ts`,
  `member-discovery.ts` e o novo `text-search.ts`. O resto é teste, documentação e CI.
- **Riscos reais, em ordem:** (1) o CI da #9 nunca rodou, então não há prova de que o workflow
  funciona; (2) o tratamento de foco em `App.tsx` (PRs #1 a #3) só foi validado à mão, sem
  teste automatizado; (3) a validação no navegador foi feita com o painel oculto e quadros
  simulados, sem leitor de tela e sem celular.
- **Achados da revisão, corrigidos** (commit `9cb3fba`, no topo): um rótulo acessível que não
  continha o texto visível e o script `npm test`. Veja "O que a revisão encontrou".

## Por PR

Cada PR está empilhado sobre o anterior (a base do #1 é `codex/olimpo-002-foundation`). "Testar
em 2 minutos" parte de `git checkout <branch>`, `npm ci` e `npm run dev`; os testes automáticos
dos PRs de testes valem a partir da branch do #5 (`npm test`).

| PR | Item | O que muda | Risco | Testar em 2 minutos |
|---|---|---|---|---|
| [#1](https://github.com/weslehycarmo30-create/Networking-ia/pull/1) | 075 | Topo da página deixava de caber entre 681 e ~900 px; foco do teclado ao ativar "Explorar 3D" sem WebGL; símbolos decorativos fora dos nomes acessíveis. | Baixo: CSS de uma faixa de largura e atributos `aria-hidden`. | Abra a Praça com a janela em 768 px: sem barra de rolagem horizontal. Com Tab, o foco passa por todos os botões do topo. |
| [#2](https://github.com/weslehycarmo30-create/Networking-ia/pull/2) | 076 | Foco volta a um controle útil após aceitar/recusar/cancelar convite, marcar notificação como lida e remover das salvas; botões repetidos passam a citar pessoa/encontro; plural "1 não lida". | Médio: mexe nos manipuladores de `App.tsx` e `NotificationCenter.tsx`. | Perfil → Tab até "Aceitar convite de Lia" → Enter: o foco vai para o título do grupo, não some. Sino → "Marcar como lida": foco permanece no painel. |
| [#3](https://github.com/weslehycarmo30-create/Networking-ia/pull/3) | 077 | Foco nos fallbacks do 3D (perda de contexto, erro, FPS baixo) e na nova tentativa; nome acessível dos perfis. | Médio-baixo: lógica nova em `failScene` e `request3D`. | "Explorar 3D" → foque um botão da câmera → no console: `document.querySelector('canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`. O foco vai para "Tentar 3D novamente". |
| [#4](https://github.com/weslehycarmo30-create/Networking-ia/pull/4) | 078 | Duas cores com contraste abaixo de 4,5:1 (rodapé e contador de notificações). | Muito baixo: dois valores de cor. | Olhe o rodapé da landing e a bolinha do sino: legíveis, sem mudança visual perceptível. |
| [#5](https://github.com/weslehycarmo30-create/Networking-ia/pull/5) | 079 | `npm test` com 28 testes (domínio, adaptador, persistência). Corrige o aviso de dados corrompidos, que sumia ao iniciar. | Baixo: só altera `demo-storage.ts`/`demo.ts` na gravação inicial. | `npm test`. Na página: `localStorage.setItem('olimpo:demo-state','{x')`, recarregue: o aviso "dados iniciais restaurados" aparece no topo. |
| [#6](https://github.com/weslehycarmo30-create/Networking-ia/pull/6) | 080 | 41 testes (migração de todas as versões 1 a 10). Corrige "Reiniciar" (faltava o aviso do convite de Lia) e ids de convite que podiam repetir após importar. | Médio-baixo: o formato do id novo é `demo-connection-<uuid>`; ids antigos continuam válidos. | Perfil → "Reiniciar demonstração": o sino volta a mostrar 1 aviso. Descoberta → "Enviar convite": funciona e persiste ao recarregar. |
| [#7](https://github.com/weslehycarmo30-create/Networking-ia/pull/7) | 081 | Busca da sala e navegação entre resultados movidas para `src/domain/text-search.ts`, usado também pela descoberta. | Baixo: refatoração sem mudança de comportamento para português. | Numa sala, envie "Ação"; busque "acao": acha. Próximo/Anterior dão a volta. |
| [#8](https://github.com/weslehycarmo30-create/Networking-ia/pull/8) | 082 | 15 testes (navegação, presença, encontros, perfil). | Nenhum no app (só testes). | `npm test`: 64 testes. |
| [#9](https://github.com/weslehycarmo30-create/Networking-ia/pull/9) | 083 | Workflow de CI e `engines.node >= 22.18`. | Médio, por ser **não verificado**: o workflow nunca rodou no GitHub. | `npm run lint && npm test && npm run build` localmente (é o que o CI repete). Depois, aba **Actions** do repositório. |
| [#10](https://github.com/weslehycarmo30-create/Networking-ia/pull/10) | 084 | Documentos alinhados ao código (persistência de avatar, conexões e rascunhos; migração 1 a 5). | Nenhum no app (só documentação). | Leia o diff dos `.md`; confira por amostragem contra `demo-storage.ts`. |
| [#11](https://github.com/weslehycarmo30-create/Networking-ia/pull/11) | 085 | 9 testes de integridade dos dados de exemplo, as duas correções desta revisão e este documento. | Nenhum no app além do rótulo corrigido. | `npm test` (73 testes). Salvas → o botão dá "Abrir sala e localizar mensagem de …". |

## O que a revisão encontrou

**Corrigido (commit `9cb3fba`, no topo da cadeia; um commit novo, sem reescrever branches
publicadas):**

1. **Rótulo acessível sem o texto visível** (pertence ao #2). O botão exibia "Abrir sala e
   localizar mensagem", mas o nome acessível era "Abrir sala e localizar *a* mensagem de X".
   Isso quebra a regra "rótulo no nome" (WCAG 2.5.3): quem usa comando de voz diz o texto que
   vê e o botão não responde. Agora o nome é "Abrir sala e localizar mensagem de X". Os demais
   rótulos novos foram conferidos um a um e contêm o texto visível.
2. **Script `npm test` apontava para o diretório `tests/`** (pertence ao #5). O executor de
   testes do Node trata argumentos como padrões de arquivo, e o comportamento com diretório
   mudou entre versões. Agora usa `tests/*.test.ts`, que funciona igual em qualquer versão
   suportada. O README passou a dizer Node 22.18 ou mais novo.

**Observado e deixado como está (risco baixo, vale saber):**

- **Heurística de foco em `failScene`** (#3): considera que o foco "estava na cena" quando
  `document.body` tem o foco e o último elemento focado foi removido. Só dispara com a cena 3D
  montada, então um falso positivo exigiria uma sequência improvável; mas ela não tem teste.
- **Nome acessível dos perfis** (#3): "Ver perfil de Lia, @lia.cria" contém todas as partes do
  texto visível ("Lia", "@lia.cria", "Ver perfil"), mas em outra ordem; comandos de voz com a
  frase inteira na ordem visual podem não casar. Dizer só "Ver perfil" ou o nome funciona.
- **`restoreFocusNear` escolhe a primeira ação restante** do grupo/cartão (não a "próxima"
  em relação à posição anterior); o comentário foi ajustado para dizer isso.

**Sem achados:** conflito de ids nas migrações (coberto pelos 41 testes de #6), vazamento de
listener (`focusin` é removido no `useEffect`), segredos ou arquivos de ambiente no diff
(nenhum arquivo `.env`, chave ou pasta `.claude` está versionado), dependências (nenhuma nova).

## O que ainda não foi verificado

- **CI do #9:** o arquivo está na branch e o Actions está habilitado, mas não houve nenhuma
  execução. O gatilho de PR não filtra base, então não é o filtro. Abra a aba **Actions**; se o
  arquivo tiver erro, aparece lá.
- **Validação no navegador:** foi feita no navegador embutido do app com o painel oculto, e
  `requestAnimationFrame`/`ResizeObserver` foram simulados para a cena 3D iniciar. Portanto:
  **FPS e tempo de carregamento reais nunca foram medidos**.
- **Sem leitor de tela** e **sem dispositivo móvel físico**; `prefers-reduced-motion` só foi
  revisado no código, não emulado.
- **Sem testes de interface** (foco, teclado): exigiriam `vitest`, `jsdom` e
  `@testing-library/*`, que dependem de aprovação.

## Ordem de merge

Como a cadeia é linear (cada commit tem exatamente o anterior como pai), a ordem é a da
tabela: #1, #2, ..., #11.

### Opção A: tudo de uma vez por fast-forward (recomendada se você aceitar rever o conjunto)

A base é ancestral do topo, então não há conflito possível:

```bash
git fetch origin
git switch codex/olimpo-002-foundation
git merge --ff-only origin/codex/olimpo-085-seed-data-integrity
git push origin codex/olimpo-002-foundation
```

Pontos de atenção:

- Isso **altera a branch base no remoto**, e por isso só deve ser feito por você ou com o seu
  aval explícito.
- Normalmente o GitHub marca como "Merged" os PRs cujos commits passam a existir na base. Se
  algum ficar aberto, feche-o manualmente; nada se perde.
- O push na base dispara o CI (`push` na `codex/olimpo-002-foundation`): é um bom primeiro
  teste real do workflow.
- Você perde a revisão separada por PR; use esta tabela como roteiro.

### Opção B: um PR por vez

Para cada PR, na ordem: mesclar usando **"Create a merge commit"** (não "Squash" nem
"Rebase"), confirmar que o PR seguinte passou a ter como base `codex/olimpo-002-foundation`
(o GitHub reajusta ao apagar a branch do anterior) e seguir. **Squash ou rebase quebram a
cadeia:** o commit novo tem outro hash e os PRs seguintes passam a mostrar conflitos que não
existem de verdade.

### Antes de qualquer merge

```bash
npm ci && npm run lint && npm test && npm run build
```

Tudo passa na branch do topo (73 testes). O build mantém o aviso antigo do chunk 3D acima de
500 kB (884,95 kB / 238,10 kB gzip); ele existe desde antes e não foi tocado.
