import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { NewTransactionSheet } from '../components/NewTransactionSheet'

interface NewTransactionContextValue {
  open: () => void
}

const NewTransactionContext = createContext<NewTransactionContextValue | null>(null)

/** Disponibiliza o formulário de nova transação para qualquer tela dentro do layout. */
export function NewTransactionProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const open = useCallback(() => setIsOpen(true), [])
  const value = useMemo(() => ({ open }), [open])

  return (
    <NewTransactionContext.Provider value={value}>
      {children}
      <NewTransactionSheet open={isOpen} onOpenChange={setIsOpen} />
    </NewTransactionContext.Provider>
  )
}

export function useNewTransaction() {
  const ctx = useContext(NewTransactionContext)
  if (!ctx) throw new Error('useNewTransaction deve ser usado dentro de NewTransactionProvider')
  return ctx
}
