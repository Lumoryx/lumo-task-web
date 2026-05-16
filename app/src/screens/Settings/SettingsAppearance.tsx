import { useSettingsStore, ACCENT_THEMES } from '../../store/settingsStore'
import { SegControl } from '../../components/ui/SegControl'
import { cn } from '../../lib/cn'
import type { Lang, AccentKey, DensityKey } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

const ACCENT_KEYS: AccentKey[] = ['green', 'cyan', 'amber', 'graphite']
const ACCENT_NAMES = { green: 'Lumo Green', cyan: 'Calm Cyan', amber: 'Warm Amber', graphite: 'Graphite' }

export function SettingsAppearance({ lang: _lang, t }: Props) {
  const { accent, density, reducedMotion, setAccent, setDensity, setReducedMotion } = useSettingsStore()

  return (
    <div>
      <div className="settings-title">{t('settings.appear_title')}</div>

      <div className="settings-panel">
        {/* Theme */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.theme')}</div></div>
          <SegControl
            options={[
              { value: 'dark', label: t('misc.dark') },
              { value: 'light', label: t('misc.light') },
              { value: 'system', label: t('misc.system') },
            ]}
            value="dark"
            onChange={() => {}}
          />
        </div>

        {/* Accent color */}
        <div className="settings-row row-top">
          <div><div className="settings-label">{t('settings.accent')}</div></div>
          <div className="accent-grid" style={{ maxWidth: 280 }}>
            {ACCENT_KEYS.map(key => (
              <div
                key={key}
                className={cn('accent-swatch', accent === key && 'active')}
                style={{ background: ACCENT_THEMES[key].primary }}
                title={ACCENT_NAMES[key]}
                onClick={() => setAccent(key)}
              />
            ))}
          </div>
        </div>

        {/* Motion */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.motion')}</div></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <SegControl
              options={[
                { value: 'standard', label: t('misc.standard') },
                { value: 'reduced', label: t('misc.reduced') },
              ]}
              value={reducedMotion ? 'reduced' : 'standard'}
              onChange={v => setReducedMotion(v === 'reduced')}
            />
          </div>
        </div>

        {/* Density */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.density')}</div></div>
          <SegControl
            options={[
              { value: 'comfortable', label: t('misc.comfortable') },
              { value: 'compact', label: t('misc.compact') },
            ]}
            value={density}
            onChange={v => setDensity(v as DensityKey)}
          />
        </div>
      </div>
    </div>
  )
}
