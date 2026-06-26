import type { ReactNode } from 'react'
import { Text } from '@fluentui/react-components'

interface EmptyStateProps {
  icon: ReactNode
  message: string
  action?: ReactNode
}

export function EmptyState({ icon, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="opacity-40">{icon}</div>
      <Text size={400} align="center">
        {message}
      </Text>
      {action && <div>{action}</div>}
    </div>
  )
}
