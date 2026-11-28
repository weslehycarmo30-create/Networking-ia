// OLIMPO-087 (M1): demo events stay in the future and ended events do not accept registrations.
import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { buildDemoEvents } from '../src/data/events'
import { hasEventStarted } from '../src/domain/rules'
import { createDemoServices } from '../src/services/demo'
import { installMemoryStorage } from './memory-storage'

beforeEach(() => { installMemoryStorage() })

const day = 24 * 60 * 60 * 1000

describe('datas dos encontros', () => {
  it('ficam sempre no futuro em relação ao momento em que a demonstração abre', () => {
    for (const reference of [new Date('2026-11-27T12:00:00Z'), new Date('2031-12-31T23:59:00Z')]) {
      const events = buildDemoEvents(reference)
      assert.equal(events.length, 4)
      for (const event of events) {
        const ahead = Date.parse(event.startsAt) - reference.getTime()
        assert.ok(ahead > 0 && ahead < 30 * day, `${event.id}: ${event.startsAt}`)
      }
    }
  })

  it('o adaptador usa o relógio recebido', () => {
    const now = new Date('2030-03-01T12:00:00Z')
    const services = createDemoServices({ now: () => now })
    assert.ok(services.events.listEvents().every((event) => Date.parse(event.startsAt) > now.getTime()))
  })
})

describe('encontro que já começou', () => {
  it('é identificado pelo horário', () => {
    const [event] = buildDemoEvents(new Date('2026-11-27T12:00:00Z'))
    assert.equal(hasEventStarted(event, new Date(Date.parse(event.startsAt) - 1000)), false)
    assert.equal(hasEventStarted(event, new Date(event.startsAt)), true)
  })

  it('não aceita nova inscrição, mas permite cancelar a existente', () => {
    let now = new Date('2026-11-27T12:00:00Z')
    const services = createDemoServices({ now: () => now })
    const me = services.profile.getCurrent().id
    const [first, second] = services.events.listEvents()
    services.events.register(first.id, me)
    now = new Date(now.getTime() + 60 * day)
    assert.throws(() => services.events.register(second.id, me), /já começou/)
    assert.equal(services.events.isRegistered(second.id, me), false)
    services.events.cancelRegistration(first.id, me)
    assert.equal(services.events.isRegistered(first.id, me), false)
  })
})
