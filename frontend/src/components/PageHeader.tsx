import type { ReactNode } from 'react'
import { Text } from '@fluentui/react-components'

interface PageHeaderProps {
  title: string
  action?: ReactNode
}

export function PageHeader({ title, action }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <Text as="h1" size={700} weight="semibold">
        {title}
      </Text>
      {action && <div>{action}</div>}
    </div>
  )
}
