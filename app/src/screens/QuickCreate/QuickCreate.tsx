import React, { useState, useRef, useEffect } from 'react'
import { useSettingsStore } from '../../store/settingsStore'
import { useTaskStore } from '../../store/taskStore'
import { cn } from '../../lib/cn'
import { IconClose, IconCalendar, IconTimer } from '../../components/icons'
import type { Quadrant } from '../../api/types'

interface Props {
  initialQuadrant?: string
  onClose: () => void
}

const QUADRANTS: { key: Quadrant; label: string; cls: string }[] = [
  { key: 'Q1', label: 'Q1', cls: 'chip-q1' },
  { key: 'Q2', label: 'Q2', cls: 'chip-q2' },
  { key: 'Q3', label: 'Q3', cls: 'chip-q3' },
  { key: 'Q4', label: 'Q4', cls: 'chip-q4' },
]

const DURATION_STEPS = [15, 25, 30, 45, 60, 90, 120]

function nextDuration(curr: number, dir: 1 | -1): number {
  const idx = DURATION_STEPS.indexOf(curr)
  if (idx === -1) {
    const sorted = [...DURATION_STEPS].sort((a, b) => a - b)
    if (dir === 1) return sorted.find(v => v > curr) ?? DURATION_STEPS[DURATION_STEPS.length - 1]
    return [...sorted].reverse().find(v => v < curr) ?? DURATION_STEPS[0]
  }
  const next = idx + dir
  if (next < 0) return DURATION_STEPS[0]
  if (next >= DURATION_STEPS.length) return DURATION_STEPS[DURATION_STEPS.length - 1]
  return DURATION_STEPS[next]
}

function formatDur(mins: number, lang: string) {
  if (mins < 60) return lang === 'zh' ? `${mins} 分钟` : `${mins} min`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (m === 0) return lang === 'zh' ? `${h} 小时` : `${h}h`
  return lang === 'zh' ? `${h}h ${m} 分钟` : `${h}h ${m}m`
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function fmtDate(iso: string, lang: string) {
  const d = new Date(iso + 'T00:00:00')
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
  if (d.getTime() === today.getTime()) return lang === 'zh' ? '今天' : 'Today'
  if (d.getTime() === tomorrow.getTime()) return lang === 'zh' ? '明天' : 'Tomorrow'
  return d.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' })
}

export function QuickCreate({ initialQuadrant, onClose }: Props) {
  const lang = useSettingsStore(s => s.lang)
  const addTask = useTaskStore(s => s.addTask)

  const [titleEn, setTitleEn] = useState('')
  const [titleZh, setTitleZh] = useState('')
  const [quadrant, setQuadrant] = useState<Quadrant>(
    (initialQuadrant as Quadrant) || 'Q2'
  )
  const [due, setDue] = useState<string>(todayStr())
  const [duration, setDuration] = useState(30)
  const [addToToday, setAddToToday] = useState(true)
  const [showCal, setShowCal] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Auto-resize textarea
  const handleTitleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    if (lang === 'zh') { setTitleZh(val); if (!titleEn) setTitleEn(val) }
    else { setTitleEn(val); if (!titleZh) setTitleZh(val) }
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 180) + 'px'
  }

  const titleValue = lang === 'zh' ? titleZh : titleEn
  const canSubmit = titleEn.trim().length > 0 || titleZh.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    const en = titleEn.trim() || titleZh.trim()
    const zh = titleZh.trim() || titleEn.trim()
    await addTask({
      title: { en, zh },
      quadrant,
      today: addToToday,
      due,
      duration,
      pomos_total: Math.max(1, Math.ceil(duration / 25)),
    })
    onClose()
  }

  // Close on backdrop click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose()
  }

  // Calendar mini — simple 5-week grid
  const calDays = (() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const first = new Date(today.getFullYear(), today.getMonth(), 1)
    const startDay = first.getDay()
    const days: (Date | null)[] = Array(startDay).fill(null)
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(today.getFullYear(), today.getMonth(), i))
    }
    while (days.length % 7 !== 0) days.push(null)
    return { days, today, monthLabel: first.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', { month: 'long', year: 'numeric' }) }
  })()

  return (
    <div
      ref={overlayRef}
      className="modal-overlay"
      onClick={handleOverlayClick}
      style={{ zIndex: 200 }}
    >
      <div
        className="card"
        style={{
          width: 480,
          padding: 0,
          overflow: 'visible',
          boxShadow: 'var(--shadow-float)',
          position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--border-faint)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
            {lang === 'zh' ? '新建任务' : 'New Task'}
          </span>
          <button
            className="btn btn-ghost"
            style={{ width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={onClose}
          >
            <IconClose size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 20px' }}>
          {/* Title input */}
          <textarea
            ref={textareaRef}
            value={titleValue}
            onChange={handleTitleInput}
            placeholder={lang === 'zh' ? '任务标题…' : 'Task title…'}
            rows={1}
            style={{
              width: '100%',
              resize: 'none',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 15,
              fontWeight: 500,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              minHeight: 36,
              maxHeight: 180,
              overflowY: 'auto',
              boxSizing: 'border-box',
              padding: 0,
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
          />

          {/* Quadrant selector */}
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            {QUADRANTS.map(q => (
              <button
                key={q.key}
                className={cn('chip', q.cls, quadrant === q.key ? 'active' : '')}
                style={{
                  cursor: 'pointer',
                  opacity: quadrant === q.key ? 1 : 0.45,
                  fontWeight: quadrant === q.key ? 700 : 500,
                  transition: 'opacity 0.15s',
                  border: quadrant === q.key ? '1px solid currentColor' : '1px solid transparent',
                }}
                onClick={() => setQuadrant(q.key)}
              >
                {q.label}
              </button>
            ))}
            <button
              className={cn('chip', 'chip-unclassified', quadrant === 'unclassified' ? 'active' : '')}
              style={{
                cursor: 'pointer',
                opacity: quadrant === 'unclassified' ? 1 : 0.45,
                fontWeight: quadrant === 'unclassified' ? 700 : 500,
                transition: 'opacity 0.15s',
                border: quadrant === 'unclassified' ? '1px solid currentColor' : '1px solid transparent',
              }}
              onClick={() => setQuadrant('unclassified')}
            >
              {lang === 'zh' ? '未分类' : 'None'}
            </button>
          </div>

          {/* Due + Duration row */}
          <div style={{ marginTop: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
            {/* Due date */}
            <div style={{ position: 'relative' }}>
              <button
                className="btn btn-secondary"
                style={{ height: 32, fontSize: 12, gap: 5, display: 'flex', alignItems: 'center' }}
                onClick={() => setShowCal(v => !v)}
              >
                <IconCalendar size={13} />
                {fmtDate(due, lang)}
              </button>

              {/* Calendar popover */}
              {showCal && (
                <div
                  className="popover cal-pop"
                  style={{ top: 36, left: 0, minWidth: 240, zIndex: 300 }}
                  onClick={e => e.stopPropagation()}
                >
                  <div style={{ padding: '10px 12px 8px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', borderBottom: '1px solid var(--border-faint)' }}>
                    {calDays.monthLabel}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', padding: '8px 10px', gap: 2 }}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-faint)', padding: '2px 0' }}>{d}</div>
                    ))}
                    {calDays.days.map((day, i) => {
                      if (!day) return <div key={i} />
                      const iso = day.toISOString().slice(0, 10)
                      const isToday = day.getTime() === calDays.today.getTime()
                      const isSelected = iso === due
                      const isPast = day < calDays.today
                      return (
                        <button
                          key={iso}
                          disabled={isPast}
                          onClick={() => { setDue(iso); setShowCal(false) }}
                          style={{
                            width: '100%',
                            aspectRatio: '1',
                            border: 'none',
                            borderRadius: 4,
                            fontSize: 11,
                            cursor: isPast ? 'not-allowed' : 'pointer',
                            background: isSelected ? 'var(--accent-primary)' : isToday ? 'var(--bg-hover)' : 'transparent',
                            color: isSelected ? '#000' : isPast ? 'var(--text-faint)' : 'var(--text-primary)',
                            fontWeight: isSelected ? 700 : 400,
                          }}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Duration stepper */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 0, border: '1px solid var(--border-faint)', borderRadius: 6, overflow: 'hidden', height: 32 }}>
              <button
                className="btn btn-ghost"
                style={{ width: 28, height: 32, padding: 0, borderRadius: 0, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setDuration(d => nextDuration(d, -1))}
              >−</button>
              <div style={{ padding: '0 8px', fontSize: 12, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4, minWidth: 72, justifyContent: 'center' }}>
                <IconTimer size={12} />
                {formatDur(duration, lang)}
              </div>
              <button
                className="btn btn-ghost"
                style={{ width: 28, height: 32, padding: 0, borderRadius: 0, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setDuration(d => nextDuration(d, 1))}
              >+</button>
            </div>

            {/* Add to today toggle */}
            <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={addToToday}
                onChange={e => setAddToToday(e.target.checked)}
                style={{ accentColor: 'var(--accent-primary)', width: 14, height: 14 }}
              />
              {lang === 'zh' ? '加入今天' : 'Add to Today'}
            </label>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px 16px', borderTop: '1px solid var(--border-faint)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-secondary" style={{ height: 36 }} onClick={onClose}>
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            className="btn btn-primary"
            style={{ height: 36, minWidth: 80 }}
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting
              ? (lang === 'zh' ? '添加中…' : 'Adding…')
              : (lang === 'zh' ? '添加任务' : 'Add Task')}
          </button>
        </div>
      </div>
    </div>
  )
}
