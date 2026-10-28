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
  suggestions: [string, string]
}

export const messageReactionEmojis = ['👍', '💡', '❤️'] as const
export type MessageReactionEmoji = typeof messageReactionEmojis[number]

export type MessageReaction = {
  profileId: Profile['id']
  emoji: MessageReactionEmoji
}

export type Message = {
  id: string
  roomId: TerritoryRoom['id']
  authorId: Profile['id']
  authorName: string
  avatar: Avatar
  createdAt: string
  text: string
  reactions: MessageReaction[]
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

export type ReportTargetType = 'message' | 'profile'
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'scam' | 'other'

export type DemoReport = {
  id: string
  targetType: ReportTargetType
  targetId: Message['id'] | Profile['id']
  reason: ReportReason
  note?: string
  createdAt: string
}

export type CommunityEvent = {
  id: string
  title: string
  description: string
  startsAt: string
  territoryId: TerritoryId
  organizerProfileId: Profile['id']
  participantCount: number
}

export type EventRegistration = {
  eventId: CommunityEvent['id']
  profileId: Profile['id']
}

export type DemoNotification =
  | {
    id: string
    kind: 'connection_invite'
    connectionId: Connection['id']
    profileId: Profile['id']
    createdAt: string
    readAt?: string
  }
  | {
    id: string
    kind: 'event_registration'
    eventId: CommunityEvent['id']
    action: 'registered' | 'cancelled'
    createdAt: string
    readAt?: string
  }

export type NotificationPreferences = {
  connectionInvites: boolean
  eventActivity: boolean
}
