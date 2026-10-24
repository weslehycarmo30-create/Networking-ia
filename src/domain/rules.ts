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
  return connections.some((connection) => connection.status === 'pending' && connection.fromProfileId === fromId && connection.toProfileId === toId)
}
