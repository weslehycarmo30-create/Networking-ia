export type Territory = {
  id: string
  name: string
  domain: string
  symbol: string
  description: string
  people: number
  color: string
  position: [number, number, number]
  prompt: string
}

export const territories: Territory[] = [
  { id: 'athena', name: 'Templo de Atena', domain: 'IA', symbol: '⌘', description: 'Inteligência artificial, ideias e ferramentas para o futuro.', people: 18, color: '#70d8d0', position: [-3.4, 0, -2.2], prompt: 'Qual ideia você quer transformar em realidade com IA?' },
  { id: 'hephaestus', name: 'Forja de Hefesto', domain: 'Dev & SaaS', symbol: '⚒', description: 'Construtores compartilhando código, produtos e aprendizados.', people: 12, color: '#e7a866', position: [0, 0, -3.4], prompt: 'O que você está construindo nesta semana?' },
  { id: 'hermes', name: 'Ágora de Hermes', domain: 'Networking', symbol: '✳', description: 'Encontre pessoas com interesses e jornadas que se conectam.', people: 24, color: '#86b9ff', position: [3.4, 0, -2.2], prompt: 'Apresente-se e conte o que procura na comunidade.' },
  { id: 'delphi', name: 'Oráculo de Delfos', domain: 'Dúvidas', symbol: '◉', description: 'Pergunte sem cerimônia. A comunidade pensa junto.', people: 9, color: '#c4a7ff', position: [-3.4, 0, 2.2], prompt: 'Que pergunta está ocupando a sua cabeça?' },
  { id: 'dionysus', name: 'Jardins de Dionísio', domain: 'Conversa Livre', symbol: '❋', description: 'Uma pausa leve para conversas, descobertas e boas histórias.', people: 15, color: '#f28fa5', position: [0, 0, 3.4], prompt: 'Qual foi uma coisa boa que aconteceu por aí?' },
  { id: 'ares', name: 'Arena de Ares', domain: 'Lazer', symbol: '⚡', description: 'Jogos, desafios e diversão entre uma tarefa e outra.', people: 7, color: '#ff8176', position: [3.4, 0, 2.2], prompt: 'Alguém topa um desafio rápido?' },
]

export const guide = { name: 'Zeus', role: 'Anfitrião da Praça Central', avatar: '⚡' }

export const initialMessages = [
  { id: 'm1', author: 'Lia', avatar: '🌿', time: '10:42', text: 'Oi, pessoal! Cheguei agora. O que estão criando por aqui?' },
  { id: 'm2', author: 'Caio', avatar: '🛠️', time: '10:44', text: 'Bem-vinda! Estou explorando ferramentas de IA para meu produto.' },
  { id: 'm3', author: 'Nina', avatar: '🌙', time: '10:46', text: 'Que legal. Depois compartilha o que encontrar!' },
]

export const demoProfile = { name: 'Alex', handle: '@alex.explora', avatar: '🧭', note: 'Construindo ideias, um passo de cada vez.' }
