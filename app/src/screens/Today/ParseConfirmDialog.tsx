import { useState } from 'react'
import { useTaskStore } from '../../store/taskStore'
import { Chip } from '../../components/ui/Chip'
import { Toggle } from '../../components/ui/Toggle'
import type { Lang, ParsedTask, Quadrant } from '../../api/types'

interface Props {
  lang: Lang
  t: (k: string) => string
  originalText: string
  parsed: ParsedTask
  onConfirm: () => void
  onCancel: () => void
}

export function ParseConfirmDialog({ lang, t, originalText: _originalText, parsed, onConfirm, onCancel }: Props) {
  const { addTask } = useTaskStore()
  const [addToday, setAddToday] = useState(true)
  const [quadrant] = useState<Quadrant>(parsed.quadrant)

  const handleAdd = async () => {
    await addTask({
      title: parsed.title,
      quadrant,
      today: addToday,
      due: parsed.due ?? null,
      duration: parsed.duration,
      pomos_total: parsed.pomos_total,
    })
    onConfirm()
  }

  const q = quadrant === 'unclassified' ? 'Q2' : quadrant as any

  return (
    <div className="modal-overlay">
      <div className="modal parse-dialog">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px var(--accent-primary)' }} />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{t('parse.title')}</span>
        </div>

        {/* Task title */}
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 14 }}>
          {parsed.title[lang] || parsed.title.en}
        </div>

        {/* Parsed chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <Chip variant={q}>{q}</Chip>
          {parsed.due && <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 4, border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>{parsed.due}</span>}
          {parsed.duration && <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--bg-elevated)', borderRadius: 4, border: '1px solid var(--border-default)', color: 'var(--text-secondary)' }}>{parsed.duration}m</span>}
        </div>

        {/* Quadrant reason */}
        <div style={{ padding: '10px 12px', background: 'var(--accent-fog)', border: '1px solid var(--accent-edge)', borderRadius: 8, fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
          <span style={{ color: 'var(--accent-primary)', marginRight: 6 }}>&#9670;</span>
          {parsed.quadrant_reason[lang] || parsed.quadrant_reason.en}
          <span style={{ marginLeft: 8, color: 'var(--accent-primary)', cursor: 'default', fontSize: 11 }}>
            {t('parse.quadrant_change')}
          </span>
        </div>

        {/* Add to today toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{t('parse.add_today')}</span>
          <Toggle value={addToday} onChange={setAddToday} />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAdd}>{t('parse.confirm')}</button>
          <button className="btn btn-ghost" onClick={onCancel}>{t('parse.cancel')}</button>
        </div>
      </div>
    </div>
  )
}
