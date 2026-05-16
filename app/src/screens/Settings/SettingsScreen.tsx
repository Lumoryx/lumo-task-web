import { useParams, useNavigate } from 'react-router-dom'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { cn } from '../../lib/cn'
import { SettingsAI } from './SettingsAI'
import { SettingsAppearance } from './SettingsAppearance'
import { SettingsSync } from './SettingsSync'
import { SettingsPrivacy } from './SettingsPrivacy'
import { SettingsAccount } from './SettingsAccount'

type Section = 'ai' | 'appearance' | 'sync' | 'privacy' | 'account'

export function SettingsScreen() {
  const { section = 'ai' } = useParams<{ section?: string }>()
  const navigate = useNavigate()
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)

  const sections: Array<{ key: Section; label: string }> = [
    { key: 'ai', label: t('settings.ai') },
    { key: 'appearance', label: t('settings.appearance') },
    { key: 'sync', label: t('settings.sync') },
    { key: 'privacy', label: t('settings.privacy') },
    { key: 'account', label: t('settings.account') },
  ]

  const current = section as Section

  return (
    <div className="settings-layout fade-in">
      {/* Left nav */}
      <div className="settings-nav">
        {sections.map(s => (
          <div key={s.key}
            className={cn('nav-item', current === s.key && 'active')}
            style={{ margin: '1px 10px' }}
            onClick={() => navigate(`/settings/${s.key}`)}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: current === s.key ? 'var(--accent-primary)' : 'var(--border-strong)', flexShrink: 0 }} />
            {s.label}
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="settings-content">
        {current === 'ai' && <SettingsAI lang={lang} t={t} />}
        {current === 'appearance' && <SettingsAppearance lang={lang} t={t} />}
        {current === 'sync' && <SettingsSync lang={lang} t={t} />}
        {current === 'privacy' && <SettingsPrivacy lang={lang} t={t} />}
        {current === 'account' && <SettingsAccount lang={lang} t={t} />}
      </div>
    </div>
  )
}
