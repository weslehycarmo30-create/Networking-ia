import { useState } from 'react'
import type { Profile, TerritoryId, TerritoryRoom } from '../domain/models'
import type { CommunityEventService } from '../services/contracts'
import type { DemoPersistenceStatus } from '../services/demo-storage'

type CommunityEventsProps = {
  service: CommunityEventService
  territories: TerritoryRoom[]
  organizers: Profile[]
  currentProfileId: Profile['id']
  getPersistenceStatus: () => DemoPersistenceStatus
  onOpenProfile: (profileId: Profile['id']) => void
  onRegistrationChange: () => void
  onFeedback: (message: string, tone?: 'success' | 'warning' | 'error') => void
}

function formatEventDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value))
}

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function CommunityEvents({ service, territories, organizers, currentProfileId, getPersistenceStatus, onOpenProfile, onRegistrationChange, onFeedback }: CommunityEventsProps) {
  const [territoryFilter, setTerritoryFilter] = useState<TerritoryId | ''>('')
  const events = service.listEvents(territoryFilter || undefined)

  function toggleRegistration(eventId: string) {
    try {
      if (service.isRegistered(eventId, currentProfileId)) {
        service.cancelRegistration(eventId, currentProfileId)
        const persistence = getPersistenceStatus()
        onFeedback(persistence.persistent
          ? 'Inscrição demonstrativa cancelada neste navegador. A contagem local foi atualizada.'
          : 'Inscrição demonstrativa cancelada nesta sessão. A contagem local foi atualizada.')
      } else {
        service.register(eventId, currentProfileId)
        const persistence = getPersistenceStatus()
        onFeedback(persistence.persistent
          ? 'Inscrição demonstrativa ativa somente neste navegador; ela não é compartilhada.'
          : 'Inscrição demonstrativa ativa somente nesta sessão; ela não é compartilhada.')
      }
      onRegistrationChange()
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar esta inscrição demonstrativa.', 'error')
    }
  }

  return <section className="community-events" id="community-events" aria-labelledby="community-events-title">
    <div className="section-title events-heading">
      <div><div className="eyebrow">ENCONTROS DA COMUNIDADE</div><h2 id="community-events-title">Ideias para construir juntos.</h2></div>
      <span className="section-count" role="status">{events.length} {events.length === 1 ? 'ENCONTRO LOCAL' : 'ENCONTROS LOCAIS'}</span>
    </div>
    <p className="events-local-notice" role="note">Encontros e inscrições são dados locais desta demonstração; nada é publicado ou compartilhado com outros usuários.</p>
    <div className="events-filter">
      <label htmlFor="event-territory">Filtrar por território</label>
      <select id="event-territory" value={territoryFilter} onChange={(event) => setTerritoryFilter(event.target.value as TerritoryId | '')}>
        <option value="">Todos os territórios</option>
        {territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
      </select>
      {territoryFilter && <button type="button" className="events-clear-filter" onClick={() => setTerritoryFilter('')}>Limpar filtro</button>}
    </div>
    {events.length === 0 ? <div className="events-empty" role="status"><span className="empty-state-mark" aria-hidden="true">✧</span><b>{territoryFilter ? 'Nenhum encontro neste território' : 'Nenhum encontro demonstrativo disponível'}</b><p>{territoryFilter ? 'O filtro atual não encontrou encontros. Limpe o filtro acima para ver outros territórios.' : 'Não há encontros fictícios nesta demonstração no momento.'}</p></div> : <div className="events-grid">
      {events.map((event) => {
        const territory = territories.find((item) => item.id === event.territoryId)
        const organizer = organizers.find((profile) => profile.id === event.organizerProfileId)
        const registered = service.isRegistered(event.id, currentProfileId)
        return <article className="event-card" id={`community-event-${event.id}`} tabIndex={-1} key={event.id}>
          <div className="event-territory">{territory?.symbol} {territory?.name ?? 'Território demonstrativo'}</div>
          <h3>{event.title}</h3>
          <p className="event-description">{event.description}</p>
          <div className="event-date"><time dateTime={event.startsAt}>{formatEventDate(event.startsAt)}</time><b>{formatEventTime(event.startsAt)}</b></div>
          {organizer && <button type="button" className="event-organizer" onClick={() => onOpenProfile(organizer.id)} aria-label={`Abrir perfil de quem organiza: ${organizer.displayName}`}>
            <span className="event-organizer-avatar" aria-hidden="true">{organizer.avatar.emoji}</span><span><small>Organizado por</small><b>{organizer.displayName}</b></span><span className="event-profile-link">Ver perfil →</span>
          </button>}
          <div className="event-card-bottom"><span className="event-count">{event.participantCount} participantes demonstrativos</span>
            <button type="button" className={`event-rsvp ${registered ? 'registered' : ''}`} aria-pressed={registered} onClick={() => toggleRegistration(event.id)}>{registered ? 'Cancelar inscrição' : 'Inscrever-se'}</button>
          </div>
          <p className={`event-rsvp-status ${registered ? 'registered' : 'not-registered'}`}>{registered ? getPersistenceStatus().persistent ? 'Inscrição demonstrativa ativa somente neste navegador; não é compartilhada.' : 'Inscrição demonstrativa ativa somente nesta sessão; não é compartilhada.' : 'Sem inscrição neste encontro demonstrativo.'}</p>
        </article>
      })}
    </div>}
  </section>
}
