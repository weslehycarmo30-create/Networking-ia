import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { createDemoServices } from '../src/services/demo'
import { DEMO_STORAGE_KEY, validatePersistedDemoState } from '../src/services/demo-storage'
import { installMemoryStorage, type MemoryStorage } from './memory-storage'

let storage: MemoryStorage
beforeEach(() => { storage = installMemoryStorage() })

describe('reações e respostas', () => {
  it('uma reação por pessoa; repetir a mesma remove', () => {
    const services = createDemoServices()
    const [message] = services.messages.listByRoom('athena')
    assert.deepEqual(services.messages.toggleReaction(message.id, '👍').reactions.map((reaction) => reaction.emoji), ['👍'])
    assert.deepEqual(services.messages.toggleReaction(message.id, '💡').reactions.map((reaction) => reaction.emoji), ['💡'])
    assert.deepEqual(services.messages.toggleReaction(message.id, '💡').reactions, [])
    assert.throws(() => services.messages.toggleReaction(message.id, '🔥' as never), /reação/)
  })

  it('resposta só aponta para mensagem da mesma sala', () => {
    const services = createDemoServices()
    const [inAthena] = services.messages.listByRoom('athena')
    assert.equal(services.messages.sendToRoom('athena', 'ok', inAthena.id).replyToMessageId, inAthena.id)
    assert.throws(() => services.messages.sendToRoom('ares', 'outra sala', inAthena.id), /original/)
  })

  it('não edita nem remove mensagem de outra pessoa', () => {
    const services = createDemoServices()
    const other = services.messages.listByRoom('athena').find((message) => message.authorId !== services.profile.getCurrent().id)
    assert.ok(other)
    assert.throws(() => services.messages.editInRoom('athena', other.id, 'x'), /próprias/)
    assert.throws(() => services.messages.removeFromRoom('athena', other.id), /próprias/)
  })

  it('enviar mensagem limpa o rascunho da sala', () => {
    const services = createDemoServices()
    services.messages.setDraft('athena', 'rascunho')
    services.messages.sendToRoom('athena', 'enviada')
    assert.equal(services.messages.getDraft('athena'), '')
  })
})

describe('denúncias', () => {
  it('sinaliza mensagem e perfil uma única vez; não sinaliza o próprio perfil', () => {
    const services = createDemoServices()
    const [message] = services.messages.listByRoom('athena')
    services.reports.submit({ targetType: 'message', targetId: message.id, reason: 'spam' })
    assert.equal(services.reports.hasReport('message', message.id), true)
    assert.throws(() => services.reports.submit({ targetType: 'message', targetId: message.id, reason: 'spam' }), /já foi/)
    services.reports.submit({ targetType: 'profile', targetId: 'lia', reason: 'other' })
    assert.throws(() => services.reports.submit({ targetType: 'profile', targetId: services.profile.getCurrent().id, reason: 'other' }), /não pode/)
    assert.throws(() => services.reports.submit({ targetType: 'message', targetId: 'nao-existe', reason: 'spam' }), /não existe/)
    assert.equal(createDemoServices().reports.hasReport('profile', 'lia'), true)
  })
})

describe('reiniciar demonstração', () => {
  it('restaura exatamente o mesmo estado de um primeiro acesso', () => {
    const fresh = createDemoServices()
    const initialNotifications = fresh.notifications.list().map(({ id, kind }) => ({ id, kind }))
    const initialConnections = fresh.connections.listConnections()

    const services = createDemoServices()
    services.messages.sendToRoom('athena', 'algo')
    services.notifications.setPreference('connectionInvites', false)
    services.connections.respondToInvite('demo-invite-lia', services.profile.getCurrent().id, 'accepted')
    services.demoState.reset()

    assert.deepEqual(services.connections.listConnections(), initialConnections)
    assert.deepEqual(services.notifications.list().map(({ id, kind }) => ({ id, kind })), initialNotifications)
    assert.deepEqual(services.notifications.getPreferences(), { connectionInvites: true, eventActivity: true })
  })
})

describe('identificadores de convite', () => {
  it('novo convite não repete id existente depois de importar dados', () => {
    const services = createDemoServices()
    const exported = services.demoState.exportData()
    // Arquivo plausível: um único vínculo cujo id coincide com o próximo gerado por contagem.
    exported.state.connections = [{ id: 'demo-connection-2', fromProfileId: services.profile.getCurrent().id, toProfileId: 'caio', status: 'accepted', createdAt: '2026-10-23T14:20:00.000Z' }]
    exported.state.notifications = []
    services.demoState.importData(exported)
    const invite = services.connections.requestConnection('nina')
    const ids = services.connections.listConnections().map((connection) => connection.id)
    assert.equal(new Set(ids).size, ids.length, `ids repetidos: ${ids.join(', ')}`)
    assert.ok(validatePersistedDemoState(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? 'null')), 'estado gravado continua válido')
    assert.ok(invite.id)
  })
})
