# OLIMPO — identidade visual

**Versão:** 1.0 · **Data:** 24/10/2026 · Complementa [a especificação do produto](OLIMPO_PRODUCT_SPEC.md).

## Direção de arte

OLIMPO combina referências à mitologia grega e à disciplina visual espartana com uma cidade futurista. A direção desejada usa pedra, bronze, luz mineral e tecnologia integrada à arquitetura; armaduras tecnológicas podem aparecer em personagens e ilustrações futuras.

**Estado real:** o protótipo já usa nomes mitológicos, um monograma circular, anéis e formas inspiradas em praça/colunata, fundos escuros, bronze e ciano. A cena Three.js atual é uma composição geométrica simples da praça e marcadores coloridos. Armaduras tecnológicas e personagens 3D detalhados são uma direção futura, não elementos já implementados.

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

## Em aberto

- Escolher fontes de marca e uma escala tipográfica final.
- Definir tokens formais de contraste e validar combinações com ferramenta de auditoria.
- Definir como armaduras tecnológicas, avatares e símbolos mitológicos se relacionam sem competir com a leitura.
- Validar se as cores individuais dos seis territórios atendem contraste em texto, ícones e foco.
