import type { CommunityEvent } from '../domain/models'

// Demo events are fictitious, so their dates are relative to when the demo is opened: a fixed
// calendar would silently turn into a list of past events.
function daysAhead(now: Date, days: number, hours: number, minutes: number): string {
  const date = new Date(now)
  date.setDate(date.getDate() + days)
  date.setHours(hours, minutes, 0, 0)
  return date.toISOString()
}

export function buildDemoEvents(now: Date = new Date()): CommunityEvent[] {
  return [
    {
      id: 'event-ia-prototipos',
      title: 'Prototipando com IA',
      description: 'Uma conversa prática sobre ideias, ferramentas e aprendizados ao criar protótipos com IA.',
      startsAt: daysAhead(now, 2, 19, 0),
      territoryId: 'athena',
      organizerProfileId: 'nina',
      participantCount: 8,
    },
    {
      id: 'event-saas-construindo',
      title: 'SaaS em construção',
      description: 'Compartilhe decisões de produto e pequenos avanços de projetos demonstrativos.',
      startsAt: daysAhead(now, 5, 18, 30),
      territoryId: 'hephaestus',
      organizerProfileId: 'caio',
      participantCount: 12,
    },
    {
      id: 'event-comunidades-criativas',
      title: 'Comunidades que aproximam',
      description: 'Troca de ideias sobre acolhimento, colaboração e descoberta de pessoas.',
      startsAt: daysAhead(now, 9, 20, 0),
      territoryId: 'hermes',
      organizerProfileId: 'lia',
      participantCount: 6,
    },
    {
      id: 'event-perguntas-abertas',
      title: 'Perguntas abertas, ideias melhores',
      description: 'Um encontro leve para trazer dúvidas e pensar em soluções em conjunto.',
      startsAt: daysAhead(now, 12, 16, 0),
      territoryId: 'delphi',
      organizerProfileId: 'nina',
      participantCount: 5,
    },
  ]
}

export const demoEvents: CommunityEvent[] = buildDemoEvents()
