
interface Props { done: number; total: number }

export function PomoPips({ done, total }: Props) {
  return (
    <span className="pip">
      {Array.from({ length: total }, (_, i) => (
        <i key={i} className={i < done ? 'on' : ''} />
      ))}
    </span>
  )
}
