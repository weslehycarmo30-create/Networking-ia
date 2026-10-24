import type { Avatar, Connection, Message } from '../domain/models'
import { demoAvatars, demoCommunityProfiles, demoProfile, demoTerritories } from '../data/demo'

export const DEMO_STORAGE_KEY = 'olimpo:demo-state'
export const DEMO_STATE_VERSION = 1 as const

export type PersistedDemoState = {
  version: typeof DEMO_STATE_VERSION
  avatarId: Avatar['id']
  messages: Record<string, Message[]>
  connections: Connection[]
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
const allowedStatuses = new Set<Connection['status']>(['pending', 'accepted', 'declined', 'cancelled'])

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

export function validatePersistedDemoState(value: unknown): PersistedDemoState | undefined {
  if (!isRecord(value) || value.version !== DEMO_STATE_VERSION) return undefined
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
  return { version: DEMO_STATE_VERSION, avatarId: value.avatarId, messages, connections: validConnections }
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
