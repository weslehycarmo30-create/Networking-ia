import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { demoAvatars, demoCommunityProfiles, demoGuide, demoProfile, demoTerritories, messageSeeds, presenceSeeds } from '../src/data/demo'
import { demoEvents } from '../src/data/events'

const territoryIds = new Set(demoTerritories.map((room) => room.id))
// O guia (Zeus) já faz parte de demoCommunityProfiles.
const allProfiles = [demoProfile, ...demoCommunityProfiles]
const profileIds = new Set(allProfiles.map((profile) => profile.id))
const unique = (values: string[]) => new Set(values).size === values.length

describe('integridade dos dados de exemplo', () => {
  it('o guia da praça aparece na lista da comunidade', () => {
    assert.ok(demoCommunityProfiles.some((profile) => profile.id === demoGuide.id))
  })

  it('ids de territórios, perfis, avatares e encontros são únicos', () => {
    assert.ok(unique(demoTerritories.map((room) => room.id)))
    assert.ok(unique(allProfiles.map((profile) => profile.id)))
    assert.ok(unique(demoAvatars.map((avatar) => avatar.id)))
    assert.ok(unique(demoEvents.map((event) => event.id)))
  })

  it('há seis territórios, cada um com duas sugestões de conversa e posição 3D', () => {
    assert.equal(demoTerritories.length, 6)
    for (const room of demoTerritories) {
      assert.equal(room.suggestions.length, 2, room.id)
      assert.ok(room.suggestions.every((text) => text.trim().length > 0 && text.length <= 300), `${room.id}: sugestão cabe no limite de 300 caracteres`)
      assert.equal(room.position.length, 3, room.id)
      assert.ok(/^#[0-9a-f]{6}$/i.test(room.color), `${room.id}: cor hexadecimal`)
    }
  })

  it('afinidades de todos os perfis apontam para territórios que existem', () => {
    for (const profile of allProfiles) {
      assert.ok(profile.territoryAffinities.every((id) => territoryIds.has(id)), `${profile.id}: ${profile.territoryAffinities.join(', ')}`)
    }
  })

  it('perfis têm nome, @handle único e avatar conhecido ou de guia', () => {
    assert.ok(unique(allProfiles.map((profile) => profile.handle)))
    for (const profile of allProfiles) {
      assert.ok(profile.displayName.trim().length > 0, profile.id)
      assert.match(profile.handle, /^@[\w.]+$/, profile.id)
    }
    assert.ok(demoAvatars.some((avatar) => avatar.id === demoProfile.avatar.id))
  })

  it('encontros têm organizador e território existentes e data válida', () => {
    for (const event of demoEvents) {
      assert.ok(territoryIds.has(event.territoryId), `${event.id}: território`)
      assert.ok(profileIds.has(event.organizerProfileId), `${event.id}: organizador`)
      assert.ok(Number.isFinite(Date.parse(event.startsAt)), `${event.id}: data`)
      assert.ok(Number.isInteger(event.participantCount) && event.participantCount >= 0, `${event.id}: participantes`)
    }
  })
})

describe('mensagens e presença iniciais', () => {
  it('cada território tem mensagens iniciais de autores conhecidos, em ordem cronológica', () => {
    assert.deepEqual(new Set(Object.keys(messageSeeds)), territoryIds)
    for (const [roomId, seeds] of Object.entries(messageSeeds)) {
      assert.ok(seeds.length > 0, roomId)
      assert.ok(unique(seeds.map((seed) => seed.id)), `${roomId}: ids únicos`)
      for (const seed of seeds) {
        assert.ok(profileIds.has(seed.authorId), `${roomId}/${seed.id}: autor`)
        assert.ok(seed.text.trim().length > 0 && seed.text.length <= 300, `${roomId}/${seed.id}: texto`)
      }
      const times = seeds.map((seed) => Date.parse(seed.createdAt))
      assert.ok(times.every(Number.isFinite), `${roomId}: datas`)
      assert.deepEqual(times, [...times].sort((a, b) => a - b), `${roomId}: ordem`)
    }
  })

  it('o nome e o avatar gravados na mensagem inicial batem com o perfil do autor', () => {
    // O estado salvo é validado contra estes mesmos campos; um desvio invalidaria o estado inicial.
    for (const seeds of Object.values(messageSeeds)) {
      for (const seed of seeds) {
        const author = allProfiles.find((profile) => profile.id === seed.authorId)
        assert.equal(seed.authorName, author?.displayName)
        assert.equal(seed.avatar.id, author?.avatar.id)
      }
    }
  })

  it('a presença inicial só usa perfis conhecidos e ids únicos', () => {
    assert.deepEqual(new Set(Object.keys(presenceSeeds)), territoryIds)
    const ids = Object.values(presenceSeeds).flat().map((person) => person.id)
    assert.ok(unique(ids))
    for (const people of Object.values(presenceSeeds)) {
      assert.ok(people.every((person) => profileIds.has(person.profileId)))
    }
  })
})
