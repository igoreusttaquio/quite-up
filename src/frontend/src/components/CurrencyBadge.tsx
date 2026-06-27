import { Text } from '@fluentui/react-components'
import { mergeClasses } from '@fluentui/react-components'

interface CurrencyBadgeProps {
  value: number
  className?: string
}

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CurrencyBadge({ value, className }: CurrencyBadgeProps) {
  const colorClass = value > 0 ? 'text-income' : value < 0 ? 'text-expense' : undefined

  return (
    <Text size={400} weight="semibold" className={mergeClasses(colorClass, className)}>
      {formatter.format(value)}
    </Text>
  )
}
