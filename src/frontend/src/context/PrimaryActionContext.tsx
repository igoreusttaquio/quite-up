import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

/*
 * Ação principal contextual da página (ex.: "Nova Dívida" em Dívidas).
 * No celular ela é executada pelo "+" central da barra inferior; sem ação registrada,
 * o "+" abre "Nova transação".
 */

export interface PrimaryAction {
  label: string
  onClick: () => void
}

interface PrimaryActionContextValue {
  action: PrimaryAction | null
  setAction: (action: PrimaryAction | null) => void
}

const PrimaryActionContext = createContext<PrimaryActionContextValue | null>(null)

export function PrimaryActionProvider({ children }: { children: ReactNode }) {
  const [action, setAction] = useState<PrimaryAction | null>(null)
  const value = useMemo(() => ({ action, setAction }), [action])
  return <PrimaryActionContext.Provider value={value}>{children}</PrimaryActionContext.Provider>
}

/** Ação registrada pela página atual (ou null). */
export function useCurrentPrimaryAction() {
  return useContext(PrimaryActionContext)?.action ?? null
}

/** Registra a ação principal da página enquanto ela estiver montada. */
export function useRegisterPrimaryAction(action: PrimaryAction | undefined) {
  const ctx = useContext(PrimaryActionContext)
  // onClick muda a cada render: guarda a versão mais recente sem re-registrar.
  const onClickRef = useRef(action?.onClick)
  onClickRef.current = action?.onClick
  const label = action?.label
  const setAction = ctx?.setAction

  useEffect(() => {
    if (!setAction || !label) return
    setAction({ label, onClick: () => onClickRef.current?.() })
    return () => setAction(null)
  }, [setAction, label])
}
