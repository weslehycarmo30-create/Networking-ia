import type { CommunityEvent } from '../domain/models'

export const demoEvents: CommunityEvent[] = [
  {
    id: 'event-ia-prototipos',
    title: 'Prototipando com IA',
    description: 'Uma conversa prática sobre ideias, ferramentas e aprendizados ao criar protótipos com IA.',
    startsAt: '2026-11-12T19:00:00-03:00',
    territoryId: 'athena',
    organizerProfileId: 'nina',
    participantCount: 8,
  },
  {
    id: 'event-saas-construindo',
    title: 'SaaS em construção',
    description: 'Compartilhe decisões de produto e pequenos avanços de projetos demonstrativos.',
    startsAt: '2026-11-15T18:30:00-03:00',
    territoryId: 'hephaestus',
    organizerProfileId: 'caio',
    participantCount: 12,
  },
  {
    id: 'event-comunidades-criativas',
    title: 'Comunidades que aproximam',
    description: 'Troca de ideias sobre acolhimento, colaboração e descoberta de pessoas.',
    startsAt: '2026-11-19T20:00:00-03:00',
    territoryId: 'hermes',
    organizerProfileId: 'lia',
    participantCount: 6,
  },
  {
    id: 'event-perguntas-abertas',
    title: 'Perguntas abertas, ideias melhores',
    description: 'Um encontro leve para trazer dúvidas e pensar em soluções em conjunto.',
    startsAt: '2026-11-22T16:00:00-03:00',
    territoryId: 'delphi',
    organizerProfileId: 'nina',
    participantCount: 5,
  },
]
