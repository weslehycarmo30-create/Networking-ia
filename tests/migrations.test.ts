import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { createDemoServices } from '../src/services/demo'
import { DEMO_STATE_VERSION, DEMO_STORAGE_KEY, validateDemoImportDocument, validatePersistedDemoState } from '../src/services/demo-storage'
import { installMemoryStorage, type MemoryStorage } from './memory-storage'

let storage: MemoryStorage
beforeEach(() => { storage = installMemoryStorage() })

// A current (v10) state with something in every area that older schemas lacked.
function richState() {
  const services = createDemoServices()
  const me = services.profile.getCurrent().id
  const [first] = services.messages.listByRoom('athena')
  services.messages.sendToRoom('athena', 'resposta', first.id)
  services.messages.toggleSaved(first.id)
  services.messages.setDraft('ares', 'rascunho')
  services.events.register(services.events.listEvents()[0].id, me)
  services.notifications.setPreference('eventActivity', true)
  return JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? 'null')
}

const asVersion = (state: Record<string, unknown>, version: number) => ({ ...structuredClone(state), version })

describe('migração de versões antigas do estado local', () => {
  it('todas as versões de 1 a 10 são aceitas e convertidas para a atual', () => {
    const state = richState()
    for (let version = 1; version <= DEMO_STATE_VERSION; version += 1) {
      const migrated = validatePersistedDemoState(asVersion(state, version))
      assert.ok(migrated, `versão ${version} deveria ser aceita`)
      assert.equal(migrated.version, DEMO_STATE_VERSION)
    }
  })

  it('versão desconhecida é rejeitada', () => {
    const state = richState()
    assert.equal(validatePersistedDemoState(asVersion(state, 0)), undefined)
    assert.equal(validatePersistedDemoState(asVersion(state, DEMO_STATE_VERSION + 1)), undefined)
  })

  it('campos que não existiam na versão de origem são descartados ou derivados', () => {
    const state = richState()
    const v2 = validatePersistedDemoState(asVersion(state, 2))
    assert.ok(v2)
    assert.deepEqual(v2.eventRegistrations, [], 'v<3 não tinha inscrições')
    const v3 = validatePersistedDemoState(asVersion(state, 3))
    assert.ok(v3)
    assert.equal(v3.eventRegistrations.length, 1)
    assert.ok(v3.notifications.every((notification) => notification.kind === 'connection_invite'), 'v<4 deriva só os avisos de convite')
    const v5 = validatePersistedDemoState(asVersion({ ...state, notificationPreferences: { connectionInvites: false, eventActivity: false } }, 5))
    assert.ok(v5)
    assert.deepEqual(v5.notificationPreferences, { connectionInvites: true, eventActivity: true }, 'v<6 usa as preferências padrão')
    const v6 = validatePersistedDemoState(asVersion(state, 6))
    assert.ok(v6)
    assert.deepEqual(v6.savedMessages, [], 'v<7 não tinha salvas')
    const v7 = validatePersistedDemoState(asVersion(state, 7))
    assert.ok(v7)
    assert.equal(v7.savedMessages.length, 1)
    assert.deepEqual(v7.draftsByRoom, {}, 'v<8 não tinha rascunhos')
    const v8 = validatePersistedDemoState(asVersion(state, 8))
    assert.ok(v8)
    assert.equal(v8.draftsByRoom.ares, 'rascunho')
    assert.ok(Object.values(v8.messages).flat().every((message) => !message.replyToMessageId), 'v<9 não tinha respostas')
    const v9 = validatePersistedDemoState(asVersion(state, 9))
    assert.ok(v9)
    assert.ok(Object.values(v9.messages).flat().some((message) => message.replyToMessageId))
  })

  it('resposta cuja original sumiu vira "indisponível" sem invalidar o estado', () => {
    const state = richState()
    const reply = state.messages.athena.find((message: { replyToMessageId?: string }) => message.replyToMessageId)
    reply.replyToMessageId = 'mensagem-que-nao-existe'
    const migrated = validatePersistedDemoState(state)
    assert.ok(migrated)
    const parsed = migrated.messages.athena.find((message) => message.id === reply.id)
    assert.equal(parsed?.replyToMessageId, undefined)
    assert.equal(parsed?.replyUnavailable, true)
  })

  it('o adaptador regrava o estado antigo já na versão atual ao carregar', () => {
    const state = richState()
    storage = installMemoryStorage({ [DEMO_STORAGE_KEY]: JSON.stringify(asVersion(state, 5)) })
    createDemoServices()
    assert.equal(JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? '{}').version, DEMO_STATE_VERSION)
  })

  it('importação de arquivo com versão antiga informa a versão de origem', () => {
    const document = { format: 'olimpo-demo-data', formatVersion: 1, exportedAt: '2026-11-15T10:00:00.000Z', state: asVersion(richState(), 4) }
    const { summary } = validateDemoImportDocument(document)
    assert.equal(summary.sourceSchemaVersion, 4)
  })
})
