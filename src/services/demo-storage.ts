import { messageReactionEmojis, type Avatar, type Connection, type CommunityEvent, type DemoNotification, type DemoReport, type EventRegistration, type Message, type MessageReaction, type MessageReactionEmoji, type NotificationPreferences, type ReportReason, type SavedMessageReference } from '../domain/models'
import { defaultNotificationPreferences, notificationPreferenceEnabled } from '../domain/rules'
import { demoAvatars, demoCommunityProfiles, demoProfile, demoTerritories } from '../data/demo'
import { demoEvents } from '../data/events'

export const DEMO_STORAGE_KEY = 'olimpo:demo-state'
export const DEMO_STATE_VERSION = 10 as const
export const DEMO_EXPORT_FORMAT = 'olimpo-demo-data'
export const DEMO_EXPORT_FORMAT_VERSION = 1 as const
export const MAX_DEMO_IMPORT_BYTES = 5 * 1024 * 1024
// Stored-state limits. The adapter refuses to go past them, so a saved state never becomes unreadable.
export const DEMO_LIMITS = { messagesPerRoom: 500, connections: 200, reports: 4000, notifications: 500, savedMessages: 2500 } as const
// Prefix of the safety copies kept before stored data that cannot be read as-is is replaced.
export const DEMO_BACKUP_PREFIX = `${DEMO_STORAGE_KEY}:backup:`

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
const backupHint = 'Uma cópia dos dados anteriores foi guardada: baixe em Meu perfil → Transferir dados locais.'
const invalidMessage = `Os dados locais da demonstração eram inválidos; os dados iniciais foram restaurados. ${backupHint}`
const trimmedMessage = `Parte dos dados antigos passava dos limites da demonstração; os itens mais recentes foram mantidos. ${backupHint}`
const protectedMessage = 'Os dados locais não puderam ser lidos nem copiados. Eles foram preservados sem alteração; o que você fizer agora dura apenas nesta sessão.'
const knownProfiles = [demoProfile, ...demoCommunityProfiles]
const knownProfileById = new Map(knownProfiles.map((profile) => [profile.id, profile]))
const knownAvatars = new Map(demoAvatars.map((avatar) => [avatar.id, avatar]))
const roomIds = demoTerritories.map((room) => room.id)
const knownEvents = new Map(demoEvents.map((event) => [event.id, event]))
const allowedStatuses = new Set<Connection['status']>(['pending', 'accepted', 'declined', 'cancelled'])
const allowedReportReasons = new Set<ReportReason>(['spam', 'harassment', 'inappropriate', 'scam', 'other'])
const removedMessageText = 'Esta mensagem foi removida pelo autor.'

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

function validateMessage(value: unknown, roomId: string, allowReplies: boolean): Message | undefined {
  if (!isRecord(value)) return undefined
  if (!isShortString(value.id, 120) || value.roomId !== roomId || !isShortString(value.authorId, 80)) return undefined
  const author = knownProfileById.get(value.authorId)
  const avatar = avatarForMessage(value.authorId, isRecord(value.avatar) ? value.avatar.id : undefined)
  if (!author || !avatar || value.authorName !== author.displayName || !isValidDate(value.createdAt)) return undefined
  const deleted = Object.hasOwn(value, 'deleted')
  if (!deleted && (typeof value.text !== 'string' || value.text.trim().length === 0 || value.text.length > 300)) return undefined
  const rawReactions = Array.isArray(value.reactions) ? value.reactions : []
  const reactions: MessageReaction[] = []
  for (const reaction of rawReactions) {
    if (!isRecord(reaction) || reaction.profileId !== demoProfile.id || typeof reaction.emoji !== 'string') continue
    if (!messageReactionEmojis.includes(reaction.emoji as MessageReactionEmoji)) continue
    reactions.push({ profileId: demoProfile.id, emoji: reaction.emoji as MessageReactionEmoji })
    break
  }
  const replyToMessageId = allowReplies && isShortString(value.replyToMessageId, 120) && value.replyToMessageId !== value.id
    ? value.replyToMessageId
    : undefined
  const replyUnavailable = allowReplies && !replyToMessageId && (Object.hasOwn(value, 'replyToMessageId') || value.replyUnavailable === true)
  return {
    id: value.id,
    roomId,
    authorId: author.id,
    authorName: author.displayName,
    avatar: { ...avatar },
    createdAt: value.createdAt,
    text: deleted ? removedMessageText : value.text as string,
    reactions,
    ...(replyToMessageId ? { replyToMessageId } : {}),
    ...(replyUnavailable ? { replyUnavailable: true } : {}),
    ...(deleted ? { deleted: true } : {}),
  }
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
  const note = typeof value.note === 'string' && value.note.trim().length > 0 && value.note.length <= 240
    ? value.note.trim()
    : undefined
  if (value.targetType === 'profile') {
    if (!knownProfileById.has(value.targetId) || value.targetId === demoProfile.id) return undefined
  } else if (!Object.values(messages).some((roomMessages) => roomMessages.some((message) => message.id === value.targetId))) return undefined
  return {
    id: value.id,
    targetType: value.targetType,
    targetId: value.targetId,
    reason: value.reason as ReportReason,
    ...(note ? { note } : {}),
    createdAt: value.createdAt,
  }
}

function validateNotification(value: unknown, connections: Connection[]): DemoNotification | undefined {
  if (!isRecord(value) || !isShortString(value.id, 160) || !isValidDate(value.createdAt)) return undefined
  const readAt = isValidDate(value.readAt) ? value.readAt : undefined
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
  if (version !== 1 && version !== 2 && version !== 3 && version !== 4 && version !== 5 && version !== 6 && version !== 7 && version !== 8 && version !== 9 && version !== DEMO_STATE_VERSION) return undefined
  if (typeof value.avatarId !== 'string' || !knownAvatars.has(value.avatarId) || !isRecord(value.messages) || !Array.isArray(value.connections)) return undefined
  const storedRoomIds = Object.keys(value.messages)
  if (storedRoomIds.length !== roomIds.length || roomIds.some((roomId) => !Object.hasOwn(value.messages as object, roomId))) return undefined
  const messages: Record<string, Message[]> = {}
  const allMessageIds = new Set<string>()
  for (const roomId of roomIds) {
    const roomMessages = value.messages[roomId]
    if (!Array.isArray(roomMessages) || roomMessages.length > DEMO_LIMITS.messagesPerRoom) return undefined
    const parsed = roomMessages.map((message) => validateMessage(message, roomId, version >= 9))
    if (parsed.some((message) => message === undefined)) return undefined
    const validMessages = parsed as Message[]
    if (new Set(validMessages.map((message) => message.id)).size !== validMessages.length) return undefined
    if (validMessages.some((message) => allMessageIds.has(message.id))) return undefined
    for (const message of validMessages) allMessageIds.add(message.id)
    messages[roomId] = validMessages
  }
  for (const roomId of roomIds) {
    const availableRoomMessages = new Map(messages[roomId].map((message) => [message.id, message]))
    for (const message of messages[roomId]) {
      if (!message.replyToMessageId) continue
      if (!availableRoomMessages.has(message.replyToMessageId)) {
        delete message.replyToMessageId
        message.replyUnavailable = true
      }
    }
  }
  if (value.connections.length > DEMO_LIMITS.connections) return undefined
  const connections = value.connections.map(validateConnection)
  if (connections.some((connection) => connection === undefined)) return undefined
  const validConnections = connections as Connection[]
  if (new Set(validConnections.map((connection) => connection.id)).size !== validConnections.length) return undefined
  if (Array.isArray(value.reports) && value.reports.length > DEMO_LIMITS.reports) return undefined
  const rawReports = Array.isArray(value.reports) ? value.reports : []
  const validReports: DemoReport[] = []
  const reportIds = new Set<string>()
  const reportTargets = new Set<string>()
  for (const rawReport of rawReports) {
    const report = validateReport(rawReport, messages)
    if (!report) continue
    const target = `${report.targetType}:${report.targetId}`
    if (reportIds.has(report.id) || reportTargets.has(target)) continue
    reportIds.add(report.id)
    reportTargets.add(target)
    validReports.push(report)
  }
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
  if (!Array.isArray(rawNotifications) || rawNotifications.length > DEMO_LIMITS.notifications) return undefined
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
  const rawSavedMessages = version < 7 ? [] : Array.isArray(value.savedMessages) ? value.savedMessages.slice(0, DEMO_LIMITS.savedMessages) : []
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
  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10].includes(sourceSchemaVersion)) throw new Error('A versão dos dados deste arquivo não é compatível com esta demonstração.')
  if (sourceSchemaVersion >= 7 && Array.isArray(value.state.savedMessages) && value.state.savedMessages.length > 2500) throw new Error('A lista de mensagens salvas do arquivo excede o limite de 2.500 itens.')
  const state = validatePersistedDemoState(value.state)
  if (!state) throw new Error('Os dados do arquivo são inválidos ou incompatíveis; nenhum dado atual foi alterado.')
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

// Brings an over-limit stored state back within limits, keeping the newest items. Only used on
// load, after the original text has been copied; imports of over-limit files are still refused.
function trimToLimits(value: unknown): unknown {
  if (!isRecord(value) || !isRecord(value.messages) || !Array.isArray(value.connections)) return value
  const messages = Object.fromEntries(Object.entries(value.messages).map(([roomId, list]) => [roomId, Array.isArray(list) ? list.slice(-DEMO_LIMITS.messagesPerRoom) : list]))
  let excess = value.connections.length - DEMO_LIMITS.connections
  // Cancelled invites are not shown anywhere, so they go first.
  const connections = value.connections.filter((connection) => !(excess > 0 && isRecord(connection) && connection.status === 'cancelled' && excess--)).slice(-DEMO_LIMITS.connections)
  const keptIds = new Set(connections.map((connection) => isRecord(connection) ? connection.id : undefined))
  const notifications = Array.isArray(value.notifications)
    ? value.notifications.filter((item) => !isRecord(item) || item.kind !== 'connection_invite' || keptIds.has(item.connectionId)).slice(-DEMO_LIMITS.notifications)
    : value.notifications
  const reports = Array.isArray(value.reports) ? value.reports.slice(-DEMO_LIMITS.reports) : value.reports
  return { ...value, messages, connections, notifications, reports }
}

function backupKeys(): string[] {
  const keys: string[] = []
  for (let index = 0; index < window.localStorage.length; index += 1) {
    const key = window.localStorage.key(index)
    if (key?.startsWith(DEMO_BACKUP_PREFIX)) keys.push(key)
  }
  return keys.sort()
}

export function createDemoStateStorage() {
  let status: DemoPersistenceStatus = { persistent: true }
  // True when unreadable data could not be copied: the original must then stay untouched.
  let protectOriginal = false

  // Copies the stored text aside before anything may replace it. False means it is not safe to write.
  function preserve(raw: string): boolean {
    try {
      if (!backupKeys().some((key) => window.localStorage.getItem(key) === raw)) {
        window.localStorage.setItem(`${DEMO_BACKUP_PREFIX}${new Date().toISOString()}`, raw)
      }
      return true
    } catch {
      protectOriginal = true
      return false
    }
  }

  function unreadable(raw: string): LoadResult {
    status = preserve(raw) ? { persistent: true, message: invalidMessage } : { persistent: false, message: protectedMessage }
    return { status }
  }

  return {
    load(): LoadResult {
      try {
        const raw = window.localStorage.getItem(DEMO_STORAGE_KEY)
        if (raw === null) { status = { persistent: true }; return { status } }
        let parsed: unknown
        try { parsed = JSON.parse(raw) }
        catch { return unreadable(raw) }
        const state = validatePersistedDemoState(parsed)
        if (!state) {
          const trimmed = validatePersistedDemoState(trimToLimits(parsed))
          if (!trimmed) return unreadable(raw)
          if (!preserve(raw)) {
            status = { persistent: false, message: protectedMessage }
            return { state: trimmed, status }
          }
          const saved = this.save(trimmed)
          status = saved.persistent ? { persistent: true, message: trimmedMessage } : saved
          return { state: trimmed, status }
        }
        status = { persistent: true }
        if (isRecord(parsed) && (parsed.version !== DEMO_STATE_VERSION
          || parsed.avatarId !== state.avatarId
          || JSON.stringify(parsed.messages) !== JSON.stringify(state.messages)
          || JSON.stringify(parsed.draftsByRoom) !== JSON.stringify(state.draftsByRoom)
          || JSON.stringify(parsed.savedMessages) !== JSON.stringify(state.savedMessages)
          || JSON.stringify(parsed.connections) !== JSON.stringify(state.connections)
          || JSON.stringify(parsed.reports) !== JSON.stringify(state.reports)
          || JSON.stringify(parsed.eventRegistrations) !== JSON.stringify(state.eventRegistrations)
          || JSON.stringify(parsed.notifications) !== JSON.stringify(state.notifications)
          || JSON.stringify(parsed.notificationPreferences) !== JSON.stringify(state.notificationPreferences))) status = this.save(state)
        return { state, status }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
        return { status }
      }
    },
    // keepNotice: a bootstrap save right after load() must not erase the load notice
    // (e.g. "dados inválidos; os dados iniciais foram restaurados") before the UI shows it.
    save(state: PersistedDemoState, options: { keepNotice?: boolean } = {}): DemoPersistenceStatus {
      if (protectOriginal) {
        status = { persistent: false, message: protectedMessage }
        return { ...status }
      }
      try {
        window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state))
        status = options.keepNotice && status.persistent && status.message ? { persistent: true, message: status.message } : { persistent: true }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
      }
      return { ...status }
    },
    reset(): DemoPersistenceStatus {
      try {
        // An explicit reset erases everything OLIMPO stored, including safety copies.
        for (const key of backupKeys()) window.localStorage.removeItem(key)
        window.localStorage.removeItem(DEMO_STORAGE_KEY)
        protectOriginal = false
        status = { persistent: true }
      } catch {
        status = { persistent: false, message: localOnlyMessage }
      }
      return { ...status }
    },
    getStatus(): DemoPersistenceStatus { return { ...status } },
    // Most recent safety copy, as the original text.
    getBackup(): string | null {
      try {
        const latest = backupKeys().at(-1)
        return latest ? window.localStorage.getItem(latest) : null
      } catch { return null }
    },
  }
}
