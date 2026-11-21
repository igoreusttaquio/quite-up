import type { Debt, DebtType, InterestPeriod } from '../types'
import { toDateParam } from './utils'

export const debtTypeLabels: Record<DebtType, string> = {
  Loan: 'Empréstimo',
  Financing: 'Financiamento',
  CreditCard: 'Cartão de crédito',
  Overdraft: 'Cheque especial',
  Personal: 'Pessoal',
  Other: 'Outro',
}

export const interestPeriodShort: Record<InterestPeriod, string> = {
  Monthly: 'a.m.',
  Yearly: 'a.a.',
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
export const formatBRL = (n: number) => brl.format(n)

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

const parseDate = (iso: string) => new Date(iso + 'T12:00:00')

/** "out/2027" */
export function formatMonthYear(iso: string) {
  const d = parseDate(iso)
  return `${MONTHS[d.getMonth()]}/${d.getFullYear()}`
}

/** "10/12" */
export function formatDayMonth(iso: string) {
  const d = parseDate(iso)
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
}

export const formatDate = (iso: string) => parseDate(iso).toLocaleDateString('pt-BR')

/** Percentual em pt-BR, sem zeros à toa: 1.98 → "1,98"; 2 → "2". */
export function formatPercent(n: number | null | undefined) {
  if (n == null) return ''
  return n.toLocaleString('pt-BR', { maximumFractionDigits: 4 })
}

/** Aceita "1,98" ou "1.98". Vazio → null. */
export function parsePercent(text: string): number | null {
  const clean = text.trim().replace(/\s|%/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.')
  if (!clean) return null
  const n = Number(clean)
  return Number.isFinite(n) ? n : null
}

/** Dia `day` no mês de (year, month0); se o mês não tem o dia, o último dia do mês. */
export function onDay(year: number, month0: number, day: number) {
  const last = new Date(year, month0 + 1, 0).getDate()
  return new Date(year, month0, Math.min(Math.max(day, 1), last))
}

/** Vencimento da parcela `n` (1-based) — mesma regra do backend. */
export function installmentDueDate(firstIso: string, dueDay: number, n: number) {
  const first = parseDate(firstIso)
  return toDateParam(onDay(first.getFullYear(), first.getMonth() + n - 1, dueDay))
}

/** Padrão da 1ª parcela: próximo mês, no dia de vencimento. */
export function defaultFirstInstallment(dueDay: number, from = new Date()) {
  return toDateParam(onDay(from.getFullYear(), from.getMonth() + 1, dueDay))
}

export type StatusTone = 'expense' | 'warning' | 'income' | 'neutral'

/** Texto e tom do status da dívida (vindo da API: parcela em atraso real). */
export function debtStatus(debt: Debt): { label: string; tone: StatusTone } {
  const days = debt.statusDays ?? 0
  const plural = (n: number) => (n === 1 ? 'dia' : 'dias')
  switch (debt.status) {
    case 'paid':
      return { label: 'Quitada', tone: 'income' }
    case 'overdue':
      return { label: `Vencida há ${days} ${plural(days)}`, tone: 'expense' }
    case 'dueSoon':
      return { label: days === 0 ? 'Vence hoje' : `Vence em ${days} ${plural(days)}`, tone: 'warning' }
    default:
      return { label: 'Em dia', tone: 'neutral' }
  }
}
