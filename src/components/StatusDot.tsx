interface StatusDotProps {
  count: number
  onClick?: (e?: React.MouseEvent) => void
}

export default function StatusDot({ count, onClick }: StatusDotProps) {
  const color = count === 0 ? 'bg-success' : count <= 3 ? 'bg-warning' : 'bg-danger'

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick?.(e) }}
      className={`h-3 w-3 rounded-full ${color} inline-block`}
      title={`${count} incidents this month`}
    />
  )
}
