import { NavLink } from 'react-router-dom'
import { IconToday, IconMatrix, IconSettings } from '../components/icons'
import { cn } from '../lib/cn'
import type { Lang } from '../api/types'
import { useTaskStore } from '../store/taskStore'

interface Props { lang: Lang; t: (k: string, v?: Record<string, string | number>) => string }

export function Sidebar({ lang: _lang, t }: Props) {
  const tasks = useTaskStore(s => s.tasks)
  const count = tasks.filter(t => !t.completed).length

  const navItems = [
    { to: '/today', label: t('nav.today'), icon: <IconToday />, badge: tasks.filter(t => t.today && !t.completed).length },
    { to: '/matrix', label: t('nav.matrix'), icon: <IconMatrix />, badge: count },
    { to: '/settings', label: t('nav.settings'), icon: <IconSettings /> },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="glyph">
          <svg viewBox="0 0 22 22" fill="none">
            <circle cx="11" cy="11" r="8" stroke="var(--accent-primary)" strokeWidth="1.5" strokeDasharray="3 2"/>
            <circle cx="11" cy="11" r="3" fill="var(--accent-primary)"/>
          </svg>
        </div>
        <span>{t('brand.name')}</span>
      </div>

      <nav style={{ flex: 1 }}>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => cn('nav-item', isActive && 'active')}
          >
            {item.icon}
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge !== undefined && item.badge > 0 && (
              <span className="badge">{item.badge}</span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="local-status">
          <span className="dot" />
          <span>{t('nav.local', { count })}</span>
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-faint)', paddingLeft: 14 }}>
          {t('nav.local_first')}
        </div>
      </div>
    </div>
  )
}
