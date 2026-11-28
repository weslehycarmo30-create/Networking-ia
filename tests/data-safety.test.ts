// OLIMPO-087 (A1): going past a stored limit must never erase the whole demo state.
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import type { Connection, Message } from '../src/domain/models'
import { createDemoServices } from '../src/services/demo'
import { DEMO_STORAGE_KEY } from '../src/services/demo-storage'
import { installMemoryStorage, type MemoryStorage } from './memory-storage'

let storage: MemoryStorage
beforeEach(() => { storage = installMemoryStorage() })

const stored = () => JSON.parse(storage.getItem(DEMO_STORAGE_KEY) ?? 'null')
const backups = () => Object.entries(storage.dump()).filter(([key]) => key.startsWith(`${DEMO_STORAGE_KEY}:backup`)).map(([, value]) => value)

function freshState() {
  createDemoServices()
  return stored()
}

function fillRoom(state: { messages: Record<string, Message[]> }, roomId: string, total: number) {
  const [template] = state.messages[roomId]
  for (let index = state.messages[roomId].length; index < total; index += 1) {
    state.messages[roomId].push({ ...template, id: `${roomId}-extra-${index}`, text: `mensagem ${index}` })
  }
}

const declined = (index: number): Connection => ({ id: `old-${index}`, fromProfileId: 'demo-alex', toProfileId: 'caio', status: 'declined', createdAt: '2026-10-20T10:00:00.000Z' })

describe('limites no envio', () => {
  it('recusa a 501ª mensagem da sala e nada se perde ao recarregar', () => {
    const services = createDemoServices()
    for (let index = services.messages.listByRoom('athena').length; index < 500; index += 1) services.messages.sendToRoom('athena', `m${index}`)
    services.messages.sendToRoom('ares', 'outra sala')
    assert.throws(() => services.messages.sendToRoom('athena', 'uma a mais'), /limite de 500/)
    const reloaded = createDemoServices()
    assert.equal(reloaded.messages.listByRoom('athena').length, 500)
    assert.ok(reloaded.messages.listByRoom('ares').some((message) => message.text === 'outra sala'))
    assert.equal(reloaded.demoState.getStatus().message, undefined)
  })

  it('convidar e cancelar muitas vezes não trava nem apaga os dados', () => {
    const services = createDemoServices()
    services.messages.sendToRoom('ares', 'guardar isto')
    for (let cycle = 0; cycle < 260; cycle += 1) {
      const invite = services.connections.requestConnection('nina')
      services.connections.cancelInvite(invite.id, 'demo-alex')
    }
    assert.ok(services.connections.listConnections().length <= 200)
    assert.ok(services.connections.listConnections().some((connection) => connection.id === 'demo-invite-lia'), 'registros ativos permanecem')
    const reloaded = createDemoServices()
    assert.ok(reloaded.messages.listByRoom('ares').some((message) => message.text === 'guardar isto'))
  })

  it('com 200 vínculos que não podem ser descartados, recusa um novo convite', () => {
    const state = freshState()
    for (let index = state.connections.length; index < 200; index += 1) state.connections.push(declined(index))
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
    const services = createDemoServices()
    assert.throws(() => services.connections.requestConnection('nina'), /limite de 200/)
    assert.equal(createDemoServices().connections.listConnections().length, 200)
  })

  it('recusa salvar além de 2.500 mensagens em vez de descartar em silêncio', () => {
    const state = freshState()
    for (const roomId of Object.keys(state.messages)) fillRoom(state, roomId, 420)
    const all = Object.values(state.messages as Record<string, Message[]>).flat()
    state.savedMessages = all.slice(0, 2500).map((message) => ({ roomId: message.roomId, messageId: message.id }))
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
    const services = createDemoServices()
    assert.throws(() => services.messages.toggleSaved(all[2500].id), /limite de 2\.500/)
    assert.equal(services.messages.toggleSaved(all[0].id), false, 'remover continua permitido')
  })
})

describe('dados já gravados nunca são apagados sem cópia', () => {
  it('estado acima do limite é recuperado (mais recentes) e o original é copiado', () => {
    const state = freshState()
    fillRoom(state, 'athena', 503)
    state.draftsByRoom = { ares: 'rascunho' }
    const raw = JSON.stringify(state)
    storage.setItem(DEMO_STORAGE_KEY, raw)
    const services = createDemoServices()
    const athena = services.messages.listByRoom('athena')
    assert.equal(athena.length, 500)
    assert.equal(athena.at(-1)?.id, 'athena-extra-502')
    assert.equal(services.messages.getDraft('ares'), 'rascunho')
    assert.deepEqual(backups(), [raw])
    assert.equal(services.demoState.getBackup(), raw)
    assert.match(services.demoState.getStatus().message ?? '', /cópia/)
  })

  it('mais de 200 convites: descarta primeiro os cancelados e mantém o resto', () => {
    const state = freshState()
    for (let index = 0; index < 210; index += 1) state.connections.push({ ...declined(index), status: 'cancelled' })
    storage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
    const services = createDemoServices()
    const ids = services.connections.listConnections().map((connection) => connection.id)
    assert.ok(ids.length <= 200)
    assert.ok(ids.includes('demo-invite-lia') && ids.includes('demo-connection-caio'))
    assert.equal(backups().length, 1)
  })

  it('dados irrecuperáveis voltam ao início, mas ficam copiados', () => {
    for (const raw of ['{não é json', JSON.stringify({ version: 999, tudo: 'diferente' })]) {
      storage = installMemoryStorage({ [DEMO_STORAGE_KEY]: raw })
      const services = createDemoServices()
      assert.equal(services.demoState.getBackup(), raw)
      assert.match(services.demoState.getStatus().message ?? '', /inválidos.*cópia/)
    }
  })

  it('se a cópia não puder ser gravada, o original não é sobrescrito', () => {
    const raw = '{não é json'
    storage = installMemoryStorage({ [DEMO_STORAGE_KEY]: raw })
    storage.failWrites = true
    const services = createDemoServices()
    storage.failWrites = false // espaço liberado depois: ainda assim não sobrescrever
    services.messages.sendToRoom('athena', 'só na sessão')
    assert.equal(storage.getItem(DEMO_STORAGE_KEY), raw)
    assert.equal(services.demoState.getStatus().persistent, false)
  })

  it('reiniciar apaga o estado e também as cópias', () => {
    storage = installMemoryStorage({ [DEMO_STORAGE_KEY]: '{não é json', 'outra:chave': 'fica' })
    const services = createDemoServices()
    services.demoState.reset()
    assert.deepEqual(backups(), [])
    assert.equal(services.demoState.getBackup(), null)
    assert.equal(storage.getItem('outra:chave'), 'fica')
    assert.ok(stored().version)
  })
})
