import { useTheme } from '../../context/ThemeContext'

// Paleta da logo (mesma usada nos tokens de tema em styles/index.css).
export const CHART_PALETTE = {
  purple: '#61459C',
  purpleDark: '#442781',
  lilac: '#A992DB',
  orange: '#FF7917',
} as const

// Variações dentro da paleta da logo para séries categóricas (donut/barras).
export const CATEGORY_COLORS = [
  CHART_PALETTE.purple,
  CHART_PALETTE.orange,
  CHART_PALETTE.lilac,
  CHART_PALETTE.purpleDark,
  '#8E6FC7',
  '#FF9E4A',
  '#C4B0E8',
  '#2E1A5C',
  '#B35A00',
  '#6E5AA8',
] as const

export function useChartTheme() {
  const { mode } = useTheme()
  const dark = mode === 'dark'

  return {
    // Semânticas financeiras (receita/despesa)
    income: dark ? '#34d399' : '#16a34a',
    expense: dark ? '#f87171' : '#dc2626',
    // Destaque da marca (linha de saldo)
    primary: dark ? CHART_PALETTE.lilac : CHART_PALETTE.purple,
    lilac: CHART_PALETTE.lilac,
    orange: CHART_PALETTE.orange,
    // Grade/eixos adaptados ao modo
    grid: dark ? '#334155' : '#e2e8f0',
    tick: dark ? '#94a3b8' : '#64748b',
  }
}
