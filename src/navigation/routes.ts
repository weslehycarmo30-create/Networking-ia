import type { Territory } from '../data/territories'

export type Screen = 'landing' | 'city' | 'room' | 'profile'
export type NavigationState = { screen: Screen; territoryId?: string }

export function navigateToTerritory(territory: Territory): NavigationState {
  return { screen: 'room', territoryId: territory.id }
}

export function selectedTerritory(id: string | undefined, territories: Territory[]) {
  return territories.find((territory) => territory.id === id) ?? territories[0]
}
