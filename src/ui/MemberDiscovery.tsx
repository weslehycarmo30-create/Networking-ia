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
  backLabel: string
  onOpenProfile: (profileId: Profile['id']) => void
  onRequestConnection: (profileId: Profile['id']) => void
  onCancelInvite: (inviteId: Connection['id']) => void
  onRespondToInvite: (inviteId: Connection['id'], decision: 'accepted' | 'declined') => void
}

export default function MemberDiscovery({ profiles, territories, currentProfileId, connections, onBack, backLabel, onOpenProfile, onRequestConnection, onCancelInvite, onRespondToInvite }: Props) {
  const [query, setQuery] = useState('')
  const [interest, setInterest] = useState('')
  const [territoryId, setTerritoryId] = useState<TerritoryId | ''>('')
  const results = searchCommunityMembers(profiles, { query, interest, territoryId })
  const interests = listCommunityInterests(profiles)

  return <main className="discovery-page">
    <button className="back-link" onClick={onBack}>← {backLabel}</button>
    <header className="discovery-heading">
      <div className="discovery-symbol" aria-hidden="true">☿</div>
      <div><div className="eyebrow">ÁGORA DE HERMES · COMUNIDADE</div><h1>Descobrir membros</h1><p>Encontre pessoas fictícias por nome, apresentação ou interesse.</p></div>
    </header>
    <section className="discovery-filters" aria-label="Pesquisar e filtrar membros">
      <div className="discovery-search-field"><label htmlFor="member-search">Pesquisar membros</label><input id="member-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, apresentação ou interesse" /></div>
      <div className="discovery-interest-field"><label htmlFor="member-interest">Filtrar por interesse</label><select id="member-interest" value={interest} onChange={(event) => setInterest(event.target.value)}><option value="">Todos os interesses</option>{interests.map((item) => <option key={item} value={item}>{item}</option>)}</select></div>
      <div className="discovery-territory-field"><label htmlFor="member-territory">Afinidade com território</label><select id="member-territory" aria-describedby="member-territory-hint" value={territoryId} onChange={(event) => setTerritoryId(event.target.value as TerritoryId | '')}><option value="">Todos os territórios</option>{territories.map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}</select><small className="discovery-filter-hint" id="member-territory-hint">Afinidade temática, não presença atual na sala.</small></div>
      <button type="button" className="clear-discovery" onClick={() => { setQuery(''); setInterest(''); setTerritoryId('') }} disabled={!query && !interest && !territoryId}>Limpar filtros</button>
    </section>
    <p className="discovery-result-count" role="status" aria-live="polite">{results.length} {results.length === 1 ? 'membro encontrado' : 'membros encontrados'}</p>
    {results.length === 0 ? <div className="discovery-empty"><span className="empty-state-mark" aria-hidden="true">✧</span><b>{profiles.length === 0 ? 'Ainda não há perfis fictícios disponíveis' : 'Nenhum membro corresponde aos filtros'}</b><p>{profiles.length === 0 ? 'A comunidade demonstrativa está vazia nesta sessão.' : 'A busca e os filtros atuais não encontraram correspondências.'}</p>{profiles.length === 0 ? <button className="text-button" onClick={onBack}>Voltar à Praça Central</button> : <button className="text-button" onClick={() => { setQuery(''); setInterest(''); setTerritoryId('') }}>Limpar pesquisa e filtros</button>}</div> : <div className="member-results">{results.map((member) => {
      const connection = findConnectionBetween(connections, currentProfileId, member.id)
      const isOutgoing = connection?.status === 'pending' && connection.fromProfileId === currentProfileId
      const isIncoming = connection?.status === 'pending' && connection.toProfileId === currentProfileId
      const isConnected = connection?.status === 'accepted'
      const stateClass = isConnected ? 'connected' : isOutgoing ? 'outgoing' : isIncoming ? 'incoming' : connection?.status === 'declined' ? 'declined' : 'none'
      const stateLabel = isConnected ? 'Conectados · convite aceito' : isOutgoing ? 'Convite enviado · aguardando resposta' : isIncoming ? 'Convite recebido · aguardando sua resposta' : connection?.status === 'declined' ? 'Convite anterior recusado · sem conexão' : 'Sem convite · ainda não conectados'
      return <article className="member-result" key={member.id}>
        <div className="member-result-top"><span className="member-result-avatar" aria-hidden="true">{member.avatar.emoji}</span><div className="member-result-identity"><h2>{member.displayName}</h2><span>{member.handle}</span></div></div>
        <p className="member-result-bio">{member.bio}</p>
        <div className="member-tag-group"><span>Interesses</span><ul className="member-result-interests" aria-label={`Interesses de ${member.displayName}`}>{member.interests.map((item) => <li key={item}>{item}</li>)}</ul></div>
        <div className="member-tag-group affinity-group"><span>Afinidades temáticas · não presença</span><ul className="member-result-affinities" aria-label={`Afinidades temáticas, não presença em sala, de ${member.displayName}`}>{member.territoryAffinities.map((id) => { const territory = territories.find((item) => item.id === id); return territory ? <li key={id}>{territory.symbol} {territory.name}</li> : null })}</ul></div>
        <p className={`member-connection-state status-${stateClass}`}>{stateLabel}</p>
        <div className="member-result-actions"><button className="member-profile-button" onClick={() => onOpenProfile(member.id)}>Ver perfil</button>
          {isConnected ? <span className="connection-check">✓ Conectados</span> : isOutgoing && connection ? <button className="network-cancel" onClick={() => onCancelInvite(connection.id)}>Cancelar convite</button> : isIncoming && connection ? <div className="member-invite-actions"><button className="network-accept" onClick={() => onRespondToInvite(connection.id, 'accepted')}>Aceitar convite</button><button className="network-decline" onClick={() => onRespondToInvite(connection.id, 'declined')}>Recusar</button></div> : <button className="connect-button" onClick={() => onRequestConnection(member.id)}>{connection?.status === 'declined' ? 'Enviar novo convite' : 'Enviar convite'}</button>}
        </div>
      </article>
    })}</div>}
    <p className="discovery-demo-note">Perfis e convites são fictícios e usam o mesmo estado local de networking do OLIMPO. Afinidade temática não significa presença temporária em um território.</p>
  </main>
}
