import { cn } from '../../lib/cn'

interface Option { value: string; label: string }

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
}

export function SegControl({ options, value, onChange }: Props) {
  return (
    <div className="seg">
      {options.map(o => (
        <button
          key={o.value}
          className={cn(value === o.value && 'on')}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
