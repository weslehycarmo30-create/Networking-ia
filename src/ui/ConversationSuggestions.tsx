import { useRef, useState } from 'react'

type ConversationSuggestionsProps = {
  suggestions: [string, string]
  draft: string
  onApply: (suggestion: string, mode: 'replace' | 'append') => boolean
}

export default function ConversationSuggestions({ suggestions, draft, onApply }: ConversationSuggestionsProps) {
  const [pendingSuggestion, setPendingSuggestion] = useState('')
  const [status, setStatus] = useState('')
  const suggestionTrigger = useRef<HTMLButtonElement | null>(null)
  const separator = draft && !/\s$/.test(draft) ? ' ' : ''
  const canAppend = `${draft}${separator}${pendingSuggestion}`.length <= 300

  function chooseSuggestion(suggestion: string, trigger: HTMLButtonElement) {
    suggestionTrigger.current = trigger
    if (draft.length === 0) {
      if (onApply(suggestion, 'replace')) {
        setPendingSuggestion('')
        setStatus('Sugestão copiada para o rascunho. Nada foi enviado.')
      }
      return
    }

    setPendingSuggestion(suggestion)
    setStatus('Seu rascunho foi preservado. Escolha como usar a sugestão.')
  }

  function applySuggestion(mode: 'replace' | 'append') {
    if (!pendingSuggestion || !onApply(pendingSuggestion, mode)) return
    setPendingSuggestion('')
    setStatus(mode === 'replace'
      ? 'Rascunho substituído pela sugestão. Nada foi enviado.'
      : 'Sugestão acrescentada ao rascunho. Nada foi enviado.')
  }

  function cancelChoice() {
    setPendingSuggestion('')
    setStatus('Rascunho mantido sem alterações.')
    window.requestAnimationFrame(() => suggestionTrigger.current?.focus({ preventScroll: true }))
  }

  return <section className="conversation-suggestions" aria-labelledby="conversation-suggestions-title">
    <div className="conversation-suggestions-heading">
      <h3 id="conversation-suggestions-title">Sugestões para começar</h3>
      <p>Frases estáticas desta demonstração; não são geradas por IA nem enviadas automaticamente.</p>
    </div>
    <div className="conversation-suggestion-list">
      {suggestions.map((suggestion, index) => <button
        type="button"
        className="conversation-suggestion"
        key={suggestion}
        aria-label={`Usar sugestão ${index + 1}: ${suggestion}`}
        onClick={(event) => chooseSuggestion(suggestion, event.currentTarget)}
      >{suggestion}</button>)}
    </div>
    {pendingSuggestion && <div className="conversation-suggestion-choice" role="group" aria-labelledby="conversation-suggestion-choice-title">
      <div>
        <h4 id="conversation-suggestion-choice-title">Como usar esta sugestão?</h4>
        <p><q>{pendingSuggestion}</q></p>
        <p>Seu rascunho atual continua preservado até você escolher uma opção.</p>
      </div>
      <div className="conversation-suggestion-actions">
        <button type="button" onClick={() => applySuggestion('append')} disabled={!canAppend}>Adicionar ao rascunho</button>
        <button type="button" onClick={() => applySuggestion('replace')}>Substituir rascunho</button>
        <button type="button" onClick={cancelChoice}>Manter rascunho</button>
      </div>
      {!canAppend && <small className="conversation-suggestion-limit">A sugestão não cabe no limite de 300 caracteres; você ainda pode substituir o rascunho.</small>}
    </div>}
    <p className="conversation-suggestion-status" role="status" aria-live="polite" aria-atomic="true">{status}</p>
  </section>
}
