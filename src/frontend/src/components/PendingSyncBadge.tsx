import { CloudUpload } from 'lucide-react'
import { cn } from '../lib/utils'

/** Marca itens com alterações feitas offline que ainda não chegaram ao servidor. */
export function PendingSyncBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'mt-0.5 inline-flex items-center gap-1 rounded-full bg-warning/15 px-1.5 py-px text-[10px] font-medium text-warning',
        className
      )}
    >
      <CloudUpload size={11} aria-hidden />
      Pendente de sincronização
    </span>
  )
}
