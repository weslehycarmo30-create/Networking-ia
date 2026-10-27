import { Component, lazy, Suspense, useEffect, useRef, useState, type CSSProperties, type ErrorInfo, type FormEvent, type ReactNode } from 'react'
import { guide } from '../data/territories'
import { demoAvatars } from '../data/demo'
import { findConnectionBetween } from '../domain/rules'
import type { Connection, Profile, ReportReason, ReportTargetType, TerritoryRoom } from '../domain/models'
import { createDemoServices } from '../services/demo'
import { navigateToTerritory, type NavigationState } from '../navigation/routes'
import ProfilePicker from './ProfilePicker'
import MemberDiscovery from './MemberDiscovery'
import ReportDialog from './ReportDialog'
import CommunityEvents from './CommunityEvents'
import NotificationCenter from './NotificationCenter'

const City3D = lazy(() => import('../scenes/City3D'))

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

function hasWebGL() {
  try { const canvas = document.createElement('canvas'); return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')) } catch { return false }
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
}

export default function App() {
  const [services] = useState(createDemoServices)
  const [, setRevision] = useState(0)
  const [nav, setNav] = useState<NavigationState>({ screen: 'landing' })
  const [profileReturnTo, setProfileReturnTo] = useState<NavigationState>({ screen: 'city' })
  const [selectedProfileId, setSelectedProfileId] = useState('')
  const [view, setView] = useState<'2d' | '3d'>('2d')
  const [showEvents, setShowEvents] = useState(false)
  const [focusEventId, setFocusEventId] = useState('')
  const [mapSelectedId, setMapSelectedId] = useState('athena')
  const [webgl, setWebgl] = useState(true)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState<{ id: number; message: string; tone: 'success' | 'warning' | 'error' } | null>(null)
  const [reportTarget, setReportTarget] = useState<{ targetType: ReportTargetType; targetId: string; itemLabel: string } | null>(null)
  const reportTrigger = useRef<HTMLButtonElement | null>(null)
  const toastDismiss = useRef<HTMLButtonElement | null>(null)
  const toastOrigin = useRef<HTMLElement | null>(null)
  const toastSequence = useRef(0)

  const rooms = services.rooms.listRooms()
  const active = services.rooms.getRoom(nav.territoryId ?? '') ?? rooms[0]
  const mapSelected = services.rooms.getRoom(mapSelectedId) ?? rooms[0]
  const profile = services.profile.getCurrent()
  const communityProfiles = services.profile.listCommunity()
  const viewedProfile = nav.profileId ? services.profile.getProfile(nav.profileId) ?? profile : profile
  const isOwnProfile = viewedProfile.id === profile.id
  const ownProfileIsCurrent = nav.screen === 'profile' && isOwnProfile
  const plazaIsCurrent = nav.screen === 'city' || nav.screen === 'room' || nav.screen === 'discover' || (nav.screen === 'profile' && !isOwnProfile)
  const avatar = profile.avatar.emoji
  const messages = services.messages.listByRoom(active.id)
  const participants = services.participants.listByRoom(active.id)
  const allConnections = services.connections.listConnections()
  const profileConnections = services.connections.listForProfile(profile.id)
  const incomingInvites = profileConnections.filter((connection) => connection.status === 'pending' && connection.toProfileId === profile.id)
  const outgoingInvites = profileConnections.filter((connection) => connection.status === 'pending' && connection.fromProfileId === profile.id)
  const acceptedConnections = profileConnections.filter((connection) => connection.status === 'accepted')
  const viewedConnection = isOwnProfile ? undefined : findConnectionBetween(allConnections, profile.id, viewedProfile.id)
  const incomingOnViewedProfile = viewedConnection?.status === 'pending' && viewedConnection.toProfileId === profile.id
  const outgoingFromCurrentProfile = viewedConnection?.status === 'pending' && viewedConnection.fromProfileId === profile.id
  const viewedProgress = isOwnProfile ? services.gamification.getProgress(profile.id) : viewedProfile.gamification
  const persistenceStatus = services.demoState.getStatus()

  const refreshServices = () => setRevision((revision) => revision + 1)
  const goCity = () => {
    if (nav.screen === 'room') services.participants.leaveRoom(nav.territoryId ?? '')
    else services.participants.clearCurrentPresence()
    setWebgl(hasWebGL())
    setNav({ screen: 'city' })
  }
  const goRoom = (room: TerritoryRoom) => {
    services.participants.joinRoom(room.id)
    setMapSelectedId(room.id)
    setNav(navigateToTerritory(room))
  }
  const goDiscovery = () => {
    services.participants.clearCurrentPresence()
    setNav({ screen: 'discover' })
  }
  const openEvent = (eventId: string) => {
    goCity()
    setShowEvents(true)
    setFocusEventId(eventId)
  }
  const enterCity = () => { setWebgl(hasWebGL()); setNav({ screen: 'city' }) }
  const failScene = () => { setView('2d'); setWebgl(false) }

  function openProfile(profileId: string) {
    setProfileReturnTo(nav.screen === 'profile' ? profileReturnTo : nav)
    setSelectedProfileId(profileId)
    setNav(profileId === profile.id ? { screen: 'profile' } : { screen: 'profile', profileId })
  }

  function closeProfile() {
    setNav(profileReturnTo)
    setSelectedProfileId('')
  }

  function showFeedback(message: string, tone: 'success' | 'warning' | 'error' = 'success') {
    if (!toast) toastOrigin.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setToast({ id: ++toastSequence.current, message, tone })
  }

  function dismissFeedback() {
    const origin = toastOrigin.current
    setToast(null)
    toastOrigin.current = null
    if (origin?.isConnected) window.requestAnimationFrame(() => origin.focus({ preventScroll: true }))
  }

  useEffect(() => {
    if (!toast || toast.tone === 'error') return
    const currentId = toast.id
    const duration = toast.tone === 'warning' ? 9000 : 7000
    const timer = window.setTimeout(() => {
      if (document.activeElement === toastDismiss.current) return
      setToast((current) => current?.id === currentId ? null : current)
    }, duration)
    return () => window.clearTimeout(timer)
  }, [toast])
  useEffect(() => {
    if (!focusEventId || nav.screen !== 'city' || !showEvents) return
    const frame = window.requestAnimationFrame(() => {
      const eventCard = document.getElementById(`community-event-${focusEventId}`)
      if (eventCard) {
        eventCard.focus({ preventScroll: true })
        eventCard.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' })
      }
      setFocusEventId('')
    })
    return () => window.cancelAnimationFrame(frame)
  }, [focusEventId, nav.screen, showEvents])
  useEffect(() => {
    if (!reportTarget && reportTrigger.current) {
      reportTrigger.current.focus()
      reportTrigger.current = null
    }
  }, [reportTarget])

  function openReportDialog(targetType: ReportTargetType, targetId: string, itemLabel: string, trigger: HTMLButtonElement) {
    if (services.reports.hasReport(targetType, targetId)) {
      showFeedback('Este item já foi sinalizado nesta demonstração local.', 'warning')
      return
    }
    reportTrigger.current = trigger
    setReportTarget({ targetType, targetId, itemLabel })
  }

  function submitDemoReport(reason: ReportReason, note: string) {
    if (!reportTarget) return
    try {
      services.reports.submit({ ...reportTarget, reason, note })
      const persistence = services.demoState.getStatus()
      setReportTarget(null)
      refreshServices()
      showFeedback(persistence.persistent
        ? 'Registro demonstrativo salvo somente neste navegador. Não foi enviado nem recebido por moderadores; nenhuma ação real de moderação foi tomada.'
        : 'Registro demonstrativo mantido somente nesta sessão. Não foi enviado nem recebido por moderadores; nenhuma ação real de moderação foi tomada.')
    } catch (error) {
      showFeedback(error instanceof Error ? error.message : 'Não foi possível registrar esta simulação.', 'error')
    }
  }

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    try { services.messages.sendToRoom(active.id, draft); setDraft(''); refreshServices() }
    catch (error) { showFeedback(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.', 'error') }
  }

  function chooseAvatar(avatarId: string) {
    try { services.profile.updateAvatar(avatarId); refreshServices(); showFeedback('Avatar atualizado no seu perfil demonstrativo.') }
    catch (error) { showFeedback(error instanceof Error ? error.message : 'Não foi possível atualizar o avatar.', 'error') }
  }

  function requestConnection(toProfileId: string) {
    try { services.connections.requestConnection(toProfileId); refreshServices(); showFeedback('Convite enviado. Ele aparece como pendente no seu networking.') }
    catch (error) { showFeedback(error instanceof Error ? error.message : 'Não foi possível enviar o convite.', 'error') }
  }

  function respondToInvite(inviteId: string, recipientId: string, decision: 'accepted' | 'declined') {
    try {
      services.connections.respondToInvite(inviteId, recipientId, decision)
      refreshServices()
      showFeedback(decision === 'accepted' ? 'Convite aceito. Agora vocês são conexões.' : 'Convite recusado. O estado foi atualizado na demonstração.')
    } catch (error) { showFeedback(error instanceof Error ? error.message : 'Não foi possível responder ao convite.', 'error') }
  }

  function cancelInvite(inviteId: string, senderId: string) {
    try { services.connections.cancelInvite(inviteId, senderId); refreshServices(); showFeedback('Convite pendente cancelado.') }
    catch (error) { showFeedback(error instanceof Error ? error.message : 'Não foi possível cancelar o convite.', 'error') }
  }

  function resetDemonstration() {
    if (!window.confirm('Reiniciar a demonstração OLIMPO? Isso apaga somente o estado salvo por OLIMPO neste navegador, incluindo os registros de denúncia demonstrativa, e restaura os dados iniciais.')) return
    const status = services.demoState.reset()
    setDraft('')
    setNav({ screen: 'city' })
    refreshServices()
    showFeedback(status.persistent ? 'Demonstração reiniciada com os dados fictícios iniciais.' : 'Demonstração reiniciada nesta sessão; o armazenamento do navegador está indisponível.', status.persistent ? 'success' : 'warning')
  }

  function connectionPerson(connection: Connection, ownerId: string): Profile | undefined {
    const otherId = connection.fromProfileId === ownerId ? connection.toProfileId : connection.fromProfileId
    return services.profile.getProfile(otherId)
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="wordmark" onClick={goCity} aria-label="OLIMPO, início"><span className="brand-mark">O</span><span>OLIMPO<small>CIDADE DAS IDEIAS</small></span></button>
      {nav.screen !== 'landing' && nav.screen !== 'avatar' && <nav className="top-nav" aria-label="Navegação principal"><button type="button" onClick={goCity} className={plazaIsCurrent ? 'selected' : ''} aria-current={plazaIsCurrent ? 'page' : undefined} aria-label="Praça Central"><span className="top-nav-label-full">Praça Central</span><span className="top-nav-label-compact" aria-hidden="true">Praça</span></button><button type="button" onClick={() => openProfile(profile.id)} className={ownProfileIsCurrent ? 'selected' : ''} aria-current={ownProfileIsCurrent ? 'page' : undefined} aria-label="Meu perfil"><span className="top-nav-label-full">Meu perfil</span><span className="top-nav-label-compact" aria-hidden="true">Perfil</span></button></nav>}{nav.screen !== 'landing' && nav.screen !== 'avatar' && <NotificationCenter service={services.notifications} profiles={communityProfiles} events={services.events.listEvents()} getPersistenceStatus={services.demoState.getStatus} onChange={refreshServices} onFeedback={showFeedback} onOpenProfile={openProfile} onOpenEvent={openEvent} />}
      {nav.screen !== 'landing' && nav.screen !== 'avatar' && <button type="button" className={`profile-chip ${ownProfileIsCurrent ? 'selected' : ''}`} onClick={() => openProfile(profile.id)} aria-label={`Abrir meu perfil demonstrativo, ${profile.displayName}`} aria-current={ownProfileIsCurrent ? 'page' : undefined}><span aria-hidden="true">{avatar}</span><span className="profile-chip-name">{profile.displayName}</span><i aria-hidden="true" /></button>}
    </header>
    <div className={`demo-storage-status ${persistenceStatus.persistent ? '' : 'memory-only'}`} role={persistenceStatus.message ? 'status' : undefined} aria-live={persistenceStatus.message ? 'polite' : undefined}>
      <span>{persistenceStatus.persistent ? 'DEMONSTRAÇÃO LOCAL · alterações ficam neste navegador.' : 'DEMONSTRAÇÃO LOCAL · alterações ficam apenas nesta sessão.'}</span>
      {persistenceStatus.message && <small>{persistenceStatus.message}</small>}
    </div>

    {nav.screen === 'landing' && <main className="landing"><div className="landing-copy"><div className="eyebrow"><span /> MITOLOGIA GREGA · ESPARTA FUTURISTA</div><h1>Ideias grandes<br />precisam de uma<br /><em>boa praça.</em></h1><p>Uma ágora digital de mármore, bronze e tecnologia para quem cria, aprende e encontra pessoas. Explore territórios e descubra seu lugar no OLIMPO.</p><button className="primary-button" onClick={() => setNav({ screen: 'avatar' })}>Explorar a demonstração <span>↗</span></button><div className="landing-note"><span className="avatar-stack" aria-hidden="true">🌿 🛠️ ✨</span><span><b>Demonstração local · sem conta</b><br />Personagens e atividade são fictícios.</span></div></div><div className="landing-art" role="img" aria-label="Ilustração da praça OLIMPO com templo de pedra, colunas de bronze e luz energética"><div className="sun-ring"/><div className="art-stone art-stone-one"/><div className="art-stone art-stone-two"/><div className="art-plaza"><span>O</span></div><div className="art-column c1"/><div className="art-column c2"/><div className="art-column c3"/><div className="art-column c4"/><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-caption">PRAÇA CENTRAL <span>·</span> 06 TERRITÓRIOS</div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div></div><div className="landing-footer">EXPERIÊNCIA FICTÍCIA · SEM LOGIN OU CONEXÃO DE PRODUÇÃO <span>2D + 3D · EXPLORAÇÃO LOCAL</span></div></main>}

    {nav.screen === 'avatar' && <main className="avatar-page"><div className="avatar-step"><button className="back-link avatar-back" onClick={() => setNav({ screen: 'landing' })}>← Voltar à apresentação</button><div className="eyebrow"><span /> PERSONAGEM DA DEMONSTRAÇÃO</div><h1>Escolha seu avatar</h1><p>Escolha um personagem fictício para representar você nesta demonstração. Nenhuma conta será criada; você pode trocar o avatar depois.</p><div className="avatar-options" role="group" aria-label="Avatares demonstrativos">{demoAvatars.map((option) => <button key={option.id} className={`avatar-option ${profile.avatar.id === option.id ? 'selected' : ''}`} aria-pressed={profile.avatar.id === option.id} onClick={() => chooseAvatar(option.id)}><span aria-hidden="true">{option.emoji}</span><b>{option.label}</b>{profile.avatar.id === option.id && <small>Selecionado</small>}</button>)}</div><div className="avatar-actions"><button className="primary-button" onClick={enterCity}>Continuar para a Praça Central <span>→</span></button><span>Perfis e conversas são fictícios · experiência local.</span></div></div></main>}

    {nav.screen === 'city' && <main className="city-page">
      <section className="city-heading"><div><div className="eyebrow"><span /> VOCÊ ESTÁ NA PRAÇA</div><h1>Praça Central</h1><p>Escolha um território no mapa ou nos cartões. Os números mostram participantes fictícios.</p></div><div className="city-actions"><button className="discovery-link" onClick={goDiscovery}><span aria-hidden="true">☿</span> Descobrir membros · Ágora de Hermes</button><button className="events-link" aria-expanded={showEvents} aria-controls={showEvents ? 'community-events' : undefined} onClick={() => setShowEvents((value) => !value)}>{showEvents ? 'Ocultar encontros' : 'Encontros da comunidade'}</button></div><div className="view-switch" role="group" aria-label="Visualização da praça"><button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')} aria-pressed={view === '2d'}>▦ <span>Mapa 2D</span></button><button className={view === '3d' && webgl ? 'active' : ''} onClick={() => { if (webgl) setView('3d'); else showFeedback('3D indisponível neste dispositivo. Mapa 2D ativo.', 'warning') }} aria-pressed={view === '3d'} disabled={!webgl}>◇ <span>Explorar 3D · opcional</span></button></div></section>
      {!webgl && <div className="fallback-note" role="status">Seu navegador não disponibiliza WebGL. Você está vendo o mapa 2D.</div>}
      <div className="city-grid"><section className={`city-map ${view === '3d' ? 'city-map-3d' : ''}`} aria-label={view === '3d' ? 'Mapa tridimensional dos territórios' : 'Mapa 2D dos territórios'}>
        {view === '3d' && webgl ? <SceneBoundary onFailure={failScene}><Suspense fallback={<div className="scene-loading">Preparando a praça…</div>}><City3D rooms={rooms} profiles={communityProfiles} selectedProfileId={selectedProfileId} activeId={mapSelected.id} onSelect={(room) => setMapSelectedId(room.id)} onSelectProfile={(person) => openProfile(person.id)} onFailure={failScene} /></Suspense></SceneBoundary> : <div className="map-orbit"><div className="map-center"><span className="sanctuary-symbol" aria-hidden="true">{guide.avatar.emoji}</span><b>Santuário de Zeus</b><small>Marco central da praça</small></div>{rooms.map((room, index) => { const count = services.participants.listByRoom(room.id).length; return <button key={room.id} className={`map-node node-${index + 1} ${room.id === mapSelected.id ? 'selected' : ''}`} onClick={() => setMapSelectedId(room.id)} aria-label={`Selecionar ${room.name}; ${count} participantes fictícios`} aria-pressed={room.id === mapSelected.id}><span>{room.symbol}</span><b>{room.name}</b><small>{room.domain}</small><small>{count} na demo</small></button> })}</div>}
        {view === '3d' && webgl && <div className="scene-territories" role="group" aria-label="Selecionar território no mapa 3D">{rooms.map((room) => { const count = services.participants.listByRoom(room.id).length; return <button key={room.id} className={room.id === mapSelected.id ? 'selected' : ''} aria-pressed={room.id === mapSelected.id} onClick={() => setMapSelectedId(room.id)}>{room.symbol} <span>{room.name} · {count} demo</span></button> })}</div>}
        <button className="map-enter" onClick={() => goRoom(mapSelected)}>Entrar na sala <b>{mapSelected.name}</b><span>→</span></button>
        <div className="map-legend"><span className="legend-dot" /> Praça Central <span>·</span> {rooms.length} territórios</div>
      </section>
      <aside className="welcome-card"><div className="welcome-top"><div className="zeus-avatar">{guide.avatar.emoji}</div><span className="online-pill"><i/> AO VIVO</span></div><div className="eyebrow">ANFITRIÃO DA PRAÇA</div><h2>Bem-vindo ao<br />OLIMPO, {profile.displayName}.</h2><p>Sou Zeus. Pense em mim como seu guia por aqui. Cada território tem uma conversa diferente esperando por você.</p><div className="welcome-divider"/><div className="welcome-stat"><span>Exploradores na praça</span><b>85 <i>pessoas</i></b></div><button className="text-button" onClick={() => openProfile(profile.id)}>Conheça seu perfil <span>→</span></button>{view === '2d' && <div className="plaza-community"><div className="sidebar-title">Conheça a comunidade</div><ProfilePicker profiles={communityProfiles} selectedId={selectedProfileId} onSelect={(person) => openProfile(person.id)} label="Abrir perfil de um participante" /></div>}</aside></div>
      {showEvents && <CommunityEvents service={services.events} territories={rooms} organizers={communityProfiles} currentProfileId={profile.id} getPersistenceStatus={services.demoState.getStatus} onOpenProfile={openProfile} onRegistrationChange={refreshServices} onFeedback={showFeedback} />}<section className="territory-section"><div className="section-title"><div><div className="eyebrow">ESCOLHA SEU CAMINHO</div><h2>Seis lugares. Infinitas possibilidades.</h2></div><span className="section-count">0{rooms.length} TERRITÓRIOS · PRESENÇA DEMONSTRATIVA</span></div><div className="territory-grid">{rooms.map((room, index) => { const people = services.participants.listByRoom(room.id); return <button className="territory-card" key={room.id} onClick={() => goRoom(room)} style={{ '--territory': room.color } as CSSProperties} aria-label={`Entrar em ${room.name}, território de ${room.domain}. ${people.length} participantes fictícios.`}><span className="territory-number">0{index + 1}</span><span className="territory-symbol">{room.symbol}</span><span className="territory-domain">{room.domain}</span><b>{room.name}</b><span className="territory-description">{room.description}</span><span className="territory-bottom"><span className="people-avatars" aria-hidden="true">{people.slice(0, 3).map((person) => <i key={person.id}>{person.avatar.emoji}</i>)}</span><span className="territory-presence">{people.length} na demonstração</span><span className="territory-entry">Entrar <span className="card-arrow" aria-hidden="true">→</span></span></span></button> })}</div></section>
    </main>}

    {nav.screen === 'discover' && <MemberDiscovery profiles={communityProfiles} territories={rooms} currentProfileId={profile.id} connections={allConnections} onBack={goCity} onOpenProfile={openProfile} onRequestConnection={requestConnection} onCancelInvite={(inviteId) => cancelInvite(inviteId, profile.id)} onRespondToInvite={(inviteId, decision) => respondToInvite(inviteId, profile.id, decision)} />}

      {nav.screen === 'room' && <main className="room-page"><button className="back-link room-back" onClick={goCity}><span aria-hidden="true">←</span> Voltar à Praça Central</button><section className="room-heading"><span className="room-icon" aria-hidden="true" style={{ '--territory': active.color } as CSSProperties}>{active.symbol}</span><div><div className="eyebrow">{active.domain} <span>·</span> TERRITÓRIO</div><h1>{active.name}</h1><p>{active.description}</p></div><span className="room-presence" aria-label={`${participants.length} perfis fictícios nesta sala`}><span aria-hidden="true">✦</span> {participants.length} PERFIS FICTÍCIOS</span></section><div className="room-layout"><section className="chat-panel" aria-label={`Conversa demonstrativa de ${active.name}`}><div className="chat-top"><div><b>Sala de conversa</b><span>Mensagens locais, separadas por território.</span></div><span className="chat-room-label">{active.name}<small>{active.domain} · DEMONSTRAÇÃO</small></span></div><div className="message-list" aria-live="polite">{messages.length === 0 && <p className="message-empty"><span className="empty-state-mark" aria-hidden="true">✧</span>Ainda não há mensagens nesta sala. Use o campo abaixo para iniciar a conversa fictícia local.</p>}{messages.map((message) => { const alreadyReported = services.reports.hasReport('message', message.id); return <article className={`message ${message.authorId === profile.id ? 'own-message' : ''}`} key={message.id}><span className="message-avatar" aria-hidden="true">{message.avatar.emoji}</span><div className="message-body"><div><b>{message.authorName}{message.authorId === profile.id && <span className="message-you">VOCÊ</span>}</b><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div><p>{message.text}</p></div><button className="message-report-button" aria-disabled={alreadyReported} onClick={(event) => { if (!alreadyReported) openReportDialog('message', message.id, `mensagem de ${message.authorName}`, event.currentTarget) }} aria-label={alreadyReported ? `Mensagem de ${message.authorName} já sinalizada nesta demonstração` : `Sinalizar mensagem de ${message.authorName}`} >{alreadyReported ? 'Já sinalizada · demo local' : 'Sinalizar · demo local'}</button></article> })}<div className="room-prompt"><span aria-hidden="true">✦</span>{active.prompt}</div></div><form className="chat-compose" onSubmit={sendMessage}><label className="sr-only" htmlFor="message">Escreva uma mensagem nesta demonstração local, até 300 caracteres</label><input id="message" aria-describedby="message-local-note" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem…" maxLength={300}/><span className="local-only" id="message-local-note">DEMO LOCAL · {draft.length}/300</span><button className="send-button" aria-label="Enviar mensagem demonstrativa" disabled={!draft.trim()}>↑</button></form></section><aside className="room-sidebar"><div className="sidebar-card"><div className="sidebar-title">Perfis nesta sala <span>{participants.length} demo</span></div><p className="presence-demo-note">Lista fictícia desta sessão; não indica pessoas conectadas agora.</p>{participants.length === 0 && <p className="participant-empty" role="status"><span className="empty-state-mark" aria-hidden="true">✧</span>Nenhum perfil fictício está listado. Volte à Praça Central para explorar outros territórios.</p>}{participants.map((person) => <button type="button" className="person-row participant-button" key={person.id} onClick={() => openProfile(person.profileId)} aria-label={`Abrir perfil demonstrativo de ${person.displayName}`}><span className="person-avatar" aria-hidden="true">{person.avatar.emoji}<i/></span><span><b>{person.displayName}</b><small>{person.role}</small></span><span className="participant-open">Perfil →</span></button>)}</div><div className="sidebar-card room-about"><div className="sidebar-title">Tema do território</div><p>{active.description}</p><span className="demo-badge">✦ Atividade e perfis fictícios</span></div></aside></div></main>}

    {nav.screen === 'profile' && <main className="profile-page"><button className="back-link" onClick={closeProfile}>← Voltar</button><div className="profile-card"><div className="profile-cover"><span>✦</span><span>OLIMPO · {isOwnProfile ? 'EXPLORADOR' : 'COMUNIDADE'}</span></div><div className="profile-details"><div className="profile-avatar-large" aria-label={`Avatar: ${viewedProfile.avatar.label}`}>{viewedProfile.avatar.emoji}</div><div className="eyebrow">{isOwnProfile ? 'MEU PERFIL DEMONSTRATIVO' : 'PERFIL DA COMUNIDADE'}</div><h1>{viewedProfile.displayName}</h1><span className="handle">{viewedProfile.handle}</span><p>{viewedProfile.bio}</p><p className="profile-demo-context">Perfil fictício de demonstração. Interesses, afinidades e progresso são exemplos locais.</p><div className="profile-interests"><span>INTERESSES</span><div>{viewedProfile.interests.map((interest) => <i key={interest}>{interest}</i>)}</div></div><div className="profile-affinities"><span>AFINIDADES TEMÁTICAS</span><p>Temas de interesse, não presença atual em salas.</p><ul>{viewedProfile.territoryAffinities.map((territoryId) => { const territory = rooms.find((room) => room.id === territoryId); return territory ? <li key={territoryId}><span aria-hidden="true">{territory.symbol}</span> {territory.name}</li> : null })}</ul></div><div className="profile-gamification"><b>Nível {viewedProgress?.level ?? 1}</b><span>{viewedProgress?.points ?? 0} pontos</span>{viewedProgress?.badges.map((badge) => <i key={badge}>{badge}</i>)}</div>
        {isOwnProfile && <><div className="profile-avatar-picker"><b>Seu avatar</b><div className="avatar-options compact" role="group" aria-label="Trocar avatar">{demoAvatars.map((option) => <button key={option.id} className={`avatar-option ${profile.avatar.id === option.id ? 'selected' : ''}`} aria-label={option.label} aria-pressed={profile.avatar.id === option.id} onClick={() => chooseAvatar(option.id)}><span>{option.emoji}</span></button>)}</div></div><section className="networking-panel"><h2>Networking demonstrativo</h2><p className="networking-demo-note">Convites e conexões são simulados com perfis fictícios e ficam somente neste navegador. Não há contato com pessoas reais.</p><button type="button" className="network-empty-action" onClick={goDiscovery}>Descobrir membros na Ágora</button><button className="reset-demo-button" onClick={resetDemonstration}>Reiniciar demonstração</button>
          <div className="network-group"><h3>Convites recebidos <span>{incomingInvites.length}</span></h3>{incomingInvites.length === 0 && <p className="network-empty"><span className="empty-state-mark" aria-hidden="true">✧</span>Nenhum convite recebido. Convites fictícios enviados a este perfil aparecem aqui.</p>}{incomingInvites.map((invite) => { const person = connectionPerson(invite, profile.id); return person && <article className="network-row" key={invite.id}><button className="network-person" onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle}</small></span></button><div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(invite.id, profile.id, 'accepted')}>Aceitar</button><button className="network-decline" onClick={() => respondToInvite(invite.id, profile.id, 'declined')}>Recusar</button></div></article> })}</div>
          <div className="network-group"><h3>Convites enviados <span>{outgoingInvites.length}</span></h3>{outgoingInvites.length === 0 && <p className="network-empty"><span className="empty-state-mark" aria-hidden="true">✧</span>Nenhum convite enviado. Convide um perfil fictício para acompanhar a resposta aqui.</p>}{outgoingInvites.map((invite) => { const person = connectionPerson(invite, profile.id); return person && <article className="network-row" key={invite.id}><button className="network-person" onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle} · Aguardando resposta</small></span></button><button className="network-cancel" onClick={() => cancelInvite(invite.id, profile.id)}>Cancelar convite</button></article> })}</div>
          <div className="network-group"><h3>Conexões aceitas <span>{acceptedConnections.length}</span></h3>{acceptedConnections.length === 0 && <p className="network-empty"><span className="empty-state-mark" aria-hidden="true">✧</span>Quando um convite fictício for aceito, a conexão aparecerá aqui.</p>}{acceptedConnections.map((connection) => { const person = connectionPerson(connection, profile.id); return person && <button className="network-person accepted-person" key={connection.id} onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle} · Conexão aceita</small></span><span className="connection-check">✓ Conectados</span></button> })}</div>
        </section></>}
        {!isOwnProfile && <section className="networking-panel profile-connection-panel"><button className="profile-report-button" aria-disabled={services.reports.hasReport('profile', viewedProfile.id)} onClick={(event) => { if (!services.reports.hasReport('profile', viewedProfile.id)) openReportDialog('profile', viewedProfile.id, `perfil de ${viewedProfile.displayName}`, event.currentTarget) }}>{services.reports.hasReport('profile', viewedProfile.id) ? 'Perfil já sinalizado nesta demonstração' : 'Sinalizar este perfil'}</button><h2>Estado da conexão</h2><p className="profile-networking-note">Estado local desta demonstração; nenhuma conexão real será criada.</p><div className={`connection-state ${viewedConnection?.status === 'accepted' ? 'connected' : incomingOnViewedProfile ? 'incoming' : outgoingFromCurrentProfile ? 'outgoing' : viewedConnection?.status === 'declined' ? 'declined' : 'none'}`}>{viewedConnection?.status === 'accepted' ? 'Conectados · convite aceito' : incomingOnViewedProfile ? `Convite recebido de ${viewedProfile.displayName} · aguardando sua resposta.` : outgoingFromCurrentProfile ? 'Convite enviado · aguardando resposta.' : viewedConnection?.status === 'declined' ? 'Convite anterior recusado · você pode enviar outro.' : 'Sem convite · ainda não conectados.'}</div>
          {viewedConnection?.status === 'accepted' && <span className="connection-check">✓ Conectados</span>}
          {incomingOnViewedProfile && <div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(viewedConnection.id, profile.id, 'accepted')}>Aceitar convite</button><button className="network-decline" onClick={() => respondToInvite(viewedConnection.id, profile.id, 'declined')}>Recusar convite</button></div>}
          {outgoingFromCurrentProfile && <><div className="network-actions"><button className="network-cancel" onClick={() => cancelInvite(viewedConnection.id, profile.id)}>Cancelar convite</button></div><div className="recipient-preview"><b>Simulação de resposta do perfil fictício</b><p>Escolha uma resposta para demonstrar o fluxo local. Nada é enviado a uma pessoa real.</p><div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(viewedConnection.id, viewedProfile.id, 'accepted')}>Simular aceite</button><button className="network-decline" onClick={() => respondToInvite(viewedConnection.id, viewedProfile.id, 'declined')}>Simular recusa</button></div></div></>}
          {(!viewedConnection || viewedConnection.status === 'declined') && <button className="primary-button connect-button" onClick={() => requestConnection(viewedProfile.id)}>＋ Enviar convite de conexão</button>}
        </section>}
      </div></div></main>}

    {reportTarget && <ReportDialog itemLabel={reportTarget.itemLabel} onCancel={() => setReportTarget(null)} onSubmit={submitDemoReport} />}
    {toast && <div className={`toast toast-${toast.tone}`} role={toast.tone === 'error' ? 'alert' : 'status'} aria-atomic="true"><span className="toast-kind">{toast.tone === 'error' ? 'Erro' : toast.tone === 'warning' ? 'Aviso' : 'Concluído'}</span><span className="toast-message">{toast.message}</span><button ref={toastDismiss} type="button" onBlur={() => { const id = toast.id; window.setTimeout(() => setToast((current) => current?.id === id && current.tone !== 'error' ? null : current), 3000) }} onClick={dismissFeedback} aria-label="Dispensar mensagem">×</button></div>}
    <footer className="site-footer"><span>OLIMPO <i>·</i> UMA CIDADE EM CONSTRUÇÃO</span><span>FEITO PARA IDEIAS, TRABALHO E CONEXÕES</span></footer>
  </div>
}
