import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { createDemoServices } from '../src/services/demo'
import { DEMO_STORAGE_KEY, DEMO_STATE_VERSION, parseDemoImportText, validatePersistedDemoState } from '../src/services/demo-storage'
import { installMemoryStorage, type MemoryStorage } from './memory-storage'

let storage: MemoryStorage
const stored = () => JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? 'null')

beforeEach(() => { storage = installMemoryStorage() })

describe('adaptador demonstrativo: mensagens', () => {
  it('envia, edita e remove a própria mensagem e persiste', () => {
    const services = createDemoServices()
    const sent = services.messages.sendToRoom('athena', '  Olá, Atena  ')
    assert.equal(sent.text, 'Olá, Atena')
    assert.equal(services.messages.editInRoom('athena', sent.id, 'Editada').text, 'Editada')
    const removed = services.messages.removeFromRoom('athena', sent.id)
    assert.equal(removed.deleted, true)
    assert.ok(stored().messages.athena.some((message: { id: string; deleted?: boolean }) => message.id === sent.id && message.deleted))
    assert.throws(() => services.messages.editInRoom('athena', sent.id, 'de novo'))
  })

  it('mantém rascunhos separados por sala e os recupera após recarga', () => {
    const first = createDemoServices()
    first.messages.setDraft('athena', 'rascunho A')
    first.messages.setDraft('ares', 'rascunho B')
    const reloaded = createDemoServices()
    assert.equal(reloaded.messages.getDraft('athena'), 'rascunho A')
    assert.equal(reloaded.messages.getDraft('ares'), 'rascunho B')
    assert.equal(reloaded.messages.getDraft('delphi'), '')
  })

  it('salva e remove mensagens salvas e sobrevive à recarga', () => {
    const services = createDemoServices()
    const [message] = services.messages.listByRoom('athena')
    assert.equal(services.messages.toggleSaved(message.id), true)
    assert.equal(createDemoServices().messages.isSaved(message.id), true)
    assert.equal(services.messages.toggleSaved(message.id), false)
    assert.equal(createDemoServices().messages.listSaved().length, 0)
  })
})

describe('adaptador demonstrativo: convites', () => {
  it('aceita o convite inicial recebido e gera conexão aceita', () => {
    const services = createDemoServices()
    const me = services.profile.getCurrent().id
    const incoming = services.connections.listConnections().find((connection) => connection.status === 'pending' && connection.toProfileId === me)
    assert.ok(incoming, 'a demonstração começa com um convite recebido')
    assert.throws(() => services.connections.respondToInvite(incoming.id, incoming.fromProfileId, 'accepted'))
    assert.equal(services.connections.respondToInvite(incoming.id, me, 'accepted').status, 'accepted')
    assert.equal(createDemoServices().connections.listConnections().find((connection) => connection.id === incoming.id)?.status, 'accepted')
  })

  it('envia e cancela convite, sem duplicar convite pendente', () => {
    const services = createDemoServices()
    const me = services.profile.getCurrent().id
    const target = services.profile.listCommunity().find((profile) => !services.connections.listConnections().some((connection) => [connection.fromProfileId, connection.toProfileId].includes(profile.id)))
    assert.ok(target, 'há um perfil sem vínculo')
    const invite = services.connections.requestConnection(target.id)
    assert.throws(() => services.connections.requestConnection(target.id))
    assert.equal(services.connections.cancelInvite(invite.id, me).status, 'cancelled')
  })
})

describe('adaptador demonstrativo: notificações e encontros', () => {
  it('opt-out de convites remove avisos existentes', () => {
    const services = createDemoServices()
    assert.ok(services.notifications.list().some((notification) => notification.kind === 'connection_invite'))
    services.notifications.setPreference('connectionInvites', false)
    assert.equal(services.notifications.list().some((notification) => notification.kind === 'connection_invite'), false)
    assert.equal(createDemoServices().notifications.getPreferences().connectionInvites, false)
  })

  it('inscrição gera aviso e marcar todas zera não lidas', () => {
    const services = createDemoServices()
    const [event] = services.events.listEvents()
    const me = services.profile.getCurrent().id
    const before = services.notifications.list().length
    services.events.register(event.id, me)
    assert.equal(services.events.isRegistered(event.id, me), true)
    assert.equal(services.notifications.list().length, before + 1)
    assert.ok(services.notifications.markAllAsRead() > 0)
    assert.equal(services.notifications.unreadCount(), 0)
  })
})

describe('persistência local', () => {
  it('estado gravado pelo adaptador é válido e está na versão atual', () => {
    const services = createDemoServices()
    services.messages.sendToRoom('hermes', 'oi')
    const state = validatePersistedDemoState(stored())
    assert.ok(state)
    assert.equal(state.version, DEMO_STATE_VERSION)
  })

  it('JSON corrompido volta aos dados iniciais com aviso', () => {
    storage = installMemoryStorage({ [DEMO_STORAGE_KEY]: '{não é json' })
    const services = createDemoServices()
    assert.match(services.demoState.getStatus().message ?? '', /inválidos/)
    assert.ok(services.messages.listByRoom('athena').length > 0)
  })

  it('falha de escrita mantém a sessão em memória e informa', () => {
    const services = createDemoServices()
    storage.failWrites = true
    services.messages.sendToRoom('athena', 'só nesta sessão')
    assert.equal(services.demoState.getStatus().persistent, false)
    assert.ok(services.messages.listByRoom('athena').some((message) => message.text === 'só nesta sessão'))
  })

  it('exportação reimporta com o mesmo conteúdo', () => {
    const services = createDemoServices()
    services.messages.sendToRoom('delphi', 'para exportar')
    const exported = services.demoState.exportData()
    const { state, summary } = parseDemoImportText(JSON.stringify(exported))
    assert.deepEqual(state, exported.state)
    assert.equal(summary.sourceSchemaVersion, DEMO_STATE_VERSION)
  })

  it('importação rejeita formato desconhecido, JSON inválido e arquivo grande', () => {
    assert.throws(() => parseDemoImportText('{"format":"outro"}'), /formato/)
    assert.throws(() => parseDemoImportText('{'), /JSON/)
    assert.throws(() => parseDemoImportText('x'.repeat(5 * 1024 * 1024 + 1)), /5 MiB/)
  })

  it('referência salva inválida é ignorada sem invalidar o restante', () => {
    const services = createDemoServices()
    const [message] = services.messages.listByRoom('athena')
    services.messages.toggleSaved(message.id)
    const raw = stored()
    raw.savedMessages.push({ roomId: 'athena', messageId: 'nao-existe' }, { roomId: 'sala-falsa', messageId: message.id })
    const state = validatePersistedDemoState(raw)
    assert.ok(state)
    assert.deepEqual(state.savedMessages, [{ roomId: 'athena', messageId: message.id }])
  })
})
