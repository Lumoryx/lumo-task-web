import { useState } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useTranslation } from '../../hooks/useTranslation'
import { useTaskStore } from '../../store/taskStore'
import { aiApi } from '../../api/ai'
import { LumoStatus } from '../../components/ui/LumoStatus'
import { QuadrantBox } from './QuadrantBox'
import { UnclassifiedStrip } from './UnclassifiedStrip'
import { ClassifyConfirmDialog } from './ClassifyConfirmDialog'
import type { Quadrant, AiClassifyResult } from '../../api/types'

const QUADRANTS: Quadrant[] = ['Q1', 'Q2', 'Q3', 'Q4']

export function MatrixScreen() {
  const lang = useSettingsStore(s => s.lang)
  const t = useTranslation(lang)
  const { tasks, moveQuadrant } = useTaskStore()
  const [classifyResult, setClassifyResult] = useState<AiClassifyResult | null>(null)
  const [classifying, setClassifying] = useState(false)

  const unclassified = tasks.filter(t => t.quadrant === 'unclassified')
  const q1Tasks = tasks.filter(t => t.quadrant === 'Q1')
  const showOverload = q1Tasks.length >= 4

  const handleClassify = async () => {
    setClassifying(true)
    try {
      const result = await aiApi.classify()
      setClassifyResult(result)
    } finally { setClassifying(false) }
  }

  const handleApplyClassify = async (overrides: Record<string, Quadrant>) => {
    if (!classifyResult) return
    for (const { id, quadrant } of classifyResult.classifications) {
      const q = overrides[id] || quadrant
      await moveQuadrant(id, q)
    }
    setClassifyResult(null)
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* AI status + classify button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid var(--border-faint)', flexShrink: 0 }}>
        <LumoStatus variant="dot" text={classifying ? t('ai.classifying') : t('ai.ready')} />
        {unclassified.length > 0 && (
          <button className="btn btn-secondary" style={{ fontSize: 12, height: 30 }} onClick={handleClassify} disabled={classifying}>
            &#9881; {t('matrix.ai_classify')}
          </button>
        )}
      </div>

      {/* Q1 overload warning */}
      {showOverload && (
        <div style={{ padding: '0 16px', paddingTop: 10, flexShrink: 0 }}>
          <div className="q1-overload-banner">
            <span>&#9888;</span>
            <span>{t('matrix.overload', { n: q1Tasks.length })}</span>
          </div>
        </div>
      )}

      {/* 2x2 grid */}
      <div className="matrix-grid" style={{ flex: 1, minHeight: 0 }}>
        {QUADRANTS.map(q => (
          <QuadrantBox key={q} quadrant={q} lang={lang} t={t}
            tasks={tasks.filter(tk => tk.quadrant === q)}
            onMove={(taskId, newQ) => moveQuadrant(taskId, newQ)} />
        ))}
      </div>

      {/* Unclassified strip */}
      {unclassified.length > 0 && (
        <UnclassifiedStrip tasks={unclassified} lang={lang} t={t} onClassify={handleClassify} />
      )}

      {/* Classify dialog */}
      {classifyResult && (
        <ClassifyConfirmDialog
          lang={lang} t={t}
          result={classifyResult}
          tasks={tasks}
          onApply={handleApplyClassify}
          onCancel={() => setClassifyResult(null)} />
      )}
    </div>
  )
}
