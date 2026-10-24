import type { Avatar, CommunityEvent, Connection, DemoReport, EventRegistration, GamificationProgress, Message, Presence, Profile, ReportReason, ReportTargetType, TerritoryId, TerritoryRoom } from '../domain/models'
import type { DemoPersistenceStatus } from './demo-storage'

export interface RoomService {
  listRooms(): TerritoryRoom[]
  getRoom(roomId: string): TerritoryRoom | undefined
}

export interface ParticipantService {
  listByRoom(roomId: string): Presence[]
  joinRoom(roomId: string): Presence
  leaveRoom(roomId: string): void
  clearCurrentPresence(): void
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

export interface ReportService {
  hasReport(targetType: ReportTargetType, targetId: DemoReport['targetId']): boolean
  submit(input: { targetType: ReportTargetType; targetId: DemoReport['targetId']; reason: ReportReason; note?: string }): DemoReport
}

export interface GamificationService {
  getProgress(profileId: Profile['id']): GamificationProgress | undefined
}

export interface CommunityEventService {
  listEvents(territoryId?: TerritoryId): CommunityEvent[]
  isRegistered(eventId: CommunityEvent['id'], profileId: Profile['id']): boolean
  register(eventId: CommunityEvent['id'], profileId: Profile['id']): EventRegistration
  cancelRegistration(eventId: CommunityEvent['id'], profileId: Profile['id']): void
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
  reports: ReportService
  gamification: GamificationService
  events: CommunityEventService
  demoState: DemoStateService
}
