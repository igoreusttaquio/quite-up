import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { NewTransactionSheet, type NewTransactionPrefill } from '../components/NewTransactionSheet'

interface NewTransactionContextValue {
  /** Abre o formulário; com `prefill`, já preenchido (ex.: duplicar), sempre com a data de hoje. */
  open: (prefill?: NewTransactionPrefill) => void
}

const NewTransactionContext = createContext<NewTransactionContextValue | null>(null)

/** Disponibiliza o formulário de nova transação para qualquer tela dentro do layout. */
export function NewTransactionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [prefill, setPrefill] = useState<NewTransactionPrefill | undefined>()

  const open = useCallback((values?: NewTransactionPrefill) => {
    setPrefill(values)
    setIsOpen(true)
  }, [])
  const value = useMemo(() => ({ open }), [open])

  return (
    <NewTransactionContext.Provider value={value}>
      {children}
      <NewTransactionSheet open={isOpen} onOpenChange={setIsOpen} prefill={prefill} />
    </NewTransactionContext.Provider>
  )
}

export function useNewTransaction() {
  const ctx = useContext(NewTransactionContext)
  if (!ctx) throw new Error('useNewTransaction deve ser usado dentro de NewTransactionProvider')
  return ctx
}
