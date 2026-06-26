import { Text } from '@fluentui/react-components'

interface CurrencyBadgeProps {
  value: number
}

const formatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function CurrencyBadge({ value }: CurrencyBadgeProps) {
  const isPositive = value >= 0
  const color = value === 0 ? undefined : isPositive ? 'var(--colorPaletteGreenForeground1)' : 'var(--colorPaletteRedForeground1)'

  return (
    <Text size={400} weight="semibold" style={{ color }}>
      {formatter.format(value)}
    </Text>
  )
}
