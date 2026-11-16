import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'
import { navigateToTerritory, selectedTerritory } from '../src/navigation/routes'
import { demoTerritories } from '../src/data/demo'
import { createDemoServices } from '../src/services/demo'
import { installMemoryStorage } from './memory-storage'

beforeEach(() => { installMemoryStorage() })

describe('navegação', () => {
  it('ir a um território abre a sala dele', () => {
    assert.deepEqual(navigateToTerritory(demoTerritories[2]), { screen: 'room', territoryId: demoTerritories[2].id })
  })

  it('território desconhecido ou ausente cai no primeiro', () => {
    assert.equal(selectedTerritory(demoTerritories[3].id, demoTerritories).id, demoTerritories[3].id)
    assert.equal(selectedTerritory('nao-existe', demoTerritories).id, demoTerritories[0].id)
    assert.equal(selectedTerritory(undefined, demoTerritories).id, demoTerritories[0].id)
  })
})

describe('presença simulada', () => {
  it('o perfil atual aparece só na sala em que entrou', () => {
    const services = createDemoServices()
    const me = services.profile.getCurrent().id
    const here = (roomId: string) => services.participants.listByRoom(roomId).some((presence) => presence.profileId === me)
    services.participants.joinRoom('athena')
    assert.equal(here('athena'), true)
    services.participants.joinRoom('ares')
    assert.equal(here('athena'), false, 'entrar em outra sala sai da anterior')
    assert.equal(here('ares'), true)
    services.participants.leaveRoom('athena')
    assert.equal(here('ares'), true, 'sair de uma sala em que não está não muda nada')
    services.participants.clearCurrentPresence()
    assert.equal(here('ares'), false)
  })

  it('sala inexistente não tem presença e não pode ser aberta', () => {
    const services = createDemoServices()
    assert.deepEqual(services.participants.listByRoom('sala-falsa'), [])
    assert.throws(() => services.participants.joinRoom('sala-falsa'), /não existe/)
  })

  it('presença não é persistida entre recargas', () => {
    createDemoServices().participants.joinRoom('athena')
    const reloaded = createDemoServices()
    assert.equal(reloaded.participants.listByRoom('athena').some((presence) => presence.profileId === reloaded.profile.getCurrent().id), false)
  })

  it('a presença mostra o avatar escolhido', () => {
    const services = createDemoServices()
    services.profile.updateAvatar('solar')
    services.participants.joinRoom('athena')
    const mine = services.participants.listByRoom('athena').find((presence) => presence.profileId === services.profile.getCurrent().id)
    assert.equal(mine?.avatar.id, 'solar')
  })
})

describe('perfil e avatar', () => {
  it('avatar escolhido persiste; avatar inexistente é recusado', () => {
    const services = createDemoServices()
    services.profile.updateAvatar('observer')
    assert.equal(createDemoServices().profile.getCurrent().avatar.id, 'observer')
    assert.throws(() => services.profile.updateAvatar('dragao'), /não existe/)
  })

  it('a comunidade não inclui o perfil atual', () => {
    const services = createDemoServices()
    assert.equal(services.profile.listCommunity().some((profile) => profile.id === services.profile.getCurrent().id), false)
  })

  it('gamificação só existe para o perfil atual', () => {
    const services = createDemoServices()
    assert.ok(services.gamification.getProgress(services.profile.getCurrent().id))
    assert.equal(services.gamification.getProgress('lia'), undefined)
  })
})

describe('rascunhos', () => {
  it('aceita até 300 caracteres; vazio apaga; sala inexistente é recusada', () => {
    const services = createDemoServices()
    services.messages.setDraft('athena', 'x'.repeat(300))
    assert.equal(services.messages.getDraft('athena').length, 300)
    assert.throws(() => services.messages.setDraft('athena', 'x'.repeat(301)), /300/)
    services.messages.setDraft('athena', '')
    assert.equal(services.messages.getDraft('athena'), '')
    assert.throws(() => services.messages.setDraft('sala-falsa', 'oi'), /não existe/)
  })
})

describe('encontros', () => {
  it('inscrição soma um participante e cancelamento devolve a contagem', () => {
    const services = createDemoServices()
    const me = services.profile.getCurrent().id
    const [event] = services.events.listEvents()
    const count = () => services.events.listEvents().find((item) => item.id === event.id)?.participantCount
    const before = count()
    services.events.register(event.id, me)
    assert.equal(count(), (before ?? 0) + 1)
    assert.throws(() => services.events.register(event.id, me), /ja esta ativa/)
    services.events.cancelRegistration(event.id, me)
    assert.equal(count(), before)
    assert.throws(() => services.events.cancelRegistration(event.id, me), /nao esta ativa/)
  })

  it('só o perfil atual se inscreve; encontro inexistente é recusado', () => {
    const services = createDemoServices()
    const [event] = services.events.listEvents()
    assert.throws(() => services.events.register(event.id, 'lia'), /participante atual/)
    assert.throws(() => services.events.register('evento-falso', services.profile.getCurrent().id), /nao existe/)
  })

  it('filtro por território só devolve encontros dele', () => {
    const services = createDemoServices()
    const territoryId = services.events.listEvents()[0].territoryId
    const filtered = services.events.listEvents(territoryId)
    assert.ok(filtered.length > 0)
    assert.ok(filtered.every((event) => event.territoryId === territoryId))
  })

  it('com atividade de encontros desligada, inscrever não gera aviso', () => {
    const services = createDemoServices()
    services.notifications.setPreference('eventActivity', false)
    const before = services.notifications.list().length
    services.events.register(services.events.listEvents()[0].id, services.profile.getCurrent().id)
    assert.equal(services.notifications.list().length, before)
  })

  it('marcar como lida um aviso inexistente é recusado', () => {
    assert.throws(() => createDemoServices().notifications.markAsRead('nao-existe'), /nao existe/)
  })
})
