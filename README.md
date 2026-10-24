# OLIMPO — protótipo local

Demonstração navegável de uma cidade digital para networking, com dados e ações
inteiramente fictícios e locais.

## Executar

```sh
npm install
npm run dev
```

Use o botão da landing page para entrar sem conta. A Praça Central oferece um mapa
2D e uma cena 3D carregada somente quando selecionada. As mensagens e pedidos de
conexão existem apenas no estado da página.

## Organização

- `src/data/territories.ts`: catálogo compartilhado, guia e conteúdo demonstrativo.
- `src/navigation/routes.ts`: regras de navegação.
- `src/scenes/City3D.tsx`: cena Three.js/React Three Fiber e monitor de desempenho.
- `src/ui/App.tsx`: experiência, telas, estado local e fallback.
- `src/ui/styles.css`: identidade visual responsiva.

Não há autenticação, persistência, serviço externo ou integração de produção.
