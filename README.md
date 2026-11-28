# OLIMPO — protótipo local

Demonstração navegável de uma cidade digital para networking, com dados e ações
inteiramente fictícios e locais.

## Executar

```sh
npm install
npm run dev
```

Testes automatizados (domínio, descoberta, adaptador demonstrativo, persistência local e migração de versões antigas) usam o executor nativo do Node, sem dependências extras; exigem Node 22.18 ou mais novo (remoção de tipos TypeScript nativa; testado no 24 do CI e no 26 local):

```sh
npm test
```

O GitHub Actions (`.github/workflows/ci.yml`) roda lint, testes e build em cada pull request.

Use o botão da landing page para entrar sem conta. A Praça Central oferece um mapa
2D e uma cena 3D carregada somente quando selecionada. Avatar, mensagens por sala e
conexões demonstrativas ficam salvos no `localStorage` namespaced do OLIMPO neste
navegador. Presença e estado de interface são temporários. O controle “Reiniciar
demonstração” restaura os dados iniciais e remove somente as chaves do OLIMPO (estado e
cópias de segurança); se o armazenamento estiver indisponível, as alterações duram apenas a
sessão. A demonstração recusa passar dos limites (500 mensagens por sala, 200 convites, 2.500
salvas). Se os dados gravados não puderem ser lidos como estão, o texto original é copiado antes
de qualquer substituição e pode ser baixado em Meu perfil; sem espaço para a cópia, o original
não é sobrescrito.

## Organização

- `src/data/territories.ts`: catálogo compartilhado, guia e conteúdo demonstrativo.
- `src/navigation/routes.ts`: regras de navegação.
- `src/scenes/City3D.tsx`: cena Three.js/React Three Fiber e monitor de desempenho.
- `src/services/demo-storage.ts`: persistência demonstrativa local versionada e validada.
- `src/ui/App.tsx`: experiência, telas, estado local e fallback.
- `src/ui/styles.css`: identidade visual responsiva.

Isso não é persistência de produção: não há autenticação, backend, serviço externo ou sincronização.
