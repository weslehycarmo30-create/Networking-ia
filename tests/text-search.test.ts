import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Message } from '../src/domain/models'
import { normalizeSearchText, searchRoomMessages, wrapResultIndex } from '../src/domain/text-search'
import { demoProfile } from '../src/data/demo'

const message = (id: string, text: string, extra: Partial<Message> = {}): Message => ({
  id, roomId: 'athena', authorId: demoProfile.id, authorName: demoProfile.displayName, avatar: demoProfile.avatar,
  createdAt: '2026-11-16T10:00:00.000Z', text, reactions: [], ...extra,
})

describe('normalização de busca', () => {
  it('ignora acentos, cedilha e maiúsculas', () => {
    assert.equal(normalizeSearchText('Ação ÉTICA Ônibus'), 'acao etica onibus')
  })

  it('também remove marcas combinantes fora do bloco latino básico', () => {
    // "e" + U+1DC4 (marca combinante de outro bloco) deve virar só "e".
    assert.equal(normalizeSearchText('e᷄'), 'e')
  })
})

describe('busca no histórico da sala', () => {
  const messages = [
    message('a', 'Prototipando com IA hoje'),
    message('b', 'Ideias para a praça'),
    message('c', 'ia removida', { deleted: true }),
    message('d', 'Outra IDEIA'),
  ]

  it('encontra por trecho, sem acento e sem diferenciar maiúsculas', () => {
    assert.deepEqual(searchRoomMessages(messages, 'IDEIA').map((item) => item.id), ['b', 'd'])
    assert.deepEqual(searchRoomMessages(messages, '  praca ').map((item) => item.id), ['b'])
  })

  it('não encontra mensagens removidas', () => {
    assert.equal(searchRoomMessages(messages, 'removida').length, 0)
  })

  it('consulta vazia ou só com espaços não devolve resultados', () => {
    assert.deepEqual(searchRoomMessages(messages, ''), [])
    assert.deepEqual(searchRoomMessages(messages, '   '), [])
  })
})

describe('navegação circular entre resultados', () => {
  it('Anterior no primeiro vai para o último e Próximo no último volta ao primeiro', () => {
    assert.equal(wrapResultIndex(-1, 3), 2)
    assert.equal(wrapResultIndex(3, 3), 0)
    assert.equal(wrapResultIndex(1, 3), 1)
  })

  it('índice antigo maior que a nova lista continua válido', () => {
    assert.equal(wrapResultIndex(7, 3), 1)
  })

  it('sem resultados devolve -1', () => {
    assert.equal(wrapResultIndex(0, 0), -1)
  })
})
