import type { Connection, Message, Profile } from './models'

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
