import { useEffect, useRef } from 'react'
import { WifiOff } from 'lucide-react'
import { usePendingSyncCount, useOnline } from '../lib/offline'
import { useAppToast } from '../hooks/useAppToast'

/**
 * Faixa discreta de "Você está offline", logo abaixo do cabeçalho (não cobre a barra
 * inferior). Ao reconectar, avisa que as alterações pendentes foram enviadas.
 */
export function OfflineBanner() {
  const online = useOnline()
  const pending = usePendingSyncCount()
  const toast = useAppToast()
  const pendingWhenOffline = useRef(0)

  useEffect(() => {
    if (!online) {
      pendingWhenOffline.current = Math.max(pendingWhenOffline.current, pending)
      return
    }
    if (pendingWhenOffline.current > 0) {
      const n = pendingWhenOffline.current
      pendingWhenOffline.current = 0
      toast.success('Conexão restabelecida', n === 1 ? 'Sincronizando 1 alteração.' : `Sincronizando ${n} alterações.`)
    }
  }, [online, pending, toast])

  if (online) return null

  return (
    <div
      role="status"
      className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-[9] flex items-center justify-center gap-2 border-b border-warning/30 bg-warning-subtle px-4 py-1.5 text-xs font-medium text-foreground md:top-0"
    >
      <WifiOff size={14} className="flex-shrink-0 text-warning" aria-hidden />
      <span className="truncate">
        Você está offline
        {pending > 0 && ` · ${pending} ${pending === 1 ? 'alteração aguardando' : 'alterações aguardando'} sincronização`}
      </span>
    </div>
  )
}
