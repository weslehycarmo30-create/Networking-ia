import type { Profile } from '../domain/models'

export default function ProfilePicker({ profiles, selectedId, onSelect, label = 'Exploradores da comunidade' }: {
  profiles: Profile[]
  selectedId?: Profile['id']
  onSelect: (profile: Profile) => void
  label?: string
}) {
  return <div className="community-profiles" role="group" aria-label={label}>
    {profiles.map((profile) => <button className="community-profile" key={profile.id} aria-current={profile.id === selectedId ? 'true' : undefined} onClick={() => onSelect(profile)}>
      <span className="person-avatar">{profile.avatar.emoji}</span>
      <span className="community-profile-copy"><b>{profile.displayName}</b><small>{profile.handle}</small></span>
      <span className="community-profile-action">Ver perfil →</span>
    </button>)}
  </div>
}
