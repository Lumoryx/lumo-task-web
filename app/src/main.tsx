import ReactDOM from 'react-dom/client'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import './styles/tokens.css'
import './styles/global.css'
import { applyAccent } from './store/settingsStore'
import App from './App'

// Apply accent color synchronously before first paint (prevents flash)
const savedSettings = localStorage.getItem('lumo:settings')
if (savedSettings) {
  try {
    const { state } = JSON.parse(savedSettings)
    if (state?.accent) applyAccent(state.accent)
  } catch { /* use default */ }
}

// Initialize task store from mock db
import('./store/taskStore').then(({ useTaskStore }) => {
  useTaskStore.getState().fetchTasks()
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
