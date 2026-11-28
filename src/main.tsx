import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './ui/App'
import AppErrorBoundary from './ui/AppErrorBoundary'
import './ui/styles.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>,
)
