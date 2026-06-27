import { mergeClasses } from '@fluentui/react-components'

interface SkeletonProps {
  className?: string
}

export function SkeletonLine({ className }: SkeletonProps) {
  return (
    <div className={mergeClasses('animate-pulse rounded-md bg-surface-3', className)} />
  )
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={mergeClasses('rounded-xl border border-subtle bg-surface p-6 space-y-4 shadow-sm', className)}>
      <div className="flex items-center gap-3">
        <SkeletonLine className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonLine className="h-4 w-1/3" />
          <SkeletonLine className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonLine className="h-7 w-2/3" />
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <SkeletonLine className="h-10 w-full rounded-lg" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonLine key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  )
}
