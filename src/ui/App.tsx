import { Component, lazy, Suspense, useEffect, useState, type CSSProperties, type ErrorInfo, type FormEvent, type ReactNode } from 'react'
import { guide } from '../data/territories'
import { demoAvatars } from '../data/demo'
import { findConnectionBetween } from '../domain/rules'
import type { Connection, Profile, TerritoryRoom } from '../domain/models'
import { createDemoServices } from '../services/demo'
import { navigateToTerritory, type NavigationState } from '../navigation/routes'
import ProfilePicker from './ProfilePicker'
import MemberDiscovery from './MemberDiscovery'

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
  const [mapSelectedId, setMapSelectedId] = useState('athena')
  const [webgl, setWebgl] = useState(true)
  const [draft, setDraft] = useState('')
  const [toast, setToast] = useState('')

  const rooms = services.rooms.listRooms()
  const active = services.rooms.getRoom(nav.territoryId ?? '') ?? rooms[0]
  const mapSelected = services.rooms.getRoom(mapSelectedId) ?? rooms[0]
  const profile = services.profile.getCurrent()
  const communityProfiles = services.profile.listCommunity()
  const viewedProfile = nav.profileId ? services.profile.getProfile(nav.profileId) ?? profile : profile
  const isOwnProfile = viewedProfile.id === profile.id
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

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 4000); return () => window.clearTimeout(timer) }, [toast])

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    try { services.messages.sendToRoom(active.id, draft); setDraft(''); refreshServices() }
    catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível enviar a mensagem.') }
  }

  function chooseAvatar(avatarId: string) {
    try { services.profile.updateAvatar(avatarId); refreshServices(); setToast('Avatar atualizado no seu perfil demonstrativo.') }
    catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível atualizar o avatar.') }
  }

  function requestConnection(toProfileId: string) {
    try { services.connections.requestConnection(toProfileId); refreshServices(); setToast('Convite enviado. Ele aparece como pendente no seu networking.') }
    catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível enviar o convite.') }
  }

  function respondToInvite(inviteId: string, recipientId: string, decision: 'accepted' | 'declined') {
    try {
      services.connections.respondToInvite(inviteId, recipientId, decision)
      refreshServices()
      setToast(decision === 'accepted' ? 'Convite aceito. Agora vocês são conexões.' : 'Convite recusado. O estado foi atualizado na demonstração.')
    } catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível responder ao convite.') }
  }

  function cancelInvite(inviteId: string, senderId: string) {
    try { services.connections.cancelInvite(inviteId, senderId); refreshServices(); setToast('Convite pendente cancelado.') }
    catch (error) { setToast(error instanceof Error ? error.message : 'Não foi possível cancelar o convite.') }
  }

  function resetDemonstration() {
    if (!window.confirm('Reiniciar a demonstração OLIMPO? Isso apaga somente o estado fictício salvo por OLIMPO neste navegador e restaura os dados iniciais.')) return
    const status = services.demoState.reset()
    setDraft('')
    setNav({ screen: 'city' })
    refreshServices()
    setToast(status.persistent ? 'Demonstração reiniciada com os dados fictícios iniciais.' : 'Demonstração reiniciada nesta sessão; o armazenamento do navegador está indisponível.')
  }

  function connectionPerson(connection: Connection, ownerId: string): Profile | undefined {
    const otherId = connection.fromProfileId === ownerId ? connection.toProfileId : connection.fromProfileId
    return services.profile.getProfile(otherId)
  }

  return <div className="app-shell">
    <header className="topbar">
      <button className="wordmark" onClick={goCity} aria-label="OLIMPO, início"><span className="brand-mark">O</span><span>OLIMPO<small>CIDADE DAS IDEIAS</small></span></button>
      {nav.screen !== 'landing' && nav.screen !== 'avatar' && <nav className="top-nav" aria-label="Navegação principal"><button onClick={goCity} className={nav.screen === 'city' ? 'selected' : ''}>Praça Central</button><button onClick={() => openProfile(profile.id)} className={nav.screen === 'profile' && isOwnProfile ? 'selected' : ''}>Meu perfil</button></nav>}
      {nav.screen !== 'landing' && nav.screen !== 'avatar' && <button className="profile-chip" onClick={() => openProfile(profile.id)}><span>{avatar}</span><span className="profile-chip-name">{profile.displayName}</span><i /></button>}
    </header>
    <div className={`demo-storage-status ${persistenceStatus.persistent ? '' : 'memory-only'}`} role={persistenceStatus.message ? 'status' : undefined} aria-live={persistenceStatus.message ? 'polite' : undefined}>
      <span>{persistenceStatus.persistent ? 'DEMONSTRAÇÃO LOCAL · alterações ficam neste navegador.' : 'DEMONSTRAÇÃO LOCAL · alterações ficam apenas nesta sessão.'}</span>
      {persistenceStatus.message && <small>{persistenceStatus.message}</small>}
    </div>

    {nav.screen === 'landing' && <main className="landing"><div className="landing-copy"><div className="eyebrow"><span /> UM NOVO LUGAR PARA CONSTRUIR CONEXÕES</div><h1>Ideias grandes<br />precisam de uma<br /><em>boa praça.</em></h1><p>Uma cidade digital para quem cria, aprende e encontra pessoas pelo caminho. Chegue, explore e descubra seu lugar no OLIMPO.</p><button className="primary-button" onClick={() => setNav({ screen: 'avatar' })}>Entrar na demonstração <span>↗</span></button><div className="landing-note"><span className="avatar-stack">🌿 🛠️ ✨</span><span>Uma comunidade em construção<br /><b>Explore sem criar uma conta</b></span></div></div><div className="landing-art" aria-label="Ilustração da praça OLIMPO"><div className="sun-ring"/><div className="art-stone art-stone-one"/><div className="art-stone art-stone-two"/><div className="art-plaza"><span>O</span></div><div className="art-column c1"/><div className="art-column c2"/><div className="art-column c3"/><div className="art-column c4"/><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-caption">PRAÇA CENTRAL <span>·</span> 06 TERRITÓRIOS</div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div></div><div className="landing-footer">UM ESPAÇO PARA O QUE VEM A SEGUIR <span>SCROLL PARA EXPLORAR ↓</span></div></main>}

    {nav.screen === 'avatar' && <main className="avatar-page"><div className="avatar-step"><div className="eyebrow"><span /> ANTES DE EXPLORAR</div><h1>Escolha seu avatar</h1><p>Use um personagem ilustrativo para aparecer nas conversas. Você pode trocar quando quiser.</p><div className="avatar-options" role="group" aria-label="Avatares demonstrativos">{demoAvatars.map((option) => <button key={option.id} className={`avatar-option ${profile.avatar.id === option.id ? 'selected' : ''}`} aria-pressed={profile.avatar.id === option.id} onClick={() => chooseAvatar(option.id)}><span>{option.emoji}</span><b>{option.label}</b></button>)}</div><div className="avatar-actions"><button className="text-button" onClick={enterCity}>Continuar sem conta <span>→</span></button><span>Nenhum dado pessoal é necessário.</span></div></div></main>}

    {nav.screen === 'city' && <main className="city-page">
      <section className="city-heading"><div><div className="eyebrow"><span /> VOCÊ ESTÁ NA PRAÇA</div><h1>Praça Central</h1><p>Escolha um território e encontre sua próxima conversa.</p></div><button className="discovery-link" onClick={goDiscovery}><span aria-hidden="true">☿</span> Descobrir membros · Ágora de Hermes</button><div className="view-switch" role="group" aria-label="Visualização da praça"><button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')} aria-pressed={view === '2d'}>▦ <span>Mapa 2D</span></button><button className={view === '3d' && webgl ? 'active' : ''} onClick={() => { if (webgl) setView('3d'); else setToast('3D indisponível neste dispositivo. Mapa 2D ativo.') }} aria-pressed={view === '3d'} disabled={!webgl}>◇ <span>Explorar 3D</span></button></div></section>
      {!webgl && <div className="fallback-note" role="status">Seu navegador não disponibiliza WebGL. Você está vendo o mapa 2D.</div>}
      <div className="city-grid"><section className={`city-map ${view === '3d' ? 'city-map-3d' : ''}`} aria-label={view === '3d' ? 'Mapa tridimensional dos territórios' : 'Mapa 2D dos territórios'}>
        {view === '3d' && webgl ? <SceneBoundary onFailure={failScene}><Suspense fallback={<div className="scene-loading">Preparando a praça…</div>}><City3D rooms={rooms} profiles={communityProfiles} selectedProfileId={selectedProfileId} activeId={mapSelected.id} onSelect={(room) => setMapSelectedId(room.id)} onSelectProfile={(person) => openProfile(person.id)} onFailure={failScene} /></Suspense></SceneBoundary> : <div className="map-orbit"><div className="map-center"><span>{guide.avatar.emoji}</span><b>{guide.displayName}</b><small>Anfitrião da praça</small></div>{rooms.map((room, index) => <button key={room.id} className={`map-node node-${index + 1} ${room.id === mapSelected.id ? 'selected' : ''}`} onClick={() => setMapSelectedId(room.id)} aria-label={`Selecionar ${room.name}`} aria-pressed={room.id === mapSelected.id}><span>{room.symbol}</span><b>{room.name}</b><small>{room.domain}</small><small>{services.participants.listByRoom(room.id).length} por aqui</small></button>)}</div>}
        {view === '3d' && webgl && <><div className="scene-territories" role="group" aria-label="Selecionar território no mapa 3D">{rooms.map((room) => <button key={room.id} className={room.id === mapSelected.id ? 'selected' : ''} aria-pressed={room.id === mapSelected.id} onClick={() => setMapSelectedId(room.id)}>{room.symbol} <span>{room.name} · {services.participants.listByRoom(room.id).length}</span></button>)}</div><button className="map-enter" onClick={() => goRoom(mapSelected)}>Entrar em <b>{mapSelected.name}</b><span>→</span></button></>}
        <div className="map-legend"><span className="legend-dot" /> Praça Central <span>·</span> {rooms.length} territórios</div>
      </section>
      <aside className="welcome-card"><div className="welcome-top"><div className="zeus-avatar">{guide.avatar.emoji}</div><span className="online-pill"><i/> AO VIVO</span></div><div className="eyebrow">ANFITRIÃO DA PRAÇA</div><h2>Bem-vindo ao<br />OLIMPO, {profile.displayName}.</h2><p>Sou Zeus. Pense em mim como seu guia por aqui. Cada território tem uma conversa diferente esperando por você.</p><div className="welcome-divider"/><div className="welcome-stat"><span>Exploradores na praça</span><b>85 <i>pessoas</i></b></div><button className="text-button" onClick={() => openProfile(profile.id)}>Conheça seu perfil <span>→</span></button>{view === '2d' && <div className="plaza-community"><div className="sidebar-title">Conheça a comunidade</div><ProfilePicker profiles={communityProfiles} selectedId={selectedProfileId} onSelect={(person) => openProfile(person.id)} label="Abrir perfil de um participante" /></div>}</aside></div>
      <section className="territory-section"><div className="section-title"><div><div className="eyebrow">ESCOLHA SEU CAMINHO</div><h2>Seis lugares. Infinitas possibilidades.</h2></div><span className="section-count">0{rooms.length} TERRITÓRIOS</span></div><div className="territory-grid">{rooms.map((room, index) => <button className="territory-card" key={room.id} onClick={() => goRoom(room)} style={{ '--territory': room.color } as CSSProperties}><span className="territory-number">0{index + 1}</span><span className="territory-symbol">{room.symbol}</span><span className="territory-domain">{room.domain}</span><b>{room.name}</b><span className="territory-description">{room.description}</span><span className="territory-bottom"><span className="people-avatars">{['🌿', '🛠️', '✨'].map((item) => <i key={item}>{item}</i>)}</span><span>{services.participants.listByRoom(room.id).length} por aqui</span><span className="card-arrow">↗</span></span></button>)}</div></section>
    </main>}

    {nav.screen === 'discover' && <MemberDiscovery profiles={communityProfiles} currentProfileId={profile.id} connections={allConnections} onBack={goCity} onOpenProfile={openProfile} onRequestConnection={requestConnection} onCancelInvite={(inviteId) => cancelInvite(inviteId, profile.id)} />}

    {nav.screen === 'room' && <main className="room-page"><button className="back-link" onClick={goCity}>← Voltar à Praça Central</button><section className="room-heading"><span className="room-icon" style={{ '--territory': active.color } as CSSProperties}>{active.symbol}</span><div><div className="eyebrow">{active.domain} <span>·</span> TERRITÓRIO</div><h1>{active.name}</h1><p>{active.description}</p></div><span className="online-pill"><i/> {participants.length} por aqui</span></section><div className="room-layout"><section className="chat-panel"><div className="chat-top"><div><b>Conversa da praça</b><span>Um espaço aberto para todo mundo</span></div><span className="chat-room-label">{active.name}</span></div><div className="message-list" aria-live="polite">{messages.map((message) => <article className={`message ${message.authorId === profile.id ? 'own-message' : ''}`} key={message.id}><span className="message-avatar" aria-hidden="true">{message.avatar.emoji}</span><div className="message-body"><div><b>{message.authorName}</b><time dateTime={message.createdAt}>{formatTime(message.createdAt)}</time></div><p>{message.text}</p></div></article>)}<div className="room-prompt"><span>✦</span>{active.prompt}</div></div><form className="chat-compose" onSubmit={sendMessage}><label className="sr-only" htmlFor="message">Escreva uma mensagem</label><input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem…" maxLength={300}/><span className="local-only">DEMO LOCAL</span><button className="send-button" aria-label="Enviar mensagem" disabled={!draft.trim()}>↑</button></form></section><aside className="room-sidebar"><div className="sidebar-card"><div className="sidebar-title">Por aqui agora <span>{participants.length}</span></div>{participants.map((person) => <button type="button" className="person-row participant-button" key={person.id} onClick={() => openProfile(person.profileId)} aria-label={`Abrir perfil de ${person.displayName}`}><span className="person-avatar">{person.avatar.emoji}<i/></span><span><b>{person.displayName}</b><small>{person.role}</small></span><span className="participant-open">Perfil →</span></button>)}</div><div className="sidebar-card room-about"><div className="sidebar-title">Sobre este lugar</div><p>{active.description}</p><span className="demo-badge">✦ Experiência demonstrativa</span></div></aside></div></main>}

    {nav.screen === 'profile' && <main className="profile-page"><button className="back-link" onClick={closeProfile}>← Voltar</button><div className="profile-card"><div className="profile-cover"><span>✦</span><span>OLIMPO · {isOwnProfile ? 'EXPLORADOR' : 'COMUNIDADE'}</span></div><div className="profile-details"><div className="profile-avatar-large" aria-label={`Avatar: ${viewedProfile.avatar.label}`}>{viewedProfile.avatar.emoji}</div><div className="eyebrow">{isOwnProfile ? 'MEU PERFIL DEMONSTRATIVO' : 'PERFIL DA COMUNIDADE'}</div><h1>{viewedProfile.displayName}</h1><span className="handle">{viewedProfile.handle}</span><p>{viewedProfile.bio}</p><div className="profile-interests"><span>ÁREAS DE INTERESSE</span><div>{viewedProfile.interests.map((interest) => <i key={interest}>{interest}</i>)}</div></div><div className="profile-gamification"><b>Nível {viewedProgress?.level ?? 1}</b><span>{viewedProgress?.points ?? 0} pontos</span>{viewedProgress?.badges.map((badge) => <i key={badge}>{badge}</i>)}</div>
        {isOwnProfile && <><div className="profile-avatar-picker"><b>Seu avatar</b><div className="avatar-options compact" role="group" aria-label="Trocar avatar">{demoAvatars.map((option) => <button key={option.id} className={`avatar-option ${profile.avatar.id === option.id ? 'selected' : ''}`} aria-label={option.label} aria-pressed={profile.avatar.id === option.id} onClick={() => chooseAvatar(option.id)}><span>{option.emoji}</span></button>)}</div></div><section className="networking-panel"><h2>Networking demonstrativo</h2><button className="reset-demo-button" onClick={resetDemonstration}>Reiniciar demonstração</button>
          <div className="network-group"><h3>Convites recebidos <span>{incomingInvites.length}</span></h3>{incomingInvites.length === 0 && <p className="network-empty">Nenhum convite pendente.</p>}{incomingInvites.map((invite) => { const person = connectionPerson(invite, profile.id); return person && <article className="network-row" key={invite.id}><button className="network-person" onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle}</small></span></button><div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(invite.id, profile.id, 'accepted')}>Aceitar</button><button className="network-decline" onClick={() => respondToInvite(invite.id, profile.id, 'declined')}>Recusar</button></div></article> })}</div>
          <div className="network-group"><h3>Convites enviados <span>{outgoingInvites.length}</span></h3>{outgoingInvites.length === 0 && <p className="network-empty">Nenhum convite pendente.</p>}{outgoingInvites.map((invite) => { const person = connectionPerson(invite, profile.id); return person && <article className="network-row" key={invite.id}><button className="network-person" onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle} · Aguardando resposta</small></span></button><button className="network-cancel" onClick={() => cancelInvite(invite.id, profile.id)}>Cancelar convite</button></article> })}</div>
          <div className="network-group"><h3>Conexões aceitas <span>{acceptedConnections.length}</span></h3>{acceptedConnections.length === 0 && <p className="network-empty">Suas conexões aceitas aparecem aqui.</p>}{acceptedConnections.map((connection) => { const person = connectionPerson(connection, profile.id); return person && <button className="network-person accepted-person" key={connection.id} onClick={() => openProfile(person.id)}><span>{person.avatar.emoji}</span><span><b>{person.displayName}</b><small>{person.handle} · Conexão aceita</small></span><span className="connection-check">✓ Conectados</span></button> })}</div>
        </section></>}
        {!isOwnProfile && <section className="networking-panel profile-connection-panel"><h2>Estado da conexão</h2><div className="connection-state" role="status" aria-live="polite">{viewedConnection?.status === 'accepted' ? 'Vocês já são conexões.' : incomingOnViewedProfile ? `${viewedProfile.displayName} enviou um convite para você.` : outgoingFromCurrentProfile ? 'Seu convite está pendente de resposta.' : viewedConnection?.status === 'declined' ? 'Um convite anterior foi recusado.' : 'Vocês ainda não estão conectados.'}</div>
          {viewedConnection?.status === 'accepted' && <span className="connection-check">✓ Conectados</span>}
          {incomingOnViewedProfile && <div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(viewedConnection.id, profile.id, 'accepted')}>Aceitar convite</button><button className="network-decline" onClick={() => respondToInvite(viewedConnection.id, profile.id, 'declined')}>Recusar convite</button></div>}
          {outgoingFromCurrentProfile && <><div className="network-actions"><button className="network-cancel" onClick={() => cancelInvite(viewedConnection.id, profile.id)}>Cancelar convite</button></div><div className="recipient-preview"><b>Resposta demonstrativa do destinatário</b><p>Simule como {viewedProfile.displayName} responderia ao convite.</p><div className="network-actions"><button className="network-accept" onClick={() => respondToInvite(viewedConnection.id, viewedProfile.id, 'accepted')}>Aceitar como destinatário</button><button className="network-decline" onClick={() => respondToInvite(viewedConnection.id, viewedProfile.id, 'declined')}>Recusar como destinatário</button></div></div></>}
          {(!viewedConnection || viewedConnection.status === 'declined') && <button className="primary-button connect-button" onClick={() => requestConnection(viewedProfile.id)}>＋ Enviar convite de conexão</button>}
        </section>}
      </div></div></main>}

    {toast && <div className="toast" role="status" aria-live="polite">{toast}</div>}
    <footer className="site-footer"><span>OLIMPO <i>·</i> UMA CIDADE EM CONSTRUÇÃO</span><span>FEITO PARA IDEIAS, TRABALHO E CONEXÕES</span></footer>
  </div>
}
