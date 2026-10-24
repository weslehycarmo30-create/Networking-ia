import { useState } from 'react'
import { searchCommunityMembers, listCommunityInterests } from '../domain/member-discovery'
import { findConnectionBetween } from '../domain/rules'
import type { Connection, Profile, TerritoryId, TerritoryRoom } from '../domain/models'

type Props = {
  profiles: Profile[]
  territories: TerritoryRoom[]
  currentProfileId: Profile['id']
  connections: Connection[]
  onBack: () => void
  onOpenProfile: (profileId: Profile['id']) => void
  onRequestConnection: (profileId: Profile['id']) => void
  onCancelInvite: (inviteId: Connection['id']) => void
}

export default function MemberDiscovery({ profiles, territories, currentProfileId, connections, onBack, onOpenProfile, onRequestConnection, onCancelInvite }: Props) {
  const [query, setQuery] = useState('')
  const [interest, setInterest] = useState('')
  const [territoryId, setTerritoryId] = useState<TerritoryId | ''>('')
  const results = searchCommunityMembers(profiles, { query, interest, territoryId })
  const interests = listCommunityInterests(profiles)

  return <main className="discovery-page">
    <button className="back-link" onClick={onBack}>← Voltar à Praça Central</button>
    <header className="discovery-heading">
      <div className="discovery-symbol" aria-hidden="true">☿</div>
      <div><div className="eyebrow">ÁGORA DE HERMES · COMUNIDADE</div><h1>Descobrir membros</h1><p>Encontre pessoas fictícias por nome, apresentação ou interesse.</p></div>
    </header>
    <section className="discovery-filters" aria-label="Pesquisar e filtrar membros">
      <div className="discovery-search-field"><label htmlFor="member-search">Pesquisar membros</label><input id="member-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, apresentação ou interesse" /></div>
      <div className="discovery-interest-field"><label htmlFor="member-interest">Filtrar por interesse</label><select id="member-interest" value={interest} onChange={(event) => setInterest(event.target.value)}><option value="">Todos os interesses</option>{interests.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="discovery-territory-field"><label htmlFor="member-territory">Afinidade com território</label><select id="member-territory" value={territoryId} onChange={(event) => setTerritoryId(event.target.value as TerritoryId | '')}><option value="">Todos os territórios</option>{territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}</select></div>
      <button type="button" className="clear-discovery" onClick={() => { setQuery(''); setInterest(''); setTerritoryId('') }} disabled={!query && !interest && !territoryId}>Limpar filtros</button>
    </section>
    <p className="discovery-result-count" role="status" aria-live="polite">{results.length} {results.length === 1 ? 'membro encontrado' : 'membros encontrados'}</p>
    {results.length === 0 ? <div className="discovery-empty" role="status"><b>Nenhum membro encontrado</b><p>Tente outro termo ou ajuste os filtros selecionados.</p><button className="text-button" onClick={() => { setQuery(''); setInterest(''); setTerritoryId('') }}>Limpar pesquisa e filtros</button></div> : <div className="member-results">{results.map((member) => {
      const connection = findConnectionBetween(connections, currentProfileId, member.id)
      const isOutgoing = connection?.status === 'pending' && connection.fromProfileId === currentProfileId
      const isIncoming = connection?.status === 'pending' && connection.toProfileId === currentProfileId
      const stateLabel = connection?.status === 'accepted' ? 'Conexão aceita' : isOutgoing ? 'Convite enviado · aguardando resposta' : isIncoming ? 'Este membro enviou um convite' : connection?.status === 'declined' ? 'Convite anterior recusado' : 'Ainda sem conexão'
      return <article className="member-result" key={member.id}>
        <div className="member-result-top"><span className="member-result-avatar" aria-hidden="true">{member.avatar.emoji}</span><div className="member-result-identity"><h2>{member.displayName}</h2><span>{member.handle}</span></div></div>
        <p className="member-result-bio">{member.bio}</p>
        <ul className="member-result-interests" aria-label={`Interesses de ${member.displayName}`}>{member.interests.map((item) => <li key={item}>{item}</li>)}</ul>
        <ul className="member-result-affinities" aria-label={`Afinidades temáticas de ${member.displayName}`}>{member.territoryAffinities.map((id) => { const territory = territories.find((item) => item.id === id); return territory ? <li key={id}>{territory.symbol} {territory.name}</li> : null })}</ul>
        <p className="member-connection-state">{stateLabel}</p>
        <div className="member-result-actions"><button className="member-profile-button" onClick={() => onOpenProfile(member.id)}>Ver perfil</button>
          {connection?.status === 'accepted' ? <span className="connection-check">✓ Conectados</span> : isOutgoing && connection ? <button className="network-cancel" onClick={() => onCancelInvite(connection.id)}>Cancelar convite</button> : isIncoming ? <button className="network-accept" onClick={() => onOpenProfile(member.id)}>Ver convite</button> : <button className="connect-button" onClick={() => onRequestConnection(member.id)}>Enviar convite</button>}
        </div>
      </article>
    })}</div>}
    <p className="discovery-demo-note">Perfis e convites são fictícios e usam o mesmo estado de networking do OLIMPO.</p>
  </main>
}
