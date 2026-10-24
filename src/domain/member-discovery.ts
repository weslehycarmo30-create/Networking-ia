import type { Profile } from './models'

export type MemberSearchFilters = { query: string; interest: string }

function normalizeSearchText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR')
}

export function searchCommunityMembers(profiles: Profile[], filters: MemberSearchFilters): Profile[] {
  const query = normalizeSearchText(filters.query.trim())
  return profiles.filter((profile) => {
    const matchesQuery = !query || [profile.displayName, profile.bio, ...profile.interests]
      .some((value) => normalizeSearchText(value).includes(query))
    const matchesInterest = !filters.interest || profile.interests.includes(filters.interest)
    return matchesQuery && matchesInterest
  })
}

export function listCommunityInterests(profiles: Profile[]): string[] {
  return [...new Set(profiles.flatMap((profile) => profile.interests))]
    .sort((first, second) => first.localeCompare(second, 'pt-BR'))
}
