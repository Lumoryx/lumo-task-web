import React, { useState, useRef } from 'react'
import { IconSend } from '../../components/icons'
import { aiApi } from '../../api/ai'
import { ParseConfirmDialog } from './ParseConfirmDialog'
import type { Lang, ParsedTask } from '../../api/types'

interface Props { lang: Lang; t: (k: string) => string }

export function ComposeBar({ lang, t }: Props) {
  const [value, setValue] = useState('')
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState<ParsedTask | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async () => {
    if (!value.trim()) return
    setParsing(true)
    try {
      const result = await aiApi.parseText(value.trim(), lang)
      setParsed(result)
    } catch {
      // Fallback: create simple task
      setParsed({ title: { en: value.trim(), zh: value.trim() }, quadrant: 'unclassified', quadrant_reason: { en: 'Unclassified', zh: '未分类' } })
    } finally { setParsing(false) }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit() }
  }

  return (
    <>
      <div className={`compose-bar ${value ? 'has-value' : ''}`}>
        <span className="compose-dot" />
        <input
          ref={inputRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('today.compose')}
        />
        {!value && <span className="compose-kbd">↵</span>}
        <button
          className={`compose-send ${value ? 'active' : ''}`}
          onClick={handleSubmit}
          disabled={parsing}
        >
          <IconSend />
        </button>
      </div>

      {parsed && (
        <ParseConfirmDialog
          lang={lang} t={t}
          originalText={value}
          parsed={parsed}
          onConfirm={() => { setParsed(null); setValue('') }}
          onCancel={() => setParsed(null)}
        />
      )}
    </>
  )
}
