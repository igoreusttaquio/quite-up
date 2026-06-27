import type { ReactNode } from 'react'
import { Text } from '@fluentui/react-components'

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6 gap-4">
      <div>
        <Text as="h1" size={800} weight="semibold" block>{title}</Text>
        {subtitle && (
          <Text size={300} className="text-muted mt-0.5 block">{subtitle}</Text>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  )
}
