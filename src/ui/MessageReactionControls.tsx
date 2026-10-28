import type { Message, MessageReactionEmoji } from '../domain/models'

type MessageReactionControlsProps = {
  message: Message
  onToggle: (messageId: Message['id'], emoji: MessageReactionEmoji) => void
}

const options: { emoji: MessageReactionEmoji; label: string }[] = [
  { emoji: '👍', label: 'Gostei' },
  { emoji: '💡', label: 'Ideia' },
  { emoji: '❤️', label: 'Adorei' },
]

export default function MessageReactionControls({ message, onToggle }: MessageReactionControlsProps) {
  const selected = message.reactions[0]?.emoji
  const selectedLabel = options.find((option) => option.emoji === selected)?.label

  return <div className="message-reactions" role="group" aria-label={`Reações locais à mensagem de ${message.authorName}`}>
    {options.map((option) => {
      const isSelected = selected === option.emoji
      const action = isSelected ? 'Remover sua reação' : selected ? 'Trocar sua reação para' : 'Reagir com'
      return <button
        type="button"
        className={`message-reaction ${isSelected ? 'selected' : ''}`}
        key={option.emoji}
        aria-pressed={isSelected}
        aria-label={`${action} ${option.label}, na mensagem de ${message.authorName}`}
        onClick={() => onToggle(message.id, option.emoji)}
      ><span aria-hidden="true">{option.emoji}</span><span>{option.label}</span>{isSelected && <span className="message-reaction-count" aria-label="1 reação, sua">1</span>}</button>
    })}
    <span className="message-reaction-context">{selectedLabel ? `Sua reação: ${selectedLabel}.` : 'Nenhuma reação sua.'} Reações desta demonstração local.</span>
  </div>
}
