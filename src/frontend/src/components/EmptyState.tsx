import type { ReactNode } from 'react'
import { Text } from '@fluentui/react-components'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 text-center px-4">
      <div className="text-subtle opacity-50">{icon}</div>
      <div className="space-y-1">
        <Text size={400} weight="semibold" block>{title}</Text>
        {description && (
          <Text size={300} className="text-muted max-w-xs" block>{description}</Text>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
