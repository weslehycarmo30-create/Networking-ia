import { useState } from 'react'
import type { CommunityEvent, DemoNotification, NotificationPreferences, Profile } from '../domain/models'
import type { NotificationService } from '../services/contracts'
import type { DemoPersistenceStatus } from '../services/demo-storage'

type NotificationCenterProps = {
  service: NotificationService
  profiles: Profile[]
  events: CommunityEvent[]
  getPersistenceStatus: () => DemoPersistenceStatus
  onChange: () => void
  onFeedback: (message: string, tone?: 'success' | 'warning' | 'error') => void
  onOpenProfile: (profileId: Profile['id']) => void
  onOpenEvent: (eventId: CommunityEvent['id']) => void
}

function notificationTitle(notification: DemoNotification) {
  return notification.kind === 'connection_invite' ? 'Convite fictício de conexão' : 'Atualização local de inscrição'
}

export default function NotificationCenter({ service, profiles, events, getPersistenceStatus, onChange, onFeedback, onOpenProfile, onOpenEvent }: NotificationCenterProps) {
  const [open, setOpen] = useState(false)
  const [preferencesOpen, setPreferencesOpen] = useState(false)
  const notifications = service.list()
  const unreadCount = service.unreadCount()
  const preferences = service.getPreferences()

  function setPreference(key: keyof NotificationPreferences, enabled: boolean) {
    try {
      service.setPreference(key, enabled)
      onChange()
      const category = key === 'connectionInvites' ? 'convites de conexão' : 'atividade de encontros'
      const action = enabled ? `Avisos locais de ${category} ativados` : `Opt-out de ${category} aplicado; avisos existentes foram removidos e novos avisos locais serão omitidos`
      onFeedback(getPersistenceStatus().persistent ? `${action} nesta demonstração.` : `${action} apenas nesta sessão, pois o armazenamento local está indisponível.`)
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar esta preferência demonstrativa.', 'error')
    }
  }

  function markRead(notificationId: string) {
    try {
      service.markAsRead(notificationId)
      onChange()
      if (!getPersistenceStatus().persistent) onFeedback('Leitura mantida somente nesta sessão porque o armazenamento local está indisponível.', 'warning')
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar esta notificação demonstrativa.', 'error')
    }
  }

  function markAllRead() {
    try {
      const count = service.markAllAsRead()
      onChange()
      if (count > 0) onFeedback(`${count} notificação${count === 1 ? '' : 'ões'} demonstrativa${count === 1 ? '' : 's'} marcada${count === 1 ? '' : 's'} como lida${count === 1 ? '' : 's'}.`)
    } catch (error) {
      onFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar as notificações demonstrativas.', 'error')
    }
  }

  function openDestination(notification: DemoNotification) {
    markRead(notification.id)
    setOpen(false)
    if (notification.kind === 'connection_invite') onOpenProfile(notification.profileId)
    else onOpenEvent(notification.eventId)
  }

  function describe(notification: DemoNotification) {
    if (notification.kind === 'connection_invite') {
      const profile = profiles.find((item) => item.id === notification.profileId)
      return profile ? `${profile.displayName} enviou um convite de exemplo para o seu perfil.` : 'Há um convite de conexão fictício nesta demonstração.'
    }
    const event = events.find((item) => item.id === notification.eventId)
    const eventTitle = event?.title ?? 'encontro demonstrativo'
    return notification.action === 'registered'
      ? `Sua inscrição local em “${eventTitle}” foi atualizada.`
      : `O cancelamento local da inscrição em “${eventTitle}” foi atualizado.`
  }

  return <div className="notification-center">
    <button type="button" className="notification-trigger" aria-label={`Notificações demonstrativas${unreadCount ? `, ${unreadCount} não lidas` : ''}`} aria-expanded={open} aria-controls={open ? 'notification-panel' : undefined} onClick={() => setOpen((value) => !value)}>
      <span aria-hidden="true">♢</span><span className="notification-trigger-label">Notificações</span>{unreadCount > 0 && <><span className="notification-count" aria-hidden="true">{unreadCount > 99 ? '99+' : unreadCount}</span><span className="sr-only">{unreadCount} notificações não lidas</span></>}
    </button>
    {open && <section className="notification-panel" id="notification-panel" aria-label="Central de notificações demonstrativas">
      <div className="notification-panel-heading"><div><b>Notificações</b><small>{unreadCount} não lidas · {notifications.length} no total</small></div><button type="button" className="notification-close" onClick={() => setOpen(false)} aria-label="Fechar notificações">×</button></div>
      <p className="notification-local-notice">Demonstração local: itens fictícios do estado deste navegador. Nenhum aviso chega de outros usuários ou servidores.</p>
      <button type="button" className="notification-settings-trigger" aria-expanded={preferencesOpen} aria-controls={preferencesOpen ? 'notification-preferences' : undefined} onClick={() => setPreferencesOpen((value) => !value)}>{preferencesOpen ? 'Ocultar preferências locais' : 'Preferências locais'}</button>
      {preferencesOpen && <fieldset className="notification-preferences" id="notification-preferences">
        <legend>Avisos nesta demonstração</legend>
        <p>Desativar uma categoria remove os avisos locais existentes dela e impede novos registros dessa categoria. Isso não altera comunicações reais.</p>
        <label><input type="checkbox" checked={preferences.connectionInvites} onChange={(event) => setPreference('connectionInvites', event.target.checked)} /> Convites fictícios de conexão</label>
        <label><input type="checkbox" checked={preferences.eventActivity} onChange={(event) => setPreference('eventActivity', event.target.checked)} /> Atividade local de encontros</label>
      </fieldset>}
      <button type="button" className="notification-read-all" onClick={markAllRead} disabled={unreadCount === 0}>Marcar todas como lidas</button>
      {notifications.length === 0 ? <div className="notification-empty"><div role="status"><span className="empty-state-mark" aria-hidden="true">✧</span><b>Nenhuma notificação demonstrativa</b><p>Nenhum aviso local foi gerado ainda. Um convite fictício ou uma inscrição em encontro pode criar avisos de exemplo aqui.</p></div>{events[0] && <button type="button" className="notification-destination" onClick={() => onOpenEvent(events[0].id)}>Explorar encontros demonstrativos</button>}</div> : <ul className="notification-list">
        {notifications.map((notification) => {
          const relatedEvent = notification.kind === 'event_registration' ? events.find((event) => event.id === notification.eventId) : undefined
          const relatedProfile = notification.kind === 'connection_invite' ? profiles.find((profile) => profile.id === notification.profileId) : undefined
          const hasDestination = notification.kind === 'connection_invite' ? Boolean(relatedProfile) : Boolean(relatedEvent)
          return <li className={`notification-item ${notification.readAt ? 'read' : 'unread'}`} key={notification.id}>
            <div className="notification-item-heading"><b>{notificationTitle(notification)}</b><span className="notification-state">{notification.readAt ? 'Lida' : 'Não lida'}</span></div>
            <p>{describe(notification)}</p>
            {hasDestination && <button type="button" className="notification-destination" onClick={() => openDestination(notification)}>{notification.kind === 'connection_invite' ? `Abrir perfil de ${relatedProfile?.displayName}` : `Abrir encontro: ${relatedEvent?.title}`}</button>}
            {!notification.readAt && <button type="button" className="notification-mark-read" onClick={() => markRead(notification.id)}>Marcar como lida</button>}
          </li>
        })}
      </ul>}
    </section>}
  </div>
}
