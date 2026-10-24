export type Avatar = {
  id: string
  label: string
  emoji: string
}

export type TerritoryId = 'athena' | 'hephaestus' | 'hermes' | 'delphi' | 'dionysus' | 'ares'

export type GamificationProgress = {
  level: number
  points: number
  badges: string[]
}

export type Profile = {
  id: string
  displayName: string
  handle: string
  avatar: Avatar
  bio: string
  interests: string[]
  territoryAffinities: TerritoryId[]
  gamification: GamificationProgress
}

export type TerritoryRoom = {
  id: string
  name: string
  domain: string
  symbol: string
  description: string
  people: number
  color: string
  position: [number, number, number]
  prompt: string
}

export type Message = {
  id: string
  roomId: TerritoryRoom['id']
  authorId: Profile['id']
  authorName: string
  avatar: Avatar
  createdAt: string
  text: string
}

export type Presence = {
  id: string
  roomId: TerritoryRoom['id']
  profileId: Profile['id']
  displayName: string
  avatar: Avatar
  role: string
  status: 'online' | 'away'
}

export type Connection = {
  id: string
  fromProfileId: Profile['id']
  toProfileId: Profile['id']
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
}
