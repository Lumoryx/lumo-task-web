import { cn } from '../../lib/cn'

interface Props {
  value: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
}

export function Toggle({ value, onChange, disabled }: Props) {
  return (
    <div
      className={cn('toggle', value && 'on', disabled && 'opacity-40')}
      onClick={() => !disabled && onChange(!value)}
    >
      <div className="thumb" />
    </div>
  )
}
