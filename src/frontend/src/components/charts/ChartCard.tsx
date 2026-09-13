import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { SkeletonLine } from '../Skeleton'

interface ChartCardProps {
  title: string
  subtitle?: string
  action?: ReactNode
  loading?: boolean
  empty?: boolean
  emptyMessage?: string
  height?: number
  className?: string
  children: ReactNode
}

export function ChartCard({
  title,
  subtitle,
  action,
  loading,
  empty,
  emptyMessage = 'Sem dados suficientes ainda',
  height = 260,
  className,
  children,
}: ChartCardProps) {
  return (
    <div className={cn('card p-4 sm:p-5', className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base font-semibold">{title}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0">{action}</div>}
      </div>

      {loading ? (
        <div className="flex flex-col justify-end gap-2" style={{ height }}>
          <SkeletonLine className="h-3 w-1/3" />
          <SkeletonLine className="w-full flex-1" />
        </div>
      ) : empty ? (
        <div
          className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground"
          style={{ height }}
        >
          <BarChart3 size={30} className="opacity-40" />
          <p className="text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div style={{ height }}>{children}</div>
      )}
    </div>
  )
}
