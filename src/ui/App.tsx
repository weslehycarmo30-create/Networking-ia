import { Component, lazy, Suspense, useEffect, useState, type CSSProperties, type ErrorInfo, type FormEvent, type ReactNode } from 'react'
import { demoProfile, guide, initialMessages, territories, type Territory } from '../data/territories'
import { navigateToTerritory, selectedTerritory, type NavigationState } from '../navigation/routes'

const City3D = lazy(() => import('../scenes/City3D'))
type Message = { id: string; author: string; avatar: string; time: string; text: string }

class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onFailure() }
  render() { return this.state.failed ? null : this.props.children }
}

function hasWebGL() {
  try { const canvas = document.createElement('canvas'); return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl')) } catch { return false }
}

export default function App() {
  const [nav, setNav] = useState<NavigationState>({ screen: 'landing' })
  const [view, setView] = useState<'2d' | '3d'>('2d')
  const [mapSelectedId, setMapSelectedId] = useState(territories[0].id)
  const [webgl, setWebgl] = useState(true)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [requested, setRequested] = useState(false)
  const [toast, setToast] = useState('')
  const active = selectedTerritory(nav.territoryId, territories)
  const mapSelected = selectedTerritory(mapSelectedId, territories)
  const goRoom = (item: Territory) => { setMapSelectedId(item.id); setNav(navigateToTerritory(item)); setRequested(false) }
  const start = () => { setWebgl(hasWebGL()); setNav({ screen: 'city' }) }
  const failScene = () => { setView('2d'); setWebgl(false) }
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2500); return () => window.clearTimeout(timer) }, [toast])

  function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = draft.trim()
    if (!text) return
    setMessages((current) => [...current, { id: crypto.randomUUID(), author: demoProfile.name, avatar: demoProfile.avatar, time: new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' }).format(new Date()), text }])
    setDraft('')
  }

  return <div className="app-shell">
    <header className="topbar"><button className="wordmark" onClick={() => setNav({ screen: nav.screen === 'landing' ? 'landing' : 'city' })} aria-label="OLIMPO, início"><span className="brand-mark">O</span><span>OLIMPO<small>CIDADE DAS IDEIAS</small></span></button>
      {nav.screen !== 'landing' && <nav className="top-nav" aria-label="Navegação principal"><button onClick={() => setNav({ screen: 'city' })} className={nav.screen === 'city' ? 'selected' : ''}>Praça Central</button><button onClick={() => setNav({ screen: 'profile' })} className={nav.screen === 'profile' ? 'selected' : ''}>Meu perfil</button></nav>}
      {nav.screen !== 'landing' && <button className="profile-chip" onClick={() => setNav({ screen: 'profile' })}><span>{demoProfile.avatar}</span><span className="profile-chip-name">{demoProfile.name}</span><i /></button>}
    </header>

    {nav.screen === 'landing' && <main className="landing"><div className="landing-copy"><div className="eyebrow"><span /> UM NOVO LUGAR PARA CONSTRUIR CONEXÕES</div><h1>Ideias grandes<br />precisam de uma<br /><em>boa praça.</em></h1><p>Uma cidade digital para quem cria, aprende e encontra pessoas pelo caminho. Chegue, explore e descubra seu lugar no OLIMPO.</p><button className="primary-button" onClick={start}>Entrar na demonstração <span>↗</span></button><div className="landing-note"><span className="avatar-stack">🌿 🛠️ ✨</span><span>Uma comunidade em construção<br /><b>Explore sem criar uma conta</b></span></div></div><div className="landing-art" aria-label="Ilustração da praça OLIMPO"><div className="sun-ring"/><div className="art-stone art-stone-one"/><div className="art-stone art-stone-two"/><div className="art-plaza"><span>O</span></div><div className="art-column c1"/><div className="art-column c2"/><div className="art-column c3"/><div className="art-column c4"/><div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/><div className="art-caption">PRAÇA CENTRAL <span>·</span> 06 TERRITÓRIOS</div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div></div><div className="landing-footer">UM ESPAÇO PARA O QUE VEM A SEGUIR <span>SCROLL PARA EXPLORAR ↓</span></div></main>}

    {nav.screen === 'city' && <main className="city-page"><section className="city-heading"><div><div className="eyebrow"><span /> VOCÊ ESTÁ NA PRAÇA</div><h1>Praça Central</h1><p>Escolha um território e encontre sua próxima conversa.</p></div><div className="view-switch" role="group" aria-label="Visualização da praça"><button className={view === '2d' ? 'active' : ''} onClick={() => setView('2d')} aria-pressed={view === '2d'}>▦ <span>Mapa 2D</span></button><button className={view === '3d' && webgl ? 'active' : ''} onClick={() => { if (webgl) setView('3d'); else setToast('3D indisponível neste dispositivo. Mapa 2D ativo.') }} aria-pressed={view === '3d'} disabled={!webgl}>◇ <span>Explorar 3D</span></button></div></section>
      {!webgl && <div className="fallback-note" role="status">Seu navegador não disponibiliza WebGL. Você está vendo o mapa 2D.</div>}
      <div className="city-grid"><section className={`city-map ${view === '3d' ? 'city-map-3d' : ''}`} aria-label={view === '3d' ? 'Mapa tridimensional dos territórios' : 'Mapa 2D dos territórios'}>
        {view === '3d' && webgl ? <SceneBoundary onFailure={failScene}><Suspense fallback={<div className="scene-loading">Preparando a praça…</div>}><City3D activeId={mapSelectedId} onSelect={(item) => setMapSelectedId(item.id)} onFailure={failScene} /></Suspense></SceneBoundary> : <div className="map-orbit"><div className="map-center"><span>⚡</span><b>{guide.name}</b><small>Anfitrião da praça</small></div>{territories.map((item, index) => <button key={item.id} className={`map-node node-${index + 1} ${item.id === mapSelectedId ? 'selected' : ''}`} onClick={() => goRoom(item)} aria-label={`Abrir ${item.name}`} aria-current={item.id === mapSelectedId ? 'true' : undefined}><span>{item.symbol}</span><b>{item.name}</b><small>{item.domain}</small></button>)}</div>}
        {view === '3d' && webgl && <button className="map-enter" onClick={() => goRoom(mapSelected)}>Entrar em <b>{mapSelected.name}</b><span>→</span></button>}
        <div className="map-legend"><span className="legend-dot" /> Praça Central <span>·</span> {territories.length} territórios</div>
      </section><aside className="welcome-card"><div className="welcome-top"><div className="zeus-avatar">{guide.avatar}</div><span className="online-pill"><i/> AO VIVO</span></div><div className="eyebrow">ANFITRIÃO DA PRAÇA</div><h2>Bem-vindo ao<br />OLIMPO, {demoProfile.name}.</h2><p>Sou Zeus. Pense em mim como seu guia por aqui. Cada território tem uma conversa diferente esperando por você.</p><div className="welcome-divider"/><div className="welcome-stat"><span>Exploradores na praça</span><b>85 <i>pessoas</i></b></div><button className="text-button" onClick={() => setNav({ screen: 'profile' })}>Conheça seu perfil <span>→</span></button></aside></div>
      <section className="territory-section"><div className="section-title"><div><div className="eyebrow">ESCOLHA SEU CAMINHO</div><h2>Seis lugares. Infinitas possibilidades.</h2></div><span className="section-count">0{territories.length} TERRITÓRIOS</span></div><div className="territory-grid">{territories.map((item, index) => <button className="territory-card" key={item.id} onClick={() => goRoom(item)} style={{ '--territory': item.color } as CSSProperties}><span className="territory-number">0{index + 1}</span><span className="territory-symbol">{item.symbol}</span><span className="territory-domain">{item.domain}</span><b>{item.name}</b><span className="territory-description">{item.description}</span><span className="territory-bottom"><span className="people-avatars">{['🌿', '🛠️', '✨'].map((a) => <i key={a}>{a}</i>)}</span><span>{item.people} por aqui</span><span className="card-arrow">↗</span></span></button>)}</div></section>
    </main>}

    {nav.screen === 'room' && <main className="room-page"><button className="back-link" onClick={() => setNav({ screen: 'city' })}>← Voltar à Praça Central</button><section className="room-heading"><span className="room-icon" style={{ '--territory': active.color } as CSSProperties}>{active.symbol}</span><div><div className="eyebrow">{active.domain} <span>·</span> TERRITÓRIO</div><h1>{active.name}</h1><p>{active.description}</p></div><span className="online-pill"><i/> {active.people} por aqui</span></section><div className="room-layout"><section className="chat-panel"><div className="chat-top"><div><b>Conversa da praça</b><span>Um espaço aberto para todo mundo</span></div><button aria-label="Mais opções">···</button></div><div className="message-list">{messages.map((message) => <article className={`message ${message.author === demoProfile.name ? 'own-message' : ''}`} key={message.id}><span className="message-avatar">{message.avatar}</span><div className="message-body"><div><b>{message.author}</b><time>{message.time}</time></div><p>{message.text}</p></div></article>)}<div className="room-prompt"><span>✦</span>{active.prompt}</div></div><form className="chat-compose" onSubmit={sendMessage}><label className="sr-only" htmlFor="message">Escreva uma mensagem</label><input id="message" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Escreva uma mensagem…" maxLength={300}/><span className="local-only">DEMO LOCAL</span><button className="send-button" aria-label="Enviar mensagem" disabled={!draft.trim()}>↑</button></form></section><aside className="room-sidebar"><div className="sidebar-card"><div className="sidebar-title">Por aqui agora <span>{active.people + 1}</span></div>{[{ name: 'Lia', avatar: '🌿', role: 'Design & produto' }, { name: 'Caio', avatar: '🛠️', role: 'Desenvolvimento' }, { name: 'Nina', avatar: '🌙', role: 'Exploradora' }, { name: 'Você', avatar: demoProfile.avatar, role: 'Chegou agora' }].map((person) => <div className="person-row" key={person.name}><span className="person-avatar">{person.avatar}<i/></span><span><b>{person.name}</b><small>{person.role}</small></span></div>)}</div><div className="sidebar-card room-about"><div className="sidebar-title">Sobre este lugar</div><p>{active.description}</p><span className="demo-badge">✦ Experiência demonstrativa</span></div></aside></div></main>}

    {nav.screen === 'profile' && <main className="profile-page"><button className="back-link" onClick={() => setNav({ screen: 'city' })}>← Voltar à Praça Central</button><div className="profile-card"><div className="profile-cover"><span>✦</span><span>OLIMPO · EXPLORADOR</span></div><div className="profile-details"><div className="profile-avatar-large">{demoProfile.avatar}</div><div className="eyebrow">PERFIL DEMONSTRATIVO</div><h1>{demoProfile.name}</h1><span className="handle">{demoProfile.handle}</span><p>{demoProfile.note}</p><button className={`primary-button connect-button ${requested ? 'requested' : ''}`} onClick={() => { setRequested(true); setToast('Pedido demonstrativo registrado apenas nesta tela.') }} disabled={requested}>{requested ? '✓ Pedido demonstrativo enviado' : '＋ Pedir conexão'}</button><small className="local-caption">Apenas uma demonstração. Nenhum pedido é enviado.</small><div className="profile-interests"><span>INTERESSES</span><div><i>Inteligência artificial</i><i>Produtos digitais</i><i>Novas conexões</i></div></div></div></div></main>}
    {toast && <div className="toast" role="status">{toast}</div>}
    <footer className="site-footer"><span>OLIMPO <i>·</i> UMA CIDADE EM CONSTRUÇÃO</span><span>FEITO PARA IDEIAS, TRABALHO E CONEXÕES</span></footer>
  </div>
}
