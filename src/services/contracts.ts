import type { Avatar, Connection, GamificationProgress, Message, Presence, Profile, TerritoryRoom } from '../domain/models'
import type { DemoPersistenceStatus } from './demo-storage'

export interface RoomService {
  listRooms(): TerritoryRoom[]
  getRoom(roomId: string): TerritoryRoom | undefined
}

export interface ParticipantService {
  listByRoom(roomId: string): Presence[]
}

export interface MessageService {
  listByRoom(roomId: string): Message[]
  sendToRoom(roomId: string, text: string): Message
}

export interface ProfileService {
  getCurrent(): Profile
  getProfile(profileId: Profile['id']): Profile | undefined
  listCommunity(): Profile[]
  updateAvatar(avatarId: Avatar['id']): Profile
}

export interface ConnectionService {
  listConnections(): Connection[]
  listForProfile(profileId: Profile['id']): Connection[]
  requestConnection(toProfileId: Profile['id']): Connection
  respondToInvite(inviteId: Connection['id'], recipientProfileId: Profile['id'], decision: 'accepted' | 'declined'): Connection
  cancelInvite(inviteId: Connection['id'], senderProfileId: Profile['id']): Connection
}

export interface GamificationService {
  getProgress(profileId: Profile['id']): GamificationProgress | undefined
}

export interface DemoStateService {
  getStatus(): DemoPersistenceStatus
  reset(): DemoPersistenceStatus
}

export type OlimpoServices = {
  rooms: RoomService
  participants: ParticipantService
  messages: MessageService
  profile: ProfileService
  connections: ConnectionService
  gamification: GamificationService
  demoState: DemoStateService
}
