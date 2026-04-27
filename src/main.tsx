import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app/App'
import './styles/tailwind.css' // Importa los estilos de Figma
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)