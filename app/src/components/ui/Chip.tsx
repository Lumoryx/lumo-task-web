import React from 'react'
import type { Quadrant } from '../../api/types'

interface Props {
  variant: Quadrant | 'ai'
  children: React.ReactNode
}

const variantClass: Record<string, string> = {
  Q1: 'chip chip-q1', Q2: 'chip chip-q2',
  Q3: 'chip chip-q3', Q4: 'chip chip-q4',
  unclassified: 'chip', ai: 'chip chip-ai',
}

export function Chip({ variant, children }: Props) {
  return <span className={variantClass[variant] || 'chip'}>{children}</span>
}
