import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ThemeProvider } from './contexts/ThemeContext'
import './index.css'
import App from './App'

// set initial theme attribute before first paint to avoid flash
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('theme') === 'light' ? 'light' : 'dark',
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
