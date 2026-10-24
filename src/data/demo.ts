import type { Avatar, Message, Profile, Presence, TerritoryRoom } from '../domain/models'
import { guide, territories } from './territories'

export const demoAvatars: Avatar[] = [
  { id: 'explorer', label: 'Explorador', emoji: '🧭' },
  { id: 'botanist', label: 'Botânico', emoji: '🌿' },
  { id: 'builder', label: 'Construtor', emoji: '🛠️' },
  { id: 'creative', label: 'Criativo', emoji: '✨' },
  { id: 'observer', label: 'Observador', emoji: '🌙' },
  { id: 'solar', label: 'Solar', emoji: '☀️' },
]

export const demoProfile: Profile = {
  id: 'demo-alex', displayName: 'Alex', handle: '@alex.explora', avatar: demoAvatars[0],
  bio: 'Construindo ideias, um passo de cada vez.',
  interests: ['Inteligência artificial', 'Produtos digitais', 'Novas conexões'],
  gamification: { level: 1, points: 30, badges: ['Primeiros passos'] },
}

export const demoGuide = guide
export const demoTerritories: TerritoryRoom[] = territories

type MessageSeed = Pick<Message, 'id' | 'authorId' | 'authorName' | 'avatar' | 'createdAt' | 'text'>
const seedAvatar = (avatar: Avatar): Avatar => ({ ...avatar })
const communityAvatars = [
  { id: 'lia', label: 'Lia', emoji: '🌿' },
  { id: 'caio', label: 'Caio', emoji: '🛠️' },
  { id: 'nina', label: 'Nina', emoji: '🌙' },
]
const seedTexts = [
  ['Oi, pessoal! Cheguei agora. O que estão criando por aqui?', 'Bem-vinda! Estou explorando ideias para meu próximo projeto.', 'Que legal. Depois compartilha o que encontrar!'],
  ['Olá! Em que vocês estão trabalhando nesta semana?', 'Estou experimentando uma ideia nova e aprendendo bastante.', 'Adoro trocar aprendizados por aqui!'],
  ['Oi, comunidade! Que bom encontrar vocês.', 'Tem muita coisa interessante acontecendo nesta sala.', 'Vim para ouvir ideias e compartilhar também!'],
  ['Olá! Alguém quer pensar junto sobre uma ideia?', 'Claro! Pode contar um pouco mais.', 'Vamos construir essa conversa juntos.'],
  ['Oi, pessoal! Como está sendo a semana?', 'Por aqui cheia de boas descobertas.', 'Que bom! Conta mais quando quiser.'],
  ['Cheguei para uma pausa e uma conversa leve.', 'Bem-vinda! Qual assunto está animando vocês?', 'Sempre cabe uma boa história por aqui.'],
]

export const messageSeeds: Record<string, MessageSeed[]> = Object.fromEntries(territories.map((room, index) => [room.id, seedTexts[index].map((text, messageIndex) => ({
  id: `seed-${messageIndex + 1}`,
  authorId: communityAvatars[messageIndex].id,
  authorName: communityAvatars[messageIndex].label,
  avatar: seedAvatar(communityAvatars[messageIndex]),
  createdAt: `2026-10-24T10:${42 + messageIndex * 2}:00.000Z`,
  text,
}))]))

type PresenceSeed = Omit<Presence, 'roomId'>
export const presenceSeeds: Record<string, PresenceSeed[]> = Object.fromEntries(territories.map((room) => [room.id, [
  { profileId: 'lia', displayName: 'Lia', avatar: seedAvatar(communityAvatars[0]), role: 'Design & produto', status: 'online' as const },
  { profileId: 'caio', displayName: 'Caio', avatar: seedAvatar(communityAvatars[1]), role: 'Desenvolvimento', status: 'online' as const },
  { profileId: 'nina', displayName: 'Nina', avatar: seedAvatar(communityAvatars[2]), role: 'Exploradora', status: 'online' as const },
].map((person) => ({ ...person, id: `presence-${room.id}-${person.profileId}` }))]))
