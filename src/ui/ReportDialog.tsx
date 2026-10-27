import { useEffect, useRef, useState, type FormEvent } from 'react'
import type { ReportReason } from '../domain/models'

const reasons: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: 'Spam' },
  { value: 'harassment', label: 'Assédio' },
  { value: 'inappropriate', label: 'Conteúdo impróprio' },
  { value: 'scam', label: 'Golpe ou fraude' },
  { value: 'other', label: 'Outro motivo' },
]

export default function ReportDialog({ itemLabel, onCancel, onSubmit }: {
  itemLabel: string
  onCancel: () => void
  onSubmit: (reason: ReportReason, note: string) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [reason, setReason] = useState<ReportReason | ''>('')
  const [note, setNote] = useState('')

  useEffect(() => {
    dialogRef.current?.showModal()
  }, [])

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!reason) return
    onSubmit(reason, note)
  }

  return <dialog ref={dialogRef} className="report-dialog" aria-labelledby="report-dialog-title" onCancel={(event) => { event.preventDefault(); onCancel() }}>
    <form onSubmit={submit}>
      <div className="eyebrow">OLIMPO · DEMONSTRAÇÃO</div>
      <h2 id="report-dialog-title">Sinalizar {itemLabel}</h2>
      <p className="report-item-summary">Escolha o motivo que melhor descreve este conteúdo.</p>
      <label htmlFor="report-reason">Motivo da denúncia</label>
      <select id="report-reason" required autoFocus aria-describedby="report-reason-hint" value={reason} onChange={(event) => setReason(event.target.value as ReportReason | '')}>
        <option value="" disabled>Selecione um motivo</option>
        {reasons.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
      </select>
      <small className="report-reason-hint" id="report-reason-hint">{reason ? 'Motivo selecionado para esta simulação local.' : 'Selecione um motivo para habilitar a simulação local.'}</small>
      <label htmlFor="report-note">Observação opcional <span>até 240 caracteres</span></label>
      <textarea id="report-note" aria-describedby="report-note-hint report-note-count" value={note} maxLength={240} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="Acrescente um contexto breve, sem dados pessoais." />
      <small className="report-note-hint" id="report-note-hint">Campo opcional. Não inclua informações pessoais.</small>
      <div className="report-note-count" id="report-note-count">{note.length}/240 caracteres</div>
      <aside className="report-simulation-notice" role="note"><b>Simulação local:</b> se o armazenamento estiver disponível, o registro ficará somente neste navegador; caso contrário, ficará apenas nesta sessão. Ele <strong>NÃO é enviado nem recebido por moderadores</strong>. Nenhuma ação real de moderação será tomada.</aside>
      <div className="report-dialog-actions"><button type="button" className="report-cancel-button" onClick={onCancel}>Cancelar</button><button type="submit" className="report-confirm-button" disabled={!reason}>Confirmar simulação</button></div>
    </form>
  </dialog>
}
