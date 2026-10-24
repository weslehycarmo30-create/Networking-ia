import { createConnection, createMessage, hasPendingConnection } from '../domain/rules'
import type { Avatar, Connection, Message, Presence, Profile } from '../domain/models'
import { demoAvatars, demoGuide, demoProfile, demoTerritories, messageSeeds, presenceSeeds } from '../data/demo'
import type { OlimpoServices } from './contracts'

export function createDemoServices(): OlimpoServices {
  let currentProfile: Profile = structuredClone(demoProfile)
  const connections: Connection[] = []
  let nextMessageId = 1
  const rooms = demoTerritories.map((room) => ({ ...room, position: [...room.position] as [number, number, number] }))
  const messages: Record<string, Message[]> = Object.fromEntries(rooms.map((room) => [room.id, (messageSeeds[room.id] ?? []).map((seed) => ({
    id: `${room.id}-seed-${seed.id}`,
    roomId: room.id,
    authorId: seed.authorId,
    authorName: seed.authorName,
    avatar: structuredClone(seed.avatar),
    createdAt: seed.createdAt,
    text: seed.text,
  }))]))

  return {
    rooms: {
      listRooms: () => rooms.map((room) => ({ ...room, position: [...room.position] as [number, number, number] })),
      getRoom: (roomId) => {
        const room = rooms.find((candidate) => candidate.id === roomId)
        return room ? { ...room, position: [...room.position] as [number, number, number] } : undefined
      },
    },
    participants: {
      listByRoom: (roomId): Presence[] => {
        if (!rooms.some((room) => room.id === roomId)) return []
        const seeded = (presenceSeeds[roomId] ?? []).map((person) => ({ ...person, roomId, avatar: structuredClone(person.avatar) }))
        return [...seeded, {
          id: `presence-${currentProfile.id}-${roomId}`,
          roomId,
          profileId: currentProfile.id,
          displayName: currentProfile.displayName,
          avatar: structuredClone(currentProfile.avatar),
          role: 'Você · explorador',
          status: 'online',
        }]
      },
    },
    messages: {
      listByRoom: (roomId) => (messages[roomId] ?? []).map((message) => ({ ...message, avatar: structuredClone(message.avatar) })),
      sendToRoom: (roomId, text) => {
        if (!messages[roomId]) throw new Error('A sala selecionada não existe.')
        const message = createMessage({
          id: `demo-message-${nextMessageId++}`,
          roomId,
          profile: currentProfile,
          text,
          createdAt: new Date().toISOString(),
        })
        messages[roomId].push(message)
        return { ...message, avatar: structuredClone(message.avatar) }
      },
    },
    profile: {
      getCurrent: () => structuredClone(currentProfile),
      updateAvatar: (avatarId) => {
        const avatar: Avatar | undefined = demoAvatars.find((candidate) => candidate.id === avatarId)
        if (!avatar) throw new Error('O avatar selecionado não existe.')
        currentProfile = { ...currentProfile, avatar: structuredClone(avatar) }
        return structuredClone(currentProfile)
      },
    },
    connections: {
      listConnections: () => connections.map((connection) => ({ ...connection })),
      requestConnection: (toProfileId) => {
        if (toProfileId !== demoGuide.id) throw new Error('O perfil de destino não existe na demonstração.')
        if (hasPendingConnection(connections, currentProfile.id, toProfileId)) throw new Error('Este pedido demonstrativo já foi enviado.')
        const connection = createConnection({
          id: `demo-connection-${connections.length + 1}`,
          fromProfileId: currentProfile.id,
          toProfileId,
          createdAt: new Date().toISOString(),
        })
        connections.push(connection)
        return { ...connection }
      },
    },
    gamification: {
      getProgress: (profileId) => profileId === currentProfile.id ? { ...currentProfile.gamification, badges: [...currentProfile.gamification.badges] } : undefined,
    },
  }
}
