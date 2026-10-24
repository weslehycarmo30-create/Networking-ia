# OLIMPO — identidade visual

**Versão:** 1.0 · **Data:** 24/10/2026 · Complementa [a especificação do produto](OLIMPO_PRODUCT_SPEC.md).

## Direção de arte

OLIMPO combina referências à mitologia grega e à disciplina visual espartana com uma cidade futurista. A direção desejada usa pedra, bronze, luz mineral e tecnologia integrada à arquitetura; armaduras tecnológicas podem aparecer em personagens e ilustrações futuras.

**Estado real:** o protótipo já usa nomes mitológicos, um monograma circular, anéis e formas inspiradas em praça/colunata, fundos escuros, bronze e ciano. A praça 3D mostra o Santuário de Zeus como marco central e formas procedurais distintas para os seis territórios; as colunas repetidas usam instancing. A vista 2D também identifica o santuário no centro do mapa orbital. Armaduras tecnológicas e personagens 3D detalhados continuam sendo uma direção futura.

## Paleta observada no código

| Uso | Valor atual | Aplicação |
|---|---|---|
| Fundo principal | `#101820` | Fundo da página |
| Painel | `#172229` | Cartões e superfícies |
| Painel alternativo | `#1b282f` | Cartões e controles |
| Texto principal | `#e9e5dc` | Conteúdo de primeiro plano |
| Texto secundário | `#9ca7a6` | Descrições e metadados |
| Bronze | `#c1935e` | Ações principais e acentos |
| Ciano | `#75d9d0` | Foco, seleção e acentos de estado |

Os seis territórios também usam cores próprias definidas em `src/data/territories.ts`. Não devem ser o único sinal de significado: manter nome, símbolo e estado textual.

## Tipografia e componentes atuais

- Texto e títulos usam pilha Arial/Helvetica sans-serif. A variável CSS `--serif` também aponta para Arial; não há uma família serifada distinta implementada.
- Metadados e pequenos rótulos usam Courier New monoespaçada.
- Componentes existentes: barra superior, botões de ação, cartões de território, mapa 2D, painel de sala/chat, cartões de perfil, chips de presença, seletor de avatar e seletor de perfis.
- Estados de foco usam contorno ciano com `:focus-visible`; estados selecionados têm contorno e preenchimento próprios.

## Apresentação 2D e 3D

- **2D:** mapa orbital com seis botões de território, cartões de acesso às salas e alternativa completa para navegar sem WebGL. Serve como referência de legibilidade e acesso por teclado/toque.
- **3D:** Canvas com praça circular, iluminação e marcadores de território. A seleção de território e perfis também tem controles HTML, e a escolha é compartilhada com a navegação da aplicação.
- O 3D é carregado sob demanda. O alerta de tamanho do chunk permanece visível no build.

## Acessibilidade visual

Manter contraste de texto e estados, rótulos visíveis, áreas de toque adequadas, foco evidente, operação por teclado e estado não comunicado apenas por cor ou hover. Respeitar `prefers-reduced-motion`. O 2D deve continuar funcional se WebGL estiver indisponível ou o 3D falhar.

**Acessibilidade no código (OLIMPO-016/017):** `:focus-visible` apresenta contorno ciano em botões, campos de texto, seletores e áreas de texto; `prefers-reduced-motion` reduz transições e animações. Na auditoria OLIMPO-017, texto principal `#e9e5dc` sobre `#101820` mediu 14,24:1, foco `#75d9d0` sobre `#101820` 10,73:1, placeholder `#84908c` sobre `#111c21` 5,24:1 e estado ativo `#c8efe3` sobre `#23413d` 8,92:1. Os textos pequenos `#75817e` de `.section-count` e `.territory-number` ficaram em 4,43:1 sobre `#101820` e 4,01:1 sobre `#172229`; foram trocados por `var(--muted)` (`#9ca7a6`), que mede 7,24:1 e 6,55:1, respectivamente. A checagem foi estática em cores sólidas; gradientes, estados adicionais, leitor de tela e dispositivos reais ainda precisam de validação.

## Em aberto

- Escolher fontes de marca e uma escala tipográfica final.
- Revisar todas as combinações de contraste, incluindo gradientes, estados e cores individuais dos territórios, com ferramenta de auditoria e navegador renderizado.
- Definir como armaduras tecnológicas, avatares e símbolos mitológicos se relacionam sem competir com a leitura.
- Validar se as cores individuais dos seis territórios atendem contraste em texto, ícones e foco.
