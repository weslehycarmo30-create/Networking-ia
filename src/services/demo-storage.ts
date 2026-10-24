import type { Avatar, Connection, CommunityEvent, DemoNotification, DemoReport, EventRegistration, Message, NotificationPreferences, ReportReason } from '../domain/models'
import { defaultNotificationPreferences, notificationPreferenceEnabled } from '../domain/rules'
import { demoAvatars, demoCommunityProfiles, demoProfile, demoTerritories } from '../data/demo'
import { demoEvents } from '../data/events'

export const DEMO_STORAGE_KEY = 'olimpo:demo-state'
export const DEMO_STATE_VERSION = 5 as const

export type PersistedDemoState = {
  version: typeof DEMO_STATE_VERSION
  avatarId: Avatar['id']
  messages: Record<string, Message[]>
  connections: Connection[]
  reports: DemoReport[]
  eventRegistrations: EventRegistration[]
  notifications: DemoNotification[]
  notificationPreferences: NotificationPreferences
}

export type DemoPersistenceStatus = {
  persistent: boolean
  message?: string
}

type LoadResult = { state?: PersistedDemoState; status: DemoPersistenceStatus }

const localOnlyMessage = 'O armazenamento local está indisponível; alterações ficam apenas nesta sessão.'
const knownProfiles = [demoProfile, ...demoCommunityProfiles]
const knownProfileById = new Map(knownProfiles.map((profile) => [profile.id, profile]))
const knownAvatars = new Map(demoAvatars.map((avatar) => [avatar.id, avatar]))
const roomIds = demoTerritories.map((room) => room.id)
const knownEvents = new Map(demoEvents.map((event) => [event.id, event]))
const allowedStatuses = new Set<Connection['status']>(['pending', 'accepted', 'declined', 'cancelled'])
const allowedReportReasons = new Set<ReportReason>(['spam', 'harassment', 'inappropriate', 'scam', 'other'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isShortString(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maxLength
}

function isValidDate(value: unknown): value is string {
  return isShortString(value, 40) && Number.isFinite(Date.parse(value))
}

function avatarForMessage(authorId: string, avatarId: unknown): Avatar | undefined {
  const author = knownProfileById.get(authorId)
  if (!author || typeof avatarId !== 'string') return undefined
  if (authorId === demoProfile.id) return knownAvatars.get(avatarId)
  return author.avatar.id === avatarId ? author.avatar : undefined
}

function validateMessage(value: unknown, roomId: string): Message | undefined {
  if (!isRecord(value)) return undefined
  if (!isShortString(value.id, 120) || value.roomId !== roomId || !isShortString(value.authorId, 80)) return undefined
  const author = knownProfileById.get(value.authorId)
  const avatar = avatarForMessage(value.authorId, isRecord(value.avatar) ? value.avatar.id : undefined)
  if (!author || !avatar || value.authorName !== author.displayName || !isValidDate(value.createdAt)) return undefined
  if (typeof value.text !== 'string' || value.text.trim().length === 0 || value.text.length > 300) return undefined
  return { id: value.id, roomId, authorId: author.id, authorName: author.displayName, avatar: { ...avatar }, createdAt: value.createdAt, text: value.text }
}

function validateConnection(value: unknown): Connection | undefined {
  if (!isRecord(value) || !isShortString(value.id, 120)) return undefined
  if (!isShortString(value.fromProfileId, 80) || !knownProfileById.has(value.fromProfileId)) return undefined
  if (!isShortString(value.toProfileId, 80) || !knownProfileById.has(value.toProfileId) || value.fromProfileId === value.toProfileId) return undefined
  if (typeof value.status !== 'string' || !allowedStatuses.has(value.status as Connection['status']) || !isValidDate(value.createdAt)) return undefined
  return {
    id: value.id,
    fromProfileId: value.fromProfileId,
    toProfileId: value.toProfileId,
    status: value.status as Connection['status'],
    createdAt: value.createdAt,
  }
}

function validateReport(value: unknown, messages: Record<string, Message[]>): DemoReport | undefined {
  if (!isRecord(value) || !isShortString(value.id, 120)) return undefined
  if (value.targetType !== 'message' && value.targetType !== 'profile') return undefined
  if (!isShortString(value.targetId, 120) || !isValidDate(value.createdAt)) return undefined
  if (typeof value.reason !== 'string' || !allowedReportReasons.has(value.reason as ReportReason)) return undefined
  if (value.note !== undefined && (typeof value.note !== 'string' || value.note.trim().length === 0 || value.note.length > 240)) return undefined
  if (value.targetType === 'profile') {
    if (!knownProfileById.has(value.targetId) || value.targetId === demoProfile.id) return undefined
  } else if (!Object.values(messages).some((roomMessages) => roomMessages.some((message) => message.id === value.targetId))) return undefined
  return {
    id: value.id,
    targetType: value.targetType,
    targetId: value.targetId,
    reason: value.reason as ReportReason,
    ...(typeof value.note === 'string' ? { note: value.note } : {}),
    createdAt: value.createdAt,
  }
}

function validateNotification(value: unknown, connections: Connection[]): DemoNotification | undefined {
  if (!isRecord(value) || !isShortString(value.id, 160) || !isValidDate(value.createdAt)) return undefined
  if (value.readAt !== undefined && !isValidDate(value.readAt)) return undefined
  const readAt = typeof value.readAt === 'string' ? value.readAt : undefined
  if (value.kind === 'connection_invite') {
    if (!isShortString(value.connectionId, 120) || !isShortString(value.profileId, 80)) return undefined
    const connection = connections.find((item) => item.id === value.connectionId)
    if (!connection || connection.toProfileId !== demoProfile.id || connection.fromProfileId !== value.profileId) return undefined
    if (value.id !== `invite-${connection.id}`) return undefined
    return { id: value.id, kind: 'connection_invite', connectionId: connection.id, profileId: connection.fromProfileId, createdAt: value.createdAt, ...(readAt ? { readAt } : {}) }
  }
  if (value.kind === 'event_registration') {
    if (typeof value.eventId !== 'string' || !knownEvents.has(value.eventId)) return undefined
    if (value.action !== 'registered' && value.action !== 'cancelled') return undefined
    return { id: value.id, kind: 'event_registration', eventId: value.eventId, action: value.action, createdAt: value.createdAt, ...(readAt ? { readAt } : {}) }
  }
  return undefined
}

function initialInviteNotifications(connections: Connection[]): DemoNotification[] {
  return connections.flatMap((connection): DemoNotification[] => connection.status === 'pending' && connection.toProfileId === demoProfile.id
    ? [{ id: `invite-${connection.id}`, kind: 'connection_invite', connectionId: connection.id, profileId: connection.fromProfileId, createdAt: connection.createdAt }]
    : [])
}

function validateNotificationPreferences(value: unknown): NotificationPreferences | undefined {
  if (!isRecord(value) || typeof value.connectionInvites !== 'boolean' || typeof value.eventActivity !== 'boolean') return undefined
  return { connectionInvites: value.connectionInvites, eventActivity: value.eventActivity }
}

export function validatePersistedDemoState(value: unknown): PersistedDemoState | undefined {
  if (!isRecord(value) || (value.version !== 1 && value.version !== 2 && value.version !== 3 && value.version !== 4 && value.version !== DEMO_STATE_VERSION)) return undefined
  if (typeof value.avatarId !== 'string' || !knownAvatars.has(value.avatarId) || !isRecord(value.messages) || !Array.isArray(value.connections)) return undefined
  const storedRoomIds = Object.keys(value.messages)
  if (storedRoomIds.length !== roomIds.length || roomIds.some((roomId) => !Object.hasOwn(value.messages as object, roomId))) return undefined
  const messages: Record<string, Message[]> = {}
  for (const roomId of roomIds) {
    const roomMessages = value.messages[roomId]
    if (!Array.isArray(roomMessages) || roomMessages.length > 500) return undefined
    const parsed = roomMessages.map((message) => validateMessage(message, roomId))
    if (parsed.some((message) => message === undefined)) return undefined
    const validMessages = parsed as Message[]
    if (new Set(validMessages.map((message) => message.id)).size !== validMessages.length) return undefined
    messages[roomId] = validMessages
  }
  if (value.connections.length > 200) return undefined
  const connections = value.connections.map(validateConnection)
  if (connections.some((connection) => connection === undefined)) return undefined
  const validConnections = connections as Connection[]
  if (new Set(validConnections.map((connection) => connection.id)).size !== validConnections.length) return undefined
  const rawReports = value.version === 1 && value.reports === undefined ? [] : value.reports
  if (!Array.isArray(rawReports) || rawReports.length > 4000) return undefined
  const parsedReports = rawReports.map((report) => validateReport(report, messages))
  if (parsedReports.some((report) => report === undefined)) return undefined
  const validReports = parsedReports as DemoReport[]
  if (new Set(validReports.map((report) => report.id)).size !== validReports.length) return undefined
  const reportTargets = validReports.map((report) => `${report.targetType}:${report.targetId}`)
  if (new Set(reportTargets).size !== reportTargets.length) return undefined
  const rawRegistrations = value.version < 3 ? [] : value.eventRegistrations
  if (!Array.isArray(rawRegistrations) || rawRegistrations.length > knownEvents.size) return undefined
  const eventRegistrations = rawRegistrations.flatMap((registration): EventRegistration[] => {
    if (!isRecord(registration) || typeof registration.eventId !== 'string' || !knownEvents.has(registration.eventId)) return []
    if (registration.profileId !== demoProfile.id) return []
    return [{ eventId: registration.eventId as CommunityEvent['id'], profileId: demoProfile.id }]
  })
  if (eventRegistrations.length !== rawRegistrations.length) return undefined
  if (new Set(eventRegistrations.map((registration) => registration.eventId)).size !== eventRegistrations.length) return undefined
  const rawNotifications = value.version < 4 ? initialInviteNotifications(validConnections) : value.notifications
  if (!Array.isArray(rawNotifications) || rawNotifications.length > 500) return undefined
  const parsedNotifications = rawNotifications.map((notification) => validateNotification(notification, validConnections))
  if (parsedNotifications.some((notification) => notification === undefined)) return undefined
  const rawPreferences = value.version < DEMO_STATE_VERSION ? defaultNotificationPreferences : value.notificationPreferences
  const notificationPreferences = validateNotificationPreferences(rawPreferences)
  if (!notificationPreferences) return undefined
  const notifications = (parsedNotifications as DemoNotification[]).filter((notification) => notificationPreferenceEnabled(notificationPreferences, notification.kind))
  if (new Set(notifications.map((notification) => notification.id)).size !== notifications.length) return undefined
  return { version: DEMO_STATE_VERSION, avatarId: value.avatarId, messages, connections: validConnections, reports: validReports, eventRegistrations, notifications, notificationPreferences }
}

export function createDemoStateStorage() {
  let status: DemoPersistenceStatus = { persistent: true }

  return {
    load(): LoadResult {
      try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
        if (raw === null) { status = { persistent: true }; return { status } }
        let parsed: unknown
        try { parsed = JSON.parse(raw) }
        catch {
          status = { persistent: true, message: 'Os dados locais da demonstração eram inválidos; os dados iniciais foram restaurados.' }
          return { status }
        }
        const state = validatePersistedDemoState(parsed)
        if (!state) {
          status = { persistent: true, message: 'Os dados locais da demonstração eram inválidos; os dados iniciais foram restaurados.' }
          return { status }
        }
        status = { persistent: true }
        if (isRecord(parsed) && parsed.version !== DEMO_STATE_VERSION) status = this.save(state)
        return { state, status }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
        return { status }
      }
    },
    save(state: PersistedDemoState): DemoPersistenceStatus {
      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
        status = { persistent: true }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
      }
      return { ...status }
    },
    reset(): DemoPersistenceStatus {
      try {
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
        status = { persistent: true }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
      }
      return { ...status }
    },
    getStatus(): DemoPersistenceStatus { return { ...status } },
  }
}
