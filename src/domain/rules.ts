import type { CommunityEvent, Connection, DemoNotification, DemoReport, EventRegistration, Message, NotificationPreferences, Profile, ReportReason, ReportTargetType } from './models'

const reportReasons = new Set<ReportReason>(['spam', 'harassment', 'inappropriate', 'scam', 'other'])

export const defaultNotificationPreferences: NotificationPreferences = { connectionInvites: true, eventActivity: true }

export function notificationPreferenceEnabled(preferences: NotificationPreferences, kind: DemoNotification['kind']): boolean {
  return kind === 'connection_invite' ? preferences.connectionInvites : preferences.eventActivity
}

export function createDemoReport(input: {
  id: string
  targetType: ReportTargetType
  targetId: DemoReport['targetId']
  reason: ReportReason
  note?: string
  createdAt: string
}): DemoReport {
  if (input.targetType !== 'message' && input.targetType !== 'profile') throw new Error('O item da denúncia demonstrativa é inválido.')
  if (!reportReasons.has(input.reason)) throw new Error('Selecione um motivo válido para a denúncia demonstrativa.')
  if (input.note !== undefined && typeof input.note !== 'string') throw new Error('A observação da denúncia deve ser texto.')
  if (input.note && input.note.length > 240) throw new Error('A observação deve ter no máximo 240 caracteres.')
  const note = input.note?.trim()
  return { id: input.id, targetType: input.targetType, targetId: input.targetId, reason: input.reason, ...(note ? { note } : {}), createdAt: input.createdAt }
}

export function createEventRegistration(event: CommunityEvent, profileId: Profile['id']): EventRegistration {
  return { eventId: event.id, profileId }
}

export function markNotificationRead(notification: DemoNotification, readAt: string): DemoNotification {
  if (!Number.isFinite(Date.parse(readAt))) throw new Error('O horario de leitura da notificacao e invalido.')
  return notification.readAt ? { ...notification } : { ...notification, readAt }
}

export function markNotificationsRead(notifications: DemoNotification[], readAt: string): DemoNotification[] {
  return notifications.map((notification) => markNotificationRead(notification, readAt))
}

export function normalizeMessageText(value: string): string {
  const text = value.trim()
  if (!text) throw new Error('A mensagem não pode ficar vazia.')
  if (text.length > 300) throw new Error('A mensagem deve ter no máximo 300 caracteres.')
  return text
}

export function createMessage(input: {
  id: string
  roomId: string
  profile: Profile
  text: string
  createdAt: string
}): Message {
  return {
    id: input.id,
    roomId: input.roomId,
    authorId: input.profile.id,
    authorName: input.profile.displayName,
    avatar: input.profile.avatar,
    createdAt: input.createdAt,
    text: normalizeMessageText(input.text),
    reactions: [],
  }
}

export function createConnection(input: {
  id: string
  fromProfileId: string
  toProfileId: string
  createdAt: string
}): Connection {
  if (input.fromProfileId === input.toProfileId) throw new Error('Um perfil não pode solicitar conexão consigo mesmo.')
  return { ...input, status: 'pending' }
}

export function hasPendingConnection(connections: Connection[], fromId: string, toId: string): boolean {
  return connections.some((connection) => connection.status === 'pending' && matchesPair(connection, fromId, toId))
}

export function findConnectionBetween(connections: Connection[], firstId: string, secondId: string): Connection | undefined {
  return [...connections].reverse().find((connection) => connection.status !== 'cancelled' && matchesPair(connection, firstId, secondId))
}

export function respondToConnection(connection: Connection, responderId: string, decision: 'accepted' | 'declined'): Connection {
  if (connection.status !== 'pending') throw new Error('Este convite não está mais pendente.')
  if (connection.toProfileId !== responderId) throw new Error('Somente o destinatário pode responder a este convite.')
  return { ...connection, status: decision }
}

export function cancelConnection(connection: Connection, senderId: string): Connection {
  if (connection.status !== 'pending') throw new Error('Somente convites pendentes podem ser cancelados.')
  if (connection.fromProfileId !== senderId) throw new Error('Somente quem enviou pode cancelar este convite.')
  return { ...connection, status: 'cancelled' }
}

function matchesPair(connection: Connection, firstId: string, secondId: string): boolean {
  return (connection.fromProfileId === firstId && connection.toProfileId === secondId)
    || (connection.fromProfileId === secondId && connection.toProfileId === firstId)
}
