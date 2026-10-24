# OLIMPO — fluxos de usuário

**Versão:** 1.0 · **Data:** 24/10/2026 · Todos os perfis e resultados descritos são fictícios quando usados no protótipo.

## 1. Entrar na demonstração

1. A pessoa abre a landing page.
2. Escolhe um avatar ilustrativo entre seis opções ou continua sem criar conta.
3. A aplicação entra na Praça Central com mapa 2D.

**Estado:** implementado; avatar e navegação vivem na sessão local em memória.

## 2. Explorar a praça e abrir perfil

1. A pessoa escolhe um território no mapa 2D ou nos cartões; no 3D, escolhe um território pelos controles HTML ou marcadores.
2. Na praça, seleciona um perfil fictício na lista apresentada junto ao mapa 2D ou na sobreposição da cena 3D.
3. O perfil mostra apresentação, interesses, gamificação ilustrativa e estado de conexão com o perfil atual.
4. A ação de voltar retorna à tela anterior da navegação local.

**Estado:** implementado para perfis fictícios. A lista usa o mesmo serviço de perfil e o mesmo estado de conexão em 2D e 3D.

## 2.1 Descobrir membros na Ágora de Hermes

1. Na Praça Central em 2D ou 3D, a pessoa abre o botão **Descobrir membros · Ágora de Hermes** no cabeçalho.
2. Pesquisa os perfis fictícios carregados por `ProfileService` por nome, apresentação ou interesse; pode combinar a busca com filtros por interesse e por afinidade a um território.
3. Abre um resultado para consultar apresentação, interesses, afinidades temáticas e estado da conexão, ou acompanha o estado diretamente no resultado.
4. Pode enviar um convite ou cancelar um convite pendente; essas ações atualizam o mesmo serviço demonstrativo usado na praça, nas salas e nos perfis.

Resultados vazios mostram orientação para ajustar ou limpar os filtros. Afinidades apontam temas que o perfil quer explorar e usam IDs do catálogo atual de territórios; elas não representam a presença atual do perfil numa sala. A presença permanece temporária e independente.

## 3. Entrar em uma sala e conversar

1. A pessoa abre um dos seis territórios.
2. Ao entrar, o serviço marca o perfil atual como presente naquela sala sem criar duplicata; a sala mostra a presença temporária do participante atual e os perfis fictícios de catálogo, mensagens iniciais e um prompt de conversa.
3. A pessoa pode selecionar um participante para abrir seu perfil.
4. Uma mensagem demonstrativa pode ser enviada. O serviço valida texto vazio e limite de 300 caracteres e a guarda na sala correspondente.
5. Voltar à Praça Central remove o perfil atual da presença da sala. Alternar entre as vistas 2D e 3D da praça não altera a presença. Quantidades por sala são mostradas nos cartões e seletores da praça e na sala. Presença é apenas demonstrativa, temporária e local; não há atualização entre usuários, abas ou dispositivos.

**Estado:** implementado localmente. Não há mensagens privadas nem conversa compartilhada entre navegadores. Presença não é persistida no `localStorage`.

## 4. Enviar um convite de conexão

1. A pessoa abre um perfil comunitário na praça ou numa sala.
2. O perfil mostra biografia, interesses e estado do vínculo.
3. Se não houver conexão aceita ou convite pendente, a pessoa escolhe **Enviar convite de conexão**.
4. O serviço demo registra um convite pendente e a UI confirma a ação com mensagem de status acessível.
5. O perfil próprio lista o convite em **Convites enviados**; o perfil destinatário oferece ações demonstrativas de resposta.

**Estado:** implementado no adaptador em memória. Não envia notificação e não contata uma pessoa real.

## 5. Responder a um convite recebido

1. O perfil próprio mostra **Convites recebidos**. O protótipo começa com um convite fictício de Lia para Alex.
2. A pessoa pode abrir o perfil remetente e escolher **Aceitar** ou **Recusar**.
3. O serviço valida que o convite continua pendente e que o perfil informado é seu destinatário.
4. Aceitar coloca a relação em **Conexões aceitas**. Recusar atualiza o estado do convite. A UI anuncia o resultado.

Para demonstrar a outra perspectiva num convite enviado, a página do perfil destinatário também permite simular a resposta fictícia do destinatário. Essa simulação não representa autenticação ou uma sessão de outra pessoa.

## 6. Cancelar convite enviado

1. A pessoa abre o próprio perfil e localiza o convite em **Convites enviados**, ou abre o perfil destinatário.
2. Escolhe **Cancelar convite** enquanto estiver pendente.
3. O serviço valida o remetente e muda o estado para cancelado; a interface atualiza a lista e anuncia o resultado.

## 7. Ver conexões

O perfil próprio lista relações aceitas. No perfil comunitário, o estado informa se já há conexão, convite pendente, recusa anterior ou nenhum vínculo. Não há ação de mensagem privada.

## 8. Sinalizar mensagem ou perfil

1. Na sala, a pessoa escolhe **Sinalizar mensagem**; no perfil de outra pessoa, escolhe **Sinalizar este perfil**.
2. Um diálogo acessível pede um motivo (spam, assédio, conteúdo impróprio, golpe ou outro) e aceita uma observação opcional de até 240 caracteres.
3. Antes da confirmação, o diálogo informa que é uma simulação local: o registro fica somente neste navegador (ou na sessão se o armazenamento local falhar), **não é enviado nem recebido por moderadores**, e nenhuma ação real de moderação será tomada.
4. Após confirmar, a interface confirma apenas o registro demonstrativo e impede nova denúncia do mesmo item. Os registros não são mostrados a outros participantes. **Reiniciar demonstração** também os remove.

**Estado:** registros demonstrativos no adaptador local versionado; não existe equipe de moderação ou serviço externo conectado.

## Acessibilidade do fluxo

Os seletores e ações são botões HTML com rótulos; feedback usa região de status; foco visível e layout mobile vêm dos estilos globais. A vista 2D é a alternativa completa ao Canvas. Ver [arquitetura](OLIMPO_2D_3D_ARCHITECTURE.md) e [segurança](OLIMPO_SECURITY.md).
