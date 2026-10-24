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

## 3. Entrar em uma sala e conversar

1. A pessoa abre um dos seis territórios.
2. A sala mostra descrição, participantes fictícios, mensagens iniciais e um prompt de conversa.
3. A pessoa pode selecionar um participante para abrir seu perfil.
4. Uma mensagem demonstrativa pode ser enviada. O serviço valida texto vazio e limite de 300 caracteres e a guarda na sala correspondente.
5. Ao voltar à sala durante a sessão, o estado continua em memória. Recarregar a página reinicia a demonstração.

**Estado:** implementado localmente. Não há mensagens privadas nem conversa compartilhada entre navegadores.

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

## Acessibilidade do fluxo

Os seletores e ações são botões HTML com rótulos; feedback usa região de status; foco visível e layout mobile vêm dos estilos globais. A vista 2D é a alternativa completa ao Canvas. Ver [arquitetura](OLIMPO_2D_3D_ARCHITECTURE.md) e [segurança](OLIMPO_SECURITY.md).
