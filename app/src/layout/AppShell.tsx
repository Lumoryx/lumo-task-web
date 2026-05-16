import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useFocusStore } from '../store/focusStore'
import { useSettingsStore } from '../store/settingsStore'
import { useTranslation } from '../hooks/useTranslation'
import { cn } from '../lib/cn'

interface Props { onQuickAdd: () => void }

const PAGE_META: Record<string, { title: (t: (k: string) => string) => string; sub?: (t: (k: string) => string) => string }> = {
  today: { title: t => t('today.title'), sub: t => t('today.sub') },
  matrix: { title: t => t('matrix.title'), sub: t => t('matrix.sub') },
  focus: { title: t => t('focus.title'), sub: t => t('focus.sub') },
  settings: { title: t => t('settings.account_title') },
}

export function AppShell({ onQuickAdd }: Props) {
  const lang = useSettingsStore(s => s.lang)
  const density = useSettingsStore(s => s.density)
  const reducedMotion = useSettingsStore(s => s.reducedMotion)
  const t = useTranslation(lang)
  const isFocusActive = useFocusStore(s => s.isActive)
  const location = useLocation()

  const segment = location.pathname.split('/')[1] || 'today'
  const meta = PAGE_META[segment] || PAGE_META.today
  const title = meta.title(t)
  const sub = meta.sub?.(t)

  return (
    <div className={cn(reducedMotion && 'reduce-motion', `density-${density}`)}>
      <div className="page-bg" />
      <div className="stage">
        <div className="win">
          {/* Titlebar */}
          <div className="win-titlebar">
            <div className="traffic">
              <i onClick={() => {}} /><i /><i />
            </div>
            <div className="title">Lumo Task</div>
          </div>

          {/* Lumo pulse line */}
          <div className={cn('lumo-pulse', reducedMotion && 'lumo-pulse-reduced')} />

          {/* Body */}
          <div className="win-body">
            {!isFocusActive && (
              <Sidebar lang={lang} t={t} />
            )}

            <div className="main">
              {!isFocusActive && (
                <Topbar
                  title={title} sub={sub}
                  lang={lang} t={t}
                  onQuickAdd={onQuickAdd}
                />
              )}
              <div className={isFocusActive ? '' : 'content'} style={isFocusActive ? { flex: 1, display: 'flex' } : undefined}>
                <Outlet />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
