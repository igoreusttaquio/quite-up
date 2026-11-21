import { useEffect, useId, useRef } from 'react'

/*
 * Botão/gesto "voltar" fecha diálogos (Android, iOS standalone, navegador).
 *
 * Ao abrir, cada diálogo empilha uma entrada no history (mesma URL, preservando o
 * state do React Router). Um único listener de popstate fecha só o diálogo do topo.
 * Ao fechar por outro meio (X, Esc, overlay, swipe), a entrada dele é consumida com
 * history.back(), e esse popstate "nosso" é ignorado.
 */

type Closer = () => void

const stack: string[] = []
const closers = new Map<string, Closer>()
let ignoredPops = 0
let listening = false

function ensureListener() {
  if (listening || typeof window === 'undefined') return
  listening = true
  window.addEventListener('popstate', () => {
    if (ignoredPops > 0) {
      ignoredPops--
      return
    }
    const top = stack.pop()
    if (top) closers.get(top)?.()
  })
}

function currentDialogId(): string | undefined {
  return (window.history.state as { __dialog?: string } | null)?.__dialog
}

/** Recoloca a entrada do diálogo (ex.: usuário desistiu de descartar alterações após "voltar"). */
export function repushDialogEntry(id: string) {
  stack.push(id)
  window.history.pushState({ ...(window.history.state ?? {}), __dialog: id }, '')
}

/**
 * @param open estado do diálogo
 * @param onBack chamado quando o usuário aperta "voltar" com este diálogo no topo
 * @returns id da entrada (para repushDialogEntry)
 */
export function useDialogHistory(open: boolean, onBack: () => void): string {
  const id = useId()
  const onBackRef = useRef(onBack)
  onBackRef.current = onBack

  useEffect(() => {
    if (!open) return
    ensureListener()
    closers.set(id, () => onBackRef.current())
    repushDialogEntry(id)

    return () => {
      closers.delete(id)
      const idx = stack.lastIndexOf(id)
      if (idx === -1) return // já saiu da pilha via "voltar"
      stack.splice(idx, 1)
      // Só volta se a entrada do diálogo ainda for a atual (se o usuário navegou
      // para outra rota a partir do diálogo, voltar desfaria a navegação).
      if (currentDialogId() === id) {
        ignoredPops++
        window.history.back()
      }
    }
  }, [open, id])

  return id
}
