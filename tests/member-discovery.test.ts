import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { listCommunityInterests, searchCommunityMembers } from '../src/domain/member-discovery'
import { demoCommunityProfiles } from '../src/data/demo'

const none = { query: '', interest: '', territoryId: '' as const }

describe('descoberta de membros', () => {
  it('sem filtros devolve todos os perfis', () => {
    assert.equal(searchCommunityMembers(demoCommunityProfiles, none).length, demoCommunityProfiles.length)
  })

  it('busca ignora acentos e maiúsculas', () => {
    const [first] = demoCommunityProfiles
    const accentless = first.displayName.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()
    const ids = searchCommunityMembers(demoCommunityProfiles, { ...none, query: `  ${accentless} ` }).map((profile) => profile.id)
    assert.ok(ids.includes(first.id))
  })

  it('combina interesse e território', () => {
    const profile = demoCommunityProfiles.find((item) => item.interests.length && item.territoryAffinities.length)
    assert.ok(profile, 'há um perfil demonstrativo com interesse e afinidade')
    const result = searchCommunityMembers(demoCommunityProfiles, { query: '', interest: profile.interests[0], territoryId: profile.territoryAffinities[0] })
    assert.ok(result.some((item) => item.id === profile.id))
    assert.ok(result.every((item) => item.interests.includes(profile.interests[0]) && item.territoryAffinities.includes(profile.territoryAffinities[0])))
  })

  it('consulta sem resultado devolve lista vazia', () => {
    assert.deepEqual(searchCommunityMembers(demoCommunityProfiles, { ...none, query: 'zzz-nada-encontrado' }), [])
  })

  it('lista interesses únicos em ordem pt-BR', () => {
    const interests = listCommunityInterests(demoCommunityProfiles)
    assert.equal(new Set(interests).size, interests.length)
    assert.deepEqual(interests, [...interests].sort((a, b) => a.localeCompare(b, 'pt-BR')))
  })
})
