import type { TerritoryRoom } from '../domain/models'

export type Screen = 'landing' | 'avatar' | 'city' | 'room' | 'profile'
export type NavigationState = { screen: Screen; territoryId?: string }

export function navigateToTerritory(territory: TerritoryRoom): NavigationState {
  return { screen: 'room', territoryId: territory.id }
}

export function selectedTerritory(id: string | undefined, territories: TerritoryRoom[]) {
  return territories.find((territory) => territory.id === id) ?? territories[0]
}
