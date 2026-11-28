// OLIMPO-087 (M2, M3, counts): two tabs do not overwrite each other, and the demo works where
// crypto.randomUUID does not exist (plain http on a local network).
import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { createDemoId } from '../src/domain/ids'
import { createDemoServices } from '../src/services/demo'
import { DEMO_STORAGE_KEY } from '../src/services/demo-storage'
import { installMemoryStorage, type MemoryStorage } from './memory-storage'

let storage: MemoryStorage
beforeEach(() => { storage = installMemoryStorage() })
const raw = () => storage.getItem(DEMO_STORAGE_KEY)

describe('duas abas', () => {
  it('depois de sincronizar, uma ação nesta aba preserva o que a outra gravou', () => {
    const first = createDemoServices()
    const second = createDemoServices()
    second.messages.sendToRoom('athena', 'da segunda aba')
    assert.equal(first.demoState.syncExternalChange(raw()), true)
    first.messages.sendToRoom('athena', 'da primeira aba')
    const texts = createDemoServices().messages.listByRoom('athena').map((message) => message.text)
    assert.ok(texts.includes('da segunda aba') && texts.includes('da primeira aba'), texts.join(' | '))
  })

  it('sincronizar não grava nada (sem eco entre abas)', () => {
    const first = createDemoServices()
    const second = createDemoServices()
    second.profile.updateAvatar('solar')
    const before = raw()
    first.demoState.syncExternalChange(before)
    assert.equal(raw(), before)
    assert.equal(first.profile.getCurrent().avatar.id, 'solar')
  })

  it('reinício em outra aba volta esta ao estado inicial sem regravar', () => {
    const first = createDemoServices()
    first.messages.sendToRoom('ares', 'vai sumir')
    storage.removeItem(DEMO_STORAGE_KEY)
    assert.equal(first.demoState.syncExternalChange(null), true)
    assert.equal(first.messages.listByRoom('ares').some((message) => message.text === 'vai sumir'), false)
    assert.equal(first.notifications.unreadCount(), 1)
    assert.equal(raw(), null)
  })

  it('conteúdo ilegível vindo de outra aba é ignorado', () => {
    const first = createDemoServices()
    first.messages.sendToRoom('ares', 'fica')
    assert.equal(first.demoState.syncExternalChange('{quebrado'), false)
    assert.equal(first.demoState.syncExternalChange('{"version":999}'), false)
    assert.ok(first.messages.listByRoom('ares').some((message) => message.text === 'fica'))
  })
})

describe('sem crypto.randomUUID (contexto não seguro)', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID')
  beforeEach(() => { Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true }) })
  afterEach(() => {
    if (original) Object.defineProperty(globalThis.crypto, 'randomUUID', original)
    else delete (globalThis.crypto as { randomUUID?: unknown }).randomUUID
  })

  it('enviar, convidar, sinalizar e inscrever continuam funcionando', () => {
    const services = createDemoServices()
    const sent = services.messages.sendToRoom('athena', 'pelo celular')
    services.connections.requestConnection('nina')
    services.reports.submit({ targetType: 'message', targetId: sent.id, reason: 'spam' })
    services.events.register(services.events.listEvents()[0].id, services.profile.getCurrent().id)
    assert.ok(createDemoServices().messages.listByRoom('athena').some((message) => message.id === sent.id))
  })

  it('os ids gerados são únicos e têm o prefixo pedido', () => {
    const ids = Array.from({ length: 500 }, () => createDemoId('demo-message'))
    assert.equal(new Set(ids).size, ids.length)
    assert.ok(ids.every((id) => id.startsWith('demo-message-') && id.length <= 120))
  })
})
