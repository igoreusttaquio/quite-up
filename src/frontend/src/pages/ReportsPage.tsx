import { useState } from 'react'
import { BarChart3, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { usePeriodReport, useEvolutionReport } from '../hooks/useReports'
import { PageHeader } from '../components/PageHeader'
import { SkeletonLine, SkeletonTable } from '../components/Skeleton'
import { CurrencyBadge } from '../components/CurrencyBadge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { NativeSelect } from '../components/ui/native-select'
const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function firstDayOfMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function ReportsPage() {
  const [startDate, setStartDate] = useState(firstDayOfMonth)
  const [endDate, setEndDate] = useState(today)
  const [queryStartDate, setQueryStartDate] = useState(startDate)
  const [queryEndDate, setQueryEndDate] = useState(endDate)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  const { data: periodReport, isLoading: loadingPeriod } = usePeriodReport(queryStartDate, queryEndDate)
  const { data: evolutionReport, isLoading: loadingEvolution } = useEvolutionReport(selectedYear)

  const handleGeneratePeriod = () => {
    setQueryStartDate(startDate)
    setQueryEndDate(endDate)
  }

  return (
    <div>
      <PageHeader
        title="Relatórios"
      />

      <div className="space-y-8">
        {/* Period Report */}
        <section className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Relatório por Período</h2>

          <div className="flex flex-wrap items-end gap-4">
            <div className="w-44">
              <Field label="Data Início">
                <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </Field>
            </div>
            <div className="w-44">
              <Field label="Data Fim">
                <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </Field>
            </div>
            <Button onClick={handleGeneratePeriod} icon={<BarChart3 size={16} />}>
              Gerar Relatório
            </Button>
          </div>

          {loadingPeriod ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <SkeletonLine className="h-4 w-1/2" />
                    <SkeletonLine className="h-7 w-2/3" />
                  </div>
                ))}
              </div>
              <SkeletonTable rows={4} />
            </div>
          ) : periodReport ? (
            <>
              {/* Summary cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-income/10 border border-income/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp size={16} className="text-income" />
                    <span className="text-sm text-muted-foreground">Receitas</span>
                  </div>
                  <CurrencyBadge value={periodReport.totalIncome} size="lg" />
                </div>
                <div className="p-4 rounded-lg bg-expense/10 border border-expense/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingDown size={16} className="text-expense" />
                    <span className="text-sm text-muted-foreground">Despesas</span>
                  </div>
                  <CurrencyBadge value={periodReport.totalExpenses} size="lg" />
                </div>
                <div className={`p-4 rounded-lg border ${
                  periodReport.netBalance >= 0
                    ? 'bg-income/10 border-income/20'
                    : 'bg-expense/10 border-expense/20'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={16} className={periodReport.netBalance >= 0 ? 'text-income' : 'text-expense'} />
                    <span className="text-sm text-muted-foreground">Saldo</span>
                  </div>
                  <CurrencyBadge value={periodReport.netBalance} size="lg" />
                </div>
              </div>

              {/* Expenses by category */}
              {periodReport.expensesByCategory.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Despesas por Categoria</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Categoria</th>
                          <th className="text-right py-2 px-4 font-medium text-muted-foreground">Valor</th>
                          <th className="text-center py-2 px-4 font-medium text-muted-foreground">Qtd</th>
                          <th className="text-right py-2 pl-4 font-medium text-muted-foreground">%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {periodReport.expensesByCategory.map((cat) => (
                          <tr key={cat.categoryId} className="border-b border-border/50">
                            <td className="py-3 pr-4">{cat.categoryName}</td>
                            <td className="py-3 px-4 text-right">
                              <CurrencyBadge value={cat.totalAmount} size="sm" />
                            </td>
                            <td className="py-3 px-4 text-center text-muted-foreground">{cat.transactionCount}</td>
                            <td className="py-3 pl-4">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-24 h-2 rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-expense"
                                    style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium w-10 text-right">{cat.percentage.toFixed(1)}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Selecione um período e clique em "Gerar Relatório" para visualizar os dados.
            </p>
          )}
        </section>

        {/* Evolution Report */}
        <section className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold">Evolução Anual</h2>

          <div className="w-44">
            <Field label="Ano">
              <NativeSelect value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}>
                {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          {loadingEvolution ? (
            <SkeletonTable rows={12} />
          ) : evolutionReport && evolutionReport.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 font-medium text-muted-foreground">Mês</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Receitas</th>
                    <th className="text-right py-2 px-4 font-medium text-muted-foreground">Despesas</th>
                    <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {evolutionReport.map((item) => (
                    <tr key={item.month} className="border-b border-border/50">
                      <td className="py-3 pr-4 font-medium">{MONTHS[item.month - 1]}</td>
                      <td className="py-3 px-4 text-right">
                        <CurrencyBadge value={item.income} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <CurrencyBadge value={item.expenses} size="sm" />
                      </td>
                      <td className="py-3 pl-4 text-right">
                        <span className={`font-semibold tabular-nums ${
                          item.netBalance >= 0 ? 'text-income' : 'text-expense'
                        }`}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.netBalance)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum dado disponível para o ano selecionado.
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
