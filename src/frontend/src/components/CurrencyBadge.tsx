import { Text, mergeClasses } from '@fluentui/react-components'
import type { TextProps } from '@fluentui/react-components'

interface CurrencyBadgeProps {
  value: number
  className?: string
  size?: TextProps['size']
}

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CurrencyBadge({ value, className, size = 400 }: CurrencyBadgeProps) {
  const colorClass = value > 0 ? 'text-income' : value < 0 ? 'text-expense' : undefined

  return (
    <Text size={size} weight="semibold" className={mergeClasses(colorClass, className)}>
      {formatter.format(value)}
    </Text>
  )
}
