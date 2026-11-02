import { messageReactionEmojis, type Avatar, type Connection, type CommunityEvent, type DemoNotification, type DemoReport, type EventRegistration, type Message, type MessageReaction, type MessageReactionEmoji, type NotificationPreferences, type ReportReason, type SavedMessageReference } from '../domain/models'
import { defaultNotificationPreferences, notificationPreferenceEnabled } from '../domain/rules'
import { demoAvatars, demoCommunityProfiles, demoProfile, demoTerritories } from '../data/demo'
import { demoEvents } from '../data/events'

export const DEMO_STORAGE_KEY = 'olimpo:demo-state'
export const DEMO_STATE_VERSION = 8 as const
export const DEMO_EXPORT_FORMAT = 'olimpo-demo-data'
export const DEMO_EXPORT_FORMAT_VERSION = 1 as const
export const MAX_DEMO_IMPORT_BYTES = 5 * 1024 * 1024

export type PersistedDemoState = {
  version: typeof DEMO_STATE_VERSION
  avatarId: Avatar['id']
  messages: Record<string, Message[]>
  draftsByRoom: Record<string, string>
  savedMessages: SavedMessageReference[]
  connections: Connection[]
  reports: DemoReport[]
  eventRegistrations: EventRegistration[]
  notifications: DemoNotification[]
  notificationPreferences: NotificationPreferences
}

export type DemoExportDocument = {
  format: typeof DEMO_EXPORT_FORMAT
  formatVersion: typeof DEMO_EXPORT_FORMAT_VERSION
  exportedAt: string
  state: PersistedDemoState
}

export type DemoImportSummary = {
  sourceSchemaVersion: number
  avatarLabel: string
  messages: number
  drafts: number
  savedMessages: number
  connections: number
  reports: number
  eventRegistrations: number
  notifications: number
}

export type ValidatedDemoImport = {
  state: PersistedDemoState
  summary: DemoImportSummary
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

function validateMessage(value: unknown, roomId: string, allowMissingReactions: boolean): Message | undefined {
  if (!isRecord(value)) return undefined
  if (!isShortString(value.id, 120) || value.roomId !== roomId || !isShortString(value.authorId, 80)) return undefined
  const author = knownProfileById.get(value.authorId)
  const avatar = avatarForMessage(value.authorId, isRecord(value.avatar) ? value.avatar.id : undefined)
  if (!author || !avatar || value.authorName !== author.displayName || !isValidDate(value.createdAt)) return undefined
  if (typeof value.text !== 'string' || value.text.trim().length === 0 || value.text.length > 300) return undefined
  const rawReactions = value.reactions === undefined && allowMissingReactions ? [] : value.reactions
  if (!Array.isArray(rawReactions) || rawReactions.length > 1) return undefined
  const reactions = rawReactions.map((reaction): MessageReaction | undefined => {
    if (!isRecord(reaction) || reaction.profileId !== demoProfile.id || typeof reaction.emoji !== 'string') return undefined
    if (!messageReactionEmojis.includes(reaction.emoji as MessageReactionEmoji)) return undefined
    return { profileId: demoProfile.id, emoji: reaction.emoji as MessageReactionEmoji }
  })
  if (reactions.some((reaction) => reaction === undefined)) return undefined
  return { id: value.id, roomId, authorId: author.id, authorName: author.displayName, avatar: { ...avatar }, createdAt: value.createdAt, text: value.text, reactions: reactions as MessageReaction[] }
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
  if (!isRecord(value)) return undefined
  const version = value.version
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== 6 && version !== 7 && version !== DEMO_STATE_VERSION) return undefined
  if (typeof value.avatarId !== 'string' || !knownAvatars.has(value.avatarId) || !isRecord(value.messages) || !Array.isArray(value.connections)) return undefined
  const storedRoomIds = Object.keys(value.messages)
  if (storedRoomIds.length !== roomIds.length || roomIds.some((roomId) => !Object.hasOwn(value.messages as object, roomId))) return undefined
  const messages: Record<string, Message[]> = {}
  for (const roomId of roomIds) {
    const roomMessages = value.messages[roomId]
    if (!Array.isArray(roomMessages) || roomMessages.length > 500) return undefined
    const parsed = roomMessages.map((message) => validateMessage(message, roomId, version < 6))
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
  const rawReports = version === 1 && value.reports === undefined ? [] : value.reports
  if (!Array.isArray(rawReports) || rawReports.length > 4000) return undefined
  const parsedReports = rawReports.map((report) => validateReport(report, messages))
  if (parsedReports.some((report) => report === undefined)) return undefined
  const validReports = parsedReports as DemoReport[]
  if (new Set(validReports.map((report) => report.id)).size !== validReports.length) return undefined
  const reportTargets = validReports.map((report) => `${report.targetType}:${report.targetId}`)
  if (new Set(reportTargets).size !== reportTargets.length) return undefined
  const rawRegistrations = version < 3 ? [] : value.eventRegistrations
  if (!Array.isArray(rawRegistrations) || rawRegistrations.length > knownEvents.size) return undefined
  const eventRegistrations = rawRegistrations.flatMap((registration): EventRegistration[] => {
    if (!isRecord(registration) || typeof registration.eventId !== 'string' || !knownEvents.has(registration.eventId)) return []
    if (registration.profileId !== demoProfile.id) return []
    return [{ eventId: registration.eventId as CommunityEvent['id'], profileId: demoProfile.id }]
  })
  if (eventRegistrations.length !== rawRegistrations.length) return undefined
  if (new Set(eventRegistrations.map((registration) => registration.eventId)).size !== eventRegistrations.length) return undefined
  const rawNotifications = version < 4 ? initialInviteNotifications(validConnections) : value.notifications
  if (!Array.isArray(rawNotifications) || rawNotifications.length > 500) return undefined
  const parsedNotifications = rawNotifications.map((notification) => validateNotification(notification, validConnections))
  if (parsedNotifications.some((notification) => notification === undefined)) return undefined
  const rawPreferences = version < 6 ? defaultNotificationPreferences : value.notificationPreferences
  const notificationPreferences = validateNotificationPreferences(rawPreferences)
  if (!notificationPreferences) return undefined
  const notifications = (parsedNotifications as DemoNotification[]).filter((notification) => notificationPreferenceEnabled(notificationPreferences, notification.kind))
  if (new Set(notifications.map((notification) => notification.id)).size !== notifications.length) return undefined
  const availableMessages = new Set(Object.values(messages).flat().map((message) => `${message.roomId}:${message.id}`))
  const draftsByRoom: Record<string, string> = {}
  if (version >= 8 && isRecord(value.draftsByRoom)) {
    for (const [roomId, draft] of Object.entries(value.draftsByRoom)) {
      if (roomIds.includes(roomId) && typeof draft === 'string' && draft.length <= 300 && draft.length > 0) draftsByRoom[roomId] = draft
    }
  }
  const rawSavedMessages = version < 7 ? [] : Array.isArray(value.savedMessages) ? value.savedMessages.slice(0, 2500) : []
  const savedMessages: SavedMessageReference[] = []
  const savedKeys = new Set<string>()
  for (const reference of rawSavedMessages) {
    if (!isRecord(reference) || !isShortString(reference.messageId, 120) || typeof reference.roomId !== 'string' || !roomIds.includes(reference.roomId)) continue
    const key = `${reference.roomId}:${reference.messageId}`
    if (!availableMessages.has(key) || savedKeys.has(key)) continue
    savedKeys.add(key)
    savedMessages.push({ messageId: reference.messageId, roomId: reference.roomId })
  }
  return { version: DEMO_STATE_VERSION, avatarId: value.avatarId, messages, draftsByRoom, savedMessages, connections: validConnections, reports: validReports, eventRegistrations, notifications, notificationPreferences }
}

export function createDemoExportDocument(value: unknown): DemoExportDocument {
  const state = validatePersistedDemoState(value)
  if (!state) throw new Error('O estado atual da demonstração não passou na validação de exportação.')
  return { format: DEMO_EXPORT_FORMAT, formatVersion: DEMO_EXPORT_FORMAT_VERSION, exportedAt: new Date().toISOString(), state }
}

export function validateDemoImportDocument(value: unknown): ValidatedDemoImport {
  if (!isRecord(value) || value.format !== DEMO_EXPORT_FORMAT || value.formatVersion !== DEMO_EXPORT_FORMAT_VERSION || !isValidDate(value.exportedAt)) {
    throw new Error('O arquivo não está no formato de exportação OLIMPO reconhecido.')
  }
  if (!isRecord(value.state) || typeof value.state.version !== 'number') throw new Error('O arquivo não contém um estado demonstrativo válido.')
  const sourceSchemaVersion = value.state.version
  if (![1, 2, 3, 4, 5, 6, 7, 8].includes(sourceSchemaVersion)) throw new Error('A versão dos dados deste arquivo não é compatível com esta demonstração.')
  if (sourceSchemaVersion >= 7) {
    if (!Array.isArray(value.state.savedMessages) || value.state.savedMessages.length > 2500) throw new Error('A lista de mensagens salvas do arquivo é inválida ou excede o limite de 2.500 itens.')
  }
  const state = validatePersistedDemoState(value.state)
  if (!state) throw new Error('Os dados do arquivo são inválidos ou incompatíveis; nenhum dado atual foi alterado.')
  if (sourceSchemaVersion >= 7 && state.savedMessages.length !== (value.state.savedMessages as unknown[]).length) {
    throw new Error('O arquivo contém referências salvas inválidas, antigas ou duplicadas; nenhum dado atual foi alterado.')
  }
  const messageCount = Object.values(state.messages).reduce((total, roomMessages) => total + roomMessages.length, 0)
  const avatarLabel = knownAvatars.get(state.avatarId)?.label ?? 'Avatar da demonstração'
  return {
    state,
    summary: {
      sourceSchemaVersion,
      avatarLabel,
      messages: messageCount,
      drafts: Object.keys(state.draftsByRoom).length,
      savedMessages: state.savedMessages.length,
      connections: state.connections.length,
      reports: state.reports.length,
      eventRegistrations: state.eventRegistrations.length,
      notifications: state.notifications.length,
    },
  }
}

export function parseDemoImportText(text: string): ValidatedDemoImport {
  if (new TextEncoder().encode(text).byteLength > MAX_DEMO_IMPORT_BYTES) throw new Error('O arquivo excede o limite de 5 MiB.')
  let parsed: unknown
  try { parsed = JSON.parse(text) }
  catch { throw new Error('O arquivo não contém JSON válido.') }
  return validateDemoImportDocument(parsed)
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
        if (isRecord(parsed) && (parsed.version !== DEMO_STATE_VERSION || JSON.stringify(parsed.draftsByRoom) !== JSON.stringify(state.draftsByRoom))) status = this.save(state)
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
