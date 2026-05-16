import { useSettingsStore } from '../../store/settingsStore'
import { Toggle } from '../../components/ui/Toggle'
import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

export function SettingsSync({ lang, t }: Props) {
  const { cloudSync, syncTasks, syncMemory, syncConversations, update } = useSettingsStore()

  return (
    <div>
      <div className="settings-title">{t('settings.sync_title')}</div>

      <div className="settings-panel">
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.sync_master')}</div></div>
          <Toggle value={cloudSync} onChange={v => update({ cloudSync: v })} />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.sync_tasks')}</div></div>
          <Toggle value={syncTasks} onChange={v => update({ syncTasks: v })} disabled={!cloudSync} />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.sync_memory')}</div></div>
          <Toggle value={syncMemory} onChange={v => update({ syncMemory: v })} disabled={!cloudSync} />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.sync_conv')}</div></div>
          <Toggle value={syncConversations} onChange={v => update({ syncConversations: v })} disabled={!cloudSync} />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '状态' : 'Status'}</div></div>
          <div>
            <div className="sync-status">
              <span className="sync-dot" />
              {t('settings.sync_status')}
            </div>
            <button className="btn btn-secondary" style={{ marginTop: 8, height: 32, fontSize: 12 }}>
              {t('settings.sync_now')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
