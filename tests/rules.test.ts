import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { Connection, DemoNotification, Message } from '../src/domain/models'
import { cancelConnection, createConnection, createDemoReport, createMessage, editMessageText, findConnectionBetween, hasPendingConnection, markNotificationRead, markNotificationsRead, normalizeMessageText, notificationPreferenceEnabled, respondToConnection } from '../src/domain/rules'
import { demoProfile } from '../src/data/demo'

const at = '2026-11-15T10:00:00.000Z'
const pending = (overrides: Partial<Connection> = {}): Connection => ({ id: 'c1', fromProfileId: 'lia', toProfileId: 'demo-alex', status: 'pending', createdAt: at, ...overrides })

describe('mensagens', () => {
  it('normaliza espaços e respeita o limite de 300 caracteres', () => {
    assert.equal(normalizeMessageText('  olá  '), 'olá')
    assert.equal(normalizeMessageText('x'.repeat(300)).length, 300)
    assert.throws(() => normalizeMessageText('   '), /vazia/)
    assert.throws(() => normalizeMessageText('x'.repeat(301)), /300/)
  })

  it('cria mensagem com o autor do perfil e sem reações', () => {
    const message = createMessage({ id: 'm1', roomId: 'athena', profile: demoProfile, text: ' oi ', createdAt: at })
    assert.equal(message.authorId, demoProfile.id)
    assert.equal(message.authorName, demoProfile.displayName)
    assert.equal(message.text, 'oi')
    assert.deepEqual(message.reactions, [])
  })

  it('não edita mensagem removida', () => {
    const message = createMessage({ id: 'm1', roomId: 'athena', profile: demoProfile, text: 'oi', createdAt: at })
    assert.equal(editMessageText(message, ' novo ').text, 'novo')
    assert.throws(() => editMessageText({ ...message, deleted: true } as Message, 'novo'), /removida/)
  })
})

describe('conexões', () => {
  it('impede convite para si mesmo', () => {
    assert.throws(() => createConnection({ id: 'c', fromProfileId: 'a', toProfileId: 'a', createdAt: at }), /consigo mesmo/)
    assert.equal(createConnection({ id: 'c', fromProfileId: 'a', toProfileId: 'b', createdAt: at }).status, 'pending')
  })

  it('só o destinatário responde a um convite pendente', () => {
    assert.equal(respondToConnection(pending(), 'demo-alex', 'accepted').status, 'accepted')
    assert.equal(respondToConnection(pending(), 'demo-alex', 'declined').status, 'declined')
    assert.throws(() => respondToConnection(pending(), 'lia', 'accepted'), /destinatário/)
    assert.throws(() => respondToConnection(pending({ status: 'accepted' }), 'demo-alex', 'declined'), /pendente/)
  })

  it('só quem enviou cancela um convite pendente', () => {
    assert.equal(cancelConnection(pending(), 'lia').status, 'cancelled')
    assert.throws(() => cancelConnection(pending(), 'demo-alex'), /enviou/)
    assert.throws(() => cancelConnection(pending({ status: 'declined' }), 'lia'), /pendentes/)
  })

  it('encontra o vínculo mais recente em qualquer direção, ignorando cancelados', () => {
    const list = [pending({ id: 'old', status: 'declined' }), pending({ id: 'cancelled', status: 'cancelled' })]
    assert.equal(findConnectionBetween(list, 'demo-alex', 'lia')?.id, 'old')
    assert.equal(hasPendingConnection(list, 'lia', 'demo-alex'), false)
    assert.equal(hasPendingConnection([...list, pending({ id: 'new' })], 'demo-alex', 'lia'), true)
  })
})

describe('denúncias', () => {
  it('valida alvo, motivo e observação', () => {
    const report = createDemoReport({ id: 'r1', targetType: 'message', targetId: 'm1', reason: 'spam', note: '  ok  ', createdAt: at })
    assert.equal(report.note, 'ok')
    assert.equal('note' in createDemoReport({ id: 'r2', targetType: 'profile', targetId: 'lia', reason: 'other', note: '   ', createdAt: at }), false)
    assert.throws(() => createDemoReport({ id: 'r', targetType: 'room' as never, targetId: 'x', reason: 'spam', createdAt: at }), /inválido/)
    assert.throws(() => createDemoReport({ id: 'r', targetType: 'message', targetId: 'x', reason: 'nope' as never, createdAt: at }), /motivo/)
    assert.throws(() => createDemoReport({ id: 'r', targetType: 'message', targetId: 'x', reason: 'spam', note: 'x'.repeat(241), createdAt: at }), /240/)
  })
})

describe('notificações', () => {
  const notification: DemoNotification = { id: 'n1', kind: 'event_registration', eventId: 'event-ia-prototipos', action: 'registered', createdAt: at }

  it('marca como lida sem sobrescrever leitura anterior', () => {
    const read = markNotificationRead(notification, at)
    assert.equal(read.readAt, at)
    assert.equal(markNotificationRead(read, '2027-01-01T00:00:00.000Z').readAt, at)
    assert.throws(() => markNotificationRead(notification, 'ontem'), /invalido/)
    assert.equal(markNotificationsRead([notification, notification], at).every((item) => item.readAt === at), true)
  })

  it('aplica a preferência por categoria', () => {
    const preferences = { connectionInvites: false, eventActivity: true }
    assert.equal(notificationPreferenceEnabled(preferences, 'connection_invite'), false)
    assert.equal(notificationPreferenceEnabled(preferences, 'event_registration'), true)
  })
})
