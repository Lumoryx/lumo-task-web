import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import type { Lang } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

const PROVIDERS = ['OpenAI', 'Claude', 'Gemini', 'DeepSeek', 'Ollama', 'Custom...']
const MODELS: Record<string, string[]> = {
  Claude: ['claude-haiku-4-5', 'claude-sonnet-4-6', 'claude-opus-4-7'],
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'o1-preview'],
  Gemini: ['gemini-2.0-flash', 'gemini-1.5-pro'],
  DeepSeek: ['deepseek-chat', 'deepseek-reasoner'],
  default: ['default'],
}

export function SettingsAI({ lang, t }: Props) {
  const { aiProvider, aiModel, aiApiKey, aiBaseUrl, update } = useSettingsStore()
  const [showKey, setShowKey] = useState(false)
  const [testStatus, setTestStatus] = useState<'idle' | 'ok' | 'fail'>('idle')

  const providerName = aiProvider === 'claude' ? 'Claude' : aiProvider === 'openai' ? 'OpenAI' : aiProvider.charAt(0).toUpperCase() + aiProvider.slice(1)
  const models = MODELS[providerName] || MODELS.default

  const handleTest = async () => {
    setTestStatus('idle')
    await new Promise(r => setTimeout(r, 600))
    setTestStatus(aiApiKey ? 'ok' : 'fail')
    setTimeout(() => setTestStatus('idle'), 3000)
  }

  return (
    <div>
      <div className="settings-title">{t('settings.ai_title')}</div>
      <p className="settings-subtitle">{t('settings.ai_sub')}</p>

      <div className="settings-panel">
        {/* Status row */}
        <div className="settings-row">
          <div>
            <div className="settings-label">{t('settings.ai_status')}</div>
          </div>
          <div>
            <span className="chip chip-ai" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', animation: 'lumoBreath 3s ease-in-out infinite' }} />
              {t('settings.ai_connected')}
            </span>
          </div>
        </div>

        {/* Provider */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.ai_provider')}</div></div>
          <select className="input" style={{ width: 220, height: 36 }}
            value={providerName}
            onChange={e => update({ aiProvider: e.target.value.toLowerCase() as any })}>
            {PROVIDERS.map(p => <option key={p}>{p}</option>)}
          </select>
        </div>

        {/* API Key */}
        <div className="settings-row">
          <div>
            <div className="settings-label">{t('settings.ai_key')}</div>
            <div className="settings-helper">{t('settings.ai_key_helper')}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input className="input" style={{ width: 240 }}
              type={showKey ? 'text' : 'password'}
              value={aiApiKey} placeholder="sk-ant-..."
              onChange={e => update({ aiApiKey: e.target.value })} />
            <button className="btn btn-secondary" style={{ height: 40 }} onClick={() => setShowKey(v => !v)}>
              {t('settings.ai_show')}
            </button>
            <button className="btn btn-secondary" style={{ height: 40 }} onClick={handleTest}>
              {testStatus === 'ok' ? '✓ OK' : testStatus === 'fail' ? '✗ Fail' : t('settings.ai_test')}
            </button>
          </div>
        </div>

        {/* Base URL (custom) */}
        {aiProvider === 'ollama' || aiProvider === 'custom' ? (
          <div className="settings-row">
            <div><div className="settings-label">{t('settings.ai_base_url')}</div></div>
            <input className="input" style={{ width: 320 }}
              value={aiBaseUrl} placeholder="http://localhost:11434"
              onChange={e => update({ aiBaseUrl: e.target.value })} />
          </div>
        ) : null}

        {/* Model */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.ai_model')}</div></div>
          <select className="input" style={{ width: 220, height: 36 }}
            value={aiModel}
            onChange={e => update({ aiModel: e.target.value })}>
            {models.map(m => <option key={m}>{m}</option>)}
          </select>
        </div>

        {/* Usage */}
        <div className="settings-row">
          <div><div className="settings-label">{t('settings.ai_usage')}</div></div>
          <div style={{ width: 240 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>
              14% of 60,000 {lang === 'zh' ? '个 token' : 'tokens'}
            </div>
            <div className="usage-meter">
              <div className="usage-fill" style={{ width: '14%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
