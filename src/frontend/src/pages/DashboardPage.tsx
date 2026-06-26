import { Text } from '@fluentui/react-components'

export function DashboardPage() {
  return (
    <div>
      <Text as="h1" size={700} weight="semibold">
        Dashboard
      </Text>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}
        >
          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
            Saldo Total
          </Text>
          <Text as="p" size={600} weight="semibold" className="mt-2">
            R$ 0,00
          </Text>
        </div>
        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}
        >
          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
            Receitas do Mês
          </Text>
          <Text as="p" size={600} weight="semibold" className="mt-2" style={{ color: 'var(--colorPaletteGreenForeground1)' }}>
            R$ 0,00
          </Text>
        </div>
        <div
          className="rounded-xl p-6 shadow-sm border"
          style={{ backgroundColor: 'var(--colorNeutralBackground1)', borderColor: 'var(--colorNeutralStroke1)' }}
        >
          <Text size={200} style={{ color: 'var(--colorNeutralForeground2)' }}>
            Despesas do Mês
          </Text>
          <Text as="p" size={600} weight="semibold" className="mt-2" style={{ color: 'var(--colorPaletteRedForeground1)' }}>
            R$ 0,00
          </Text>
        </div>
      </div>
      <Text className="mt-8 block" size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
        Os dados do dashboard serão implementados na Fase 3.
      </Text>
    </div>
  )
}
