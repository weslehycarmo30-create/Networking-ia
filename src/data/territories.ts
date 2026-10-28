import type { Profile, TerritoryRoom } from '../domain/models'

export type Territory = TerritoryRoom

export const territories: Territory[] = [
  { id: 'athena', name: 'Templo de Atena', domain: 'IA', symbol: '⌘', description: 'Inteligência artificial, ideias e ferramentas para o futuro.', people: 18, color: '#70d8d0', position: [-3.4, 0, -2.2], suggestions: ['Qual tarefa repetitiva você gostaria de automatizar com IA?', 'Como você avalia se uma resposta de IA é confiável?'] },
  { id: 'hephaestus', name: 'Forja de Hefesto', domain: 'Dev & SaaS', symbol: '⚒', description: 'Construtores compartilhando código, produtos e aprendizados.', people: 12, color: '#e7a866', position: [0, 0, -3.4], suggestions: ['Que parte do seu produto você está tentando simplificar?', 'Qual decisão técnica recente vale compartilhar?'] },
  { id: 'hermes', name: 'Ágora de Hermes', domain: 'Networking', symbol: '✳', description: 'Encontre pessoas com interesses e jornadas que se conectam.', people: 24, color: '#86b9ff', position: [3.4, 0, -2.2], suggestions: ['Que tipo de parceria ou troca você procura hoje?', 'Qual habilidade você pode compartilhar com a comunidade?'] },
  { id: 'delphi', name: 'Oráculo de Delfos', domain: 'Dúvidas', symbol: '◉', description: 'Pergunte sem cerimônia. A comunidade pensa junto.', people: 9, color: '#c4a7ff', position: [-3.4, 0, 2.2], suggestions: ['Em que etapa você ficou bloqueado?', 'O que você já tentou e que resultado obteve?'] },
  { id: 'dionysus', name: 'Jardins de Dionísio', domain: 'Conversa Livre', symbol: '❋', description: 'Uma pausa leve para conversas, descobertas e boas histórias.', people: 15, color: '#f28fa5', position: [0, 0, 3.4], suggestions: ['Que filme, música ou livro você recomenda?', 'Qual descoberta recente melhorou sua semana?'] },
  { id: 'ares', name: 'Arena de Ares', domain: 'Lazer', symbol: '⚡', description: 'Jogos, desafios e diversão entre uma tarefa e outra.', people: 7, color: '#ff8176', position: [3.4, 0, 2.2], suggestions: ['Qual jogo você recomenda para uma pausa rápida?', 'Que desafio leve podemos fazer em poucos minutos?'] },
]

export const guide: Profile & { role: string } = {
  id: 'zeus-guide', displayName: 'Zeus', handle: '@zeus.guia', role: 'Anfitrião da Praça Central',
  avatar: { id: 'guide', label: 'Guia', emoji: '⚡' }, bio: 'Anfitrião da praça.', interests: [], territoryAffinities: ['hermes'],
  gamification: { level: 1, points: 0, badges: [] },
}
