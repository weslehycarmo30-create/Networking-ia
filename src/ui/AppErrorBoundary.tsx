import { Component, type ReactNode } from 'react'
import { DEMO_STORAGE_KEY } from '../services/demo-storage'

// Last line of defense: without it, a render error anywhere leaves a blank page. It never changes
// stored data; it only offers to reload or to download what is saved in this browser.
export default class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; notice: string }> {
  state = { failed: false, notice: '' }

  static getDerivedStateFromError() { return { failed: true } }

  downloadSaved = () => {
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY)
      if (saved === null) { this.setState({ notice: 'Não há dados salvos neste navegador.' }); return }
      const url = URL.createObjectURL(new Blob([saved], { type: 'application/json;charset=utf-8' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `olimpo-dados-${new Date().toISOString().slice(0, 10)}.json`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 0)
      this.setState({ notice: 'Dados salvos baixados para este dispositivo.' })
    } catch {
      this.setState({ notice: 'Não foi possível ler os dados salvos neste navegador.' })
    }
  }

  focusHeading = (heading: HTMLHeadingElement | null) => { heading?.focus() }

  render() {
    if (!this.state.failed) return this.props.children
    return <main className="app-error">
      <h1 tabIndex={-1} ref={this.focusHeading}>Algo deu errado nesta tela</h1>
      <p>A demonstração encontrou um erro. Esta tela não apaga os dados salvos neste navegador.</p>
      <div className="app-error-actions">
        <button type="button" onClick={() => window.location.reload()}>Recarregar a demonstração</button>
        <button type="button" onClick={this.downloadSaved}>Baixar dados salvos</button>
      </div>
      <p role="status">{this.state.notice}</p>
    </main>
  }
}
