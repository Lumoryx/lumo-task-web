import { IconLock } from '../../components/icons'
import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

export function SettingsPrivacy({ lang, t }: Props) {
  return (
    <div>
      <div className="settings-title">{t('settings.privacy_title')}</div>

      <div className="settings-panel">
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.db_path')}</div></div>
          <div>
            <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-deep)', padding: '4px 8px', borderRadius: 4, border: '1px solid var(--border-faint)' }}>
              {lang === 'zh' ? '~/Library/Application Support/LumoTask' : '~/Library/Application Support/LumoTask'}
            </code>
          </div>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '导出数据' : 'Export data'}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" style={{ height: 36 }}>{t('settings.export_json')}</button>
            <button className="btn btn-secondary" style={{ height: 36 }}>{t('settings.export_md')}</button>
          </div>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">{lang === 'zh' ? '备份' : 'Backup'}</div></div>
          <div>
            <button className="btn btn-secondary" style={{ height: 36 }}>{t('settings.backup')}</button>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 6 }}>{lang === 'zh' ? '上次备份：从未' : 'Last backup: Never'}</div>
          </div>
        </div>
        <div className="settings-row">
          <div />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <IconLock size={13} />
            {lang === 'zh' ? 'API Key 仅保存在本地，从不上传' : 'API Keys are stored locally only — never uploaded'}
          </div>
        </div>
      </div>
    </div>
  )
}
