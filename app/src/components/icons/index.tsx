// All SVG icons as React components (ported from web/shell.jsx ICON object)
interface IconProps { size?: number; className?: string }
const S = ({ size = 16, className = '' }: IconProps) => ({
  width: size, height: size, viewBox: '0 0 16 16', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, className,
} as React.SVGProps<SVGSVGElement>)

import React from 'react'

export const IconToday = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="6"/><path d="M8 5v3l2 1.5"/></svg>
export const IconMatrix = (p: IconProps) => <svg {...S(p)}><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>
export const IconFocus = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="5"/><circle cx="8" cy="8" r="2"/></svg>
export const IconSettings = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="2"/><path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7"/></svg>
export const IconPlus = (p: IconProps) => <svg {...S(p)}><path d="M8 3v10M3 8h10"/></svg>
export const IconSearch = (p: IconProps) => <svg {...S(p)}><circle cx="6.5" cy="6.5" r="4"/><path d="M10 10l3 3"/></svg>
export const IconCheck = (p: IconProps) => <svg {...S(p)}><path d="M3 8l3.5 3.5L13 4"/></svg>
export const IconMore = (p: IconProps) => <svg {...S(p)}><circle cx="4" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="8" cy="8" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="8" r="1" fill="currentColor" stroke="none"/></svg>
export const IconClose = (p: IconProps) => <svg {...S(p)}><path d="M4 4l8 8M12 4l-8 8"/></svg>
export const IconChevronLeft = (p: IconProps) => <svg {...S(p)}><path d="M10 12L6 8l4-4"/></svg>
export const IconChevronRight = (p: IconProps) => <svg {...S(p)}><path d="M6 4l4 4-4 4"/></svg>
export const IconChevronDown = (p: IconProps) => <svg {...S(p)}><path d="M4 6l4 4 4-4"/></svg>
export const IconEdit = (p: IconProps) => <svg {...S(p)}><path d="M11 2l3 3-9 9H2v-3l9-9z"/></svg>
export const IconTrash = (p: IconProps) => <svg {...S(p)}><path d="M3 5h10M6 5V3h4v2M5 5l.7 8h4.6L11 5"/></svg>
export const IconSnooze = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="5.5"/><path d="M6 6.5h4L6 9.5h4"/></svg>
export const IconCopy = (p: IconProps) => <svg {...S(p)}><rect x="5" y="5" width="7" height="8" rx="1"/><path d="M4 11V3h8"/></svg>
export const IconMove = (p: IconProps) => <svg {...S(p)}><path d="M8 3v10M5 6l3-3 3 3M5 10l3 3 3-3"/></svg>
export const IconSend = (p: IconProps) => <svg {...S(p)}><path d="M14 2L2 8l5 2 2 5 5-13z"/></svg>
export const IconCalendar = (p: IconProps) => <svg {...S(p)}><rect x="2" y="4" width="12" height="10" rx="1"/><path d="M2 7h12M6 2v2M10 2v2"/></svg>
export const IconTimer = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="9" r="5"/><path d="M8 6v3l2 1.5M6 2h4"/></svg>
export const IconPause = (p: IconProps) => <svg {...S(p)}><rect x="4" y="3" width="3" height="10" rx="1"/><rect x="9" y="3" width="3" height="10" rx="1"/></svg>
export const IconPlay = (p: IconProps) => <svg {...S(p)}><path d="M5 3l9 5-9 5V3z"/></svg>
export const IconStar = (p: IconProps) => <svg {...S(p)}><path d="M8 2l1.5 4h4l-3 2.5 1 4L8 10l-3.5 2.5 1-4-3-2.5h4z"/></svg>
export const IconLock = (p: IconProps) => <svg {...S(p)}><rect x="4" y="7" width="8" height="7" rx="1"/><path d="M6 7V5a2 2 0 014 0v2"/></svg>
export const IconGlobe = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="6"/><path d="M8 2c-2 3-2 9 0 12M8 2c2 3 2 9 0 12M2 8h12"/></svg>
export const IconUser = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="5" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>
export const IconBolt = (p: IconProps) => <svg {...S(p)}><path d="M10 2L4 9h5l-3 5 8-7H9l1-5z"/></svg>
export const IconKey = (p: IconProps) => <svg {...S(p)}><circle cx="6" cy="7" r="3"/><path d="M8.5 9.5L13 14M10.5 11.5l1.5-1.5"/></svg>
export const IconCloud = (p: IconProps) => <svg {...S(p)}><path d="M4 12a3 3 0 110-6 4 4 0 017.8 1A3 3 0 0112 13H4z"/></svg>
export const IconWarning = (p: IconProps) => <svg {...S(p)}><path d="M8 3L2 13h12L8 3z"/><path d="M8 8v2M8 12v.5" strokeLinecap="round"/></svg>
export const IconAI = (p: IconProps) => <svg {...S(p)}><circle cx="8" cy="8" r="3"/><circle cx="8" cy="8" r="5.5" strokeDasharray="2 2"/></svg>
