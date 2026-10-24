# OLIMPO — protótipo local

Demonstração navegável de uma cidade digital para networking, com dados e ações
inteiramente fictícios e locais.

## Executar

```sh
npm install
npm run dev
```

Use o botão da landing page para entrar sem conta. A Praça Central oferece um mapa
2D e uma cena 3D carregada somente quando selecionada. Avatar, mensagens por sala e
conexões demonstrativas ficam salvos no `localStorage` namespaced do OLIMPO neste
navegador. Presença e estado de interface são temporários. O controle “Reiniciar
demonstração” restaura os dados iniciais e remove somente a chave do OLIMPO; se o
armazenamento estiver indisponível, as alterações duram apenas a sessão.

## Organização

- `src/data/territories.ts`: catálogo compartilhado, guia e conteúdo demonstrativo.
- `src/navigation/routes.ts`: regras de navegação.
- `src/scenes/City3D.tsx`: cena Three.js/React Three Fiber e monitor de desempenho.
- `src/services/demo-storage.ts`: persistência demonstrativa local versionada e validada.
- `src/ui/App.tsx`: experiência, telas, estado local e fallback.
- `src/ui/styles.css`: identidade visual responsiva.

Isso não é persistência de produção: não há autenticação, backend, serviço externo ou sincronização.
