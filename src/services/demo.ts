import { cancelConnection, createConnection, createDemoReport, createEventRegistration, createMessage, findConnectionBetween, hasPendingConnection, respondToConnection } from '../domain/rules'
import type { Avatar, Connection, DemoReport, EventRegistration, Message, Presence, Profile, TerritoryId } from '../domain/models'
import { demoAvatars, demoCommunityProfiles, demoProfile, demoTerritories, messageSeeds, presenceSeeds } from '../data/demo'
import { demoEvents } from '../data/events'
import type { OlimpoServices } from './contracts'
import { createDemoStateStorage, DEMO_STATE_VERSION } from './demo-storage'

export function createDemoServices(): OlimpoServices {
  const storage = createDemoStateStorage()
  const loaded = storage.load()
  let currentProfile: Profile = structuredClone(demoProfile)
  if (loaded.state) {
    const avatar = demoAvatars.find((candidate) => candidate.id === loaded.state?.avatarId)
    if (avatar) currentProfile = { ...currentProfile, avatar: structuredClone(avatar) }
  }
  let connections: Connection[] = loaded.state?.connections.map((connection) => ({ ...connection })) ?? createInitialConnections()
  let reports: DemoReport[] = loaded.state?.reports.map((report) => ({ ...report })) ?? []
  let eventRegistrations: EventRegistration[] = loaded.state?.eventRegistrations.map((registration) => ({ ...registration })) ?? []
  let currentRoomId: string | undefined
  const findProfile = (profileId: string): Profile | undefined => profileId === currentProfile.id
    ? currentProfile
    : demoCommunityProfiles.find((candidate) => candidate.id === profileId)
  const rooms = demoTerritories.map((room) => ({ ...room, position: [...room.position] as [number, number, number] }))
  const createInitialMessages = (): Record<string, Message[]> => Object.fromEntries(rooms.map((room) => [room.id, (messageSeeds[room.id] ?? []).map((seed) => ({
    id: `${room.id}-seed-${seed.id}`,
    roomId: room.id,
    authorId: seed.authorId,
    authorName: seed.authorName,
    avatar: structuredClone(seed.avatar),
    createdAt: seed.createdAt,
    text: seed.text,
  }))]))
  let messages: Record<string, Message[]> = loaded.state?.messages ?? createInitialMessages()

  function saveState() {
    storage.save({ version: DEMO_STATE_VERSION, avatarId: currentProfile.avatar.id, messages, connections, reports, eventRegistrations })
  }

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
        const seeded = (presenceSeeds[roomId] ?? []).flatMap((person) => {
          const profile = demoCommunityProfiles.find((candidate) => candidate.id === person.profileId)
          return profile ? [{ ...person, roomId, displayName: profile.displayName, avatar: structuredClone(profile.avatar) }] : []
        })
        const current: Presence[] = currentRoomId === roomId ? [{
          id: `presence-${currentProfile.id}-${roomId}`,
          roomId,
          profileId: currentProfile.id,
          displayName: currentProfile.displayName,
          avatar: structuredClone(currentProfile.avatar),
          role: 'Você · explorador',
          status: 'online',
        }] : []
        return [...seeded, ...current]
      },
      joinRoom: (roomId) => {
        if (!rooms.some((room) => room.id === roomId)) throw new Error('A sala selecionada não existe.')
        currentRoomId = roomId
        return {
          id: `presence-${currentProfile.id}-${roomId}`,
          roomId,
          profileId: currentProfile.id,
          displayName: currentProfile.displayName,
          avatar: structuredClone(currentProfile.avatar),
          role: 'Você · explorador',
          status: 'online',
        }
      },
      leaveRoom: (roomId) => { if (currentRoomId === roomId) currentRoomId = undefined },
      clearCurrentPresence: () => { currentRoomId = undefined },
    },
    messages: {
      listByRoom: (roomId) => (messages[roomId] ?? []).map((message) => ({ ...message, avatar: structuredClone(message.avatar) })),
      sendToRoom: (roomId, text) => {
        if (!messages[roomId]) throw new Error('A sala selecionada não existe.')
        const message = createMessage({
          id: `demo-message-${crypto.randomUUID()}`,
          roomId,
          profile: currentProfile,
          text,
          createdAt: new Date().toISOString(),
        })
        messages[roomId].push(message)
        saveState()
        return { ...message, avatar: structuredClone(message.avatar) }
      },
    },
    profile: {
      getCurrent: () => structuredClone(currentProfile),
      getProfile: (profileId) => {
        const profile = findProfile(profileId)
        return profile ? structuredClone(profile) : undefined
      },
      listCommunity: () => demoCommunityProfiles.filter((candidate) => candidate.id !== currentProfile.id).map((profile) => structuredClone(profile)),
      updateAvatar: (avatarId) => {
        const avatar: Avatar | undefined = demoAvatars.find((candidate) => candidate.id === avatarId)
        if (!avatar) throw new Error('O avatar selecionado não existe.')
        currentProfile = { ...currentProfile, avatar: structuredClone(avatar) }
        saveState()
        return structuredClone(currentProfile)
      },
    },
    connections: {
      listConnections: () => connections.map((connection) => ({ ...connection })),
      listForProfile: (profileId) => connections.filter((connection) => connection.fromProfileId === profileId || connection.toProfileId === profileId).map((connection) => ({ ...connection })),
      requestConnection: (toProfileId) => {
        if (!findProfile(toProfileId)) throw new Error('O perfil de destino não existe na demonstração.')
        if (toProfileId === currentProfile.id) throw new Error('Você já está vendo o seu perfil.')
        if (hasPendingConnection(connections, currentProfile.id, toProfileId)) throw new Error('Este pedido demonstrativo já foi enviado.')
        if (findConnectionBetween(connections, currentProfile.id, toProfileId)?.status === 'accepted') throw new Error('Vocês já são conexões.')
        const connection = createConnection({
          id: `demo-connection-${connections.length + 1}`,
          fromProfileId: currentProfile.id,
          toProfileId,
          createdAt: new Date().toISOString(),
        })
        connections.push(connection)
        saveState()
        return { ...connection }
      },
      respondToInvite: (inviteId, recipientProfileId, decision) => {
        const index = connections.findIndex((connection) => connection.id === inviteId)
        if (index < 0) throw new Error('Este convite não existe na demonstração.')
        if (!findProfile(recipientProfileId)) throw new Error('O perfil destinatário não existe na demonstração.')
        const updated = respondToConnection(connections[index], recipientProfileId, decision)
        connections[index] = updated
        saveState()
        return { ...updated }
      },
      cancelInvite: (inviteId, senderProfileId) => {
        const index = connections.findIndex((connection) => connection.id === inviteId)
        if (index < 0) throw new Error('Este convite não existe na demonstração.')
        const updated = cancelConnection(connections[index], senderProfileId)
        connections[index] = updated
        saveState()
        return { ...updated }
      },
    },
    reports: {
      hasReport: (targetType, targetId) => reports.some((report) => report.targetType === targetType && report.targetId === targetId),
      submit: (input) => {
        if (reports.some((report) => report.targetType === input.targetType && report.targetId === input.targetId)) {
          throw new Error('Este item já foi sinalizado nesta demonstração.')
        }
        if (input.targetType === 'profile') {
          if (!findProfile(input.targetId) || input.targetId === currentProfile.id) throw new Error('Este perfil não pode ser sinalizado na demonstração.')
        } else if (!rooms.some((room) => messages[room.id]?.some((message) => message.id === input.targetId))) {
          throw new Error('Esta mensagem não existe na demonstração.')
        }
        const report = createDemoReport({ ...input, id: `demo-report-${crypto.randomUUID()}`, createdAt: new Date().toISOString() })
        reports.push(report)
        saveState()
        return { ...report }
      },
    },
    gamification: {
      getProgress: (profileId) => profileId === currentProfile.id ? { ...currentProfile.gamification, badges: [...currentProfile.gamification.badges] } : undefined,
    },
    events: {
      listEvents: (territoryId?: TerritoryId) => demoEvents
        .filter((event) => !territoryId || event.territoryId === territoryId)
        .map((event) => ({
          ...event,
          participantCount: event.participantCount + eventRegistrations.filter((registration) => registration.eventId === event.id).length,
        })),
      isRegistered: (eventId, profileId) => eventRegistrations.some((registration) => registration.eventId === eventId && registration.profileId === profileId),
      register: (eventId, profileId) => {
        const event = demoEvents.find((candidate) => candidate.id === eventId)
        if (!event) throw new Error('Este encontro nao existe nesta demonstracao.')
        if (profileId !== currentProfile.id) throw new Error('Somente o participante atual pode se inscrever nesta demonstracao.')
        if (eventRegistrations.some((registration) => registration.eventId === eventId && registration.profileId === profileId)) {
          throw new Error('A inscricao neste encontro ja esta ativa.')
        }
        const registration = createEventRegistration(event, profileId)
        eventRegistrations.push(registration)
        saveState()
        return { ...registration }
      },
      cancelRegistration: (eventId, profileId) => {
        if (profileId !== currentProfile.id) throw new Error('Somente o participante atual pode cancelar esta inscricao.')
        const index = eventRegistrations.findIndex((registration) => registration.eventId === eventId && registration.profileId === profileId)
        if (index < 0) throw new Error('Esta inscricao demonstrativa nao esta ativa.')
        eventRegistrations.splice(index, 1)
        saveState()
      },
    },
    demoState: {
      getStatus: () => storage.getStatus(),
      reset: () => {
        const status = storage.reset()
        currentRoomId = undefined
        currentProfile = structuredClone(demoProfile)
        messages = createInitialMessages()
        connections = createInitialConnections()
        reports = []
        eventRegistrations = []
        return status
      },
    },
  }
}

function createInitialConnections(): Connection[] {
  return [
    { id: 'demo-invite-lia', fromProfileId: 'lia', toProfileId: demoProfile.id, status: 'pending', createdAt: '2026-10-24T10:35:00.000Z' },
    { id: 'demo-connection-caio', fromProfileId: demoProfile.id, toProfileId: 'caio', status: 'accepted', createdAt: '2026-10-23T14:20:00.000Z' },
  ]
}
