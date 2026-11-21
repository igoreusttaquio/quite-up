import { useEffect, useRef, useState, type DragEvent, type ReactNode } from 'react'
import {
  ArrowRight,
  Copy,
  Download,
  Eye,
  FileText,
  HandCoins,
  Loader2,
  Paperclip,
  Pencil,
  Repeat,
  Share2,
  Trash2,
} from 'lucide-react'
import { ResponsiveDialog, DialogActions, ConfirmDialog } from '../ui/responsive-dialog'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { IconBadge } from '../IconBadge'
import { TransactionTypeIcon } from '../TransactionTypeIcon'
import { CategoryIcon } from '../../lib/category-icon'
import { accountTypeVisual } from '../../lib/entity-icons'
import { formatBRL, transactionTypeLabels } from '../../lib/transactions'
import { cn, toDateParam } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { useAttachmentBlob } from '../../hooks/useAttachmentBlob'
import { isTempTransactionId } from '../../lib/offline'
import { PendingSyncBadge } from '../PendingSyncBadge'
import type { Account, Category, Transaction, TransactionType } from '../../types'

const typeBadge: Record<TransactionType, 'expense' | 'income' | 'secondary'> = {
  Expense: 'expense',
  Income: 'income',
  Transfer: 'secondary',
}

const fullDate = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
const createdAtFormat = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const createdAtTime = new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit' })

/** "Ontem · sex, 20 de nov de 2026" */
function describeDate(date: string) {
  const d = new Date(date + 'T12:00:00')
  const today = new Date()
  const diff = Math.round((new Date(toDateParam(today) + 'T12:00:00').getTime() - d.getTime()) / 86_400_000)
  const relative =
    diff === 0 ? 'Hoje' : diff === 1 ? 'Ontem' : diff === -1 ? 'Amanhã' : diff > 1 && diff < 7 ? `Há ${diff} dias` : null
  const full = fullDate.format(d).replace(/\./g, '')
  return relative ? `${relative} · ${full}` : full.charAt(0).toUpperCase() + full.slice(1)
}

function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null
  return !!el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))
}

interface TransactionDetailDialogProps {
  transaction: Transaction | null
  category?: Category
  accounts: Account[]
  /** Valor com sinal do ponto de vista da conta filtrada (transferências). */
  signedAmount: (t: Transaction) => number
  onOpenChange: (open: boolean) => void
  onEdit: (t: Transaction) => void
  onDuplicate: (t: Transaction) => void
  /** Repetir rápido: só valor e data. */
  onRepeat: (t: Transaction) => void
  onDelete: (t: Transaction) => void
  onUploadAttachment: (t: Transaction, file: File) => Promise<unknown>
  onRemoveAttachment: (t: Transaction) => Promise<unknown>
  onViewAttachment: (t: Transaction) => void
  uploading?: boolean
  /** Há alterações desta transação aguardando sincronização (feitas offline). */
  pendingSync?: boolean
}

export function TransactionDetailDialog({
  transaction: tx,
  category,
  accounts,
  signedAmount,
  onOpenChange,
  onEdit,
  onDuplicate,
  onRepeat,
  onDelete,
  onUploadAttachment,
  onRemoveAttachment,
  onViewAttachment,
  uploading,
  pendingSync,
}: TransactionDetailDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const open = !!tx

  // Atalhos no desktop: E edita, D duplica, Delete exclui (com confirmação).
  useEffect(() => {
    if (!open || !isDesktop || !tx) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return
      // Só quando este é o único diálogo aberto (nada empilhado por cima).
      if (document.querySelectorAll('[role="dialog"]').length !== 1) return
      const key = e.key.toLowerCase()
      const temp = isTempTransactionId(tx.id)
      if (key === 'e' && !temp) {
        e.preventDefault()
        onEdit(tx)
      } else if (key === 'd') {
        e.preventDefault()
        onDuplicate(tx)
      } else if (key === 'r') {
        e.preventDefault()
        onRepeat(tx)
      } else if (e.key === 'Delete' && !temp) {
        e.preventDefault()
        setConfirmDelete(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, isDesktop, tx, onEdit, onDuplicate, onRepeat])

  if (!tx) {
    return <ResponsiveDialog open={false} onOpenChange={onOpenChange} title="" />
  }

  const isTransfer = tx.type === 'Transfer'
  // Criada offline e ainda sem id no servidor: só dá para duplicar até sincronizar.
  const notSynced = isTempTransactionId(tx.id)
  const amount = signedAmount(tx)
  const title = tx.description || category?.name || transactionTypeLabels[tx.type]
  const account = accounts.find((a) => a.id === tx.accountId)
  const destination = accounts.find((a) => a.id === tx.destinationAccountId)
  const createdAt = new Date(tx.createdAt)
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const share = () => {
    navigator
      .share({
        title,
        text: `${transactionTypeLabels[tx.type]}: ${title} — ${formatBRL(tx.amount)} (${describeDate(tx.date)})`,
      })
      .catch(() => {})
  }

  return (
    <>
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        description={`${transactionTypeLabels[tx.type]} de ${formatBRL(tx.amount)}`}
        hideTitle
        size="md"
        headerAside={
          <>
            <Badge variant={typeBadge[tx.type]}>{transactionTypeLabels[tx.type]}</Badge>
            {canShare && !isDesktop && (
              <Button variant="ghost" size="icon-sm" onClick={share} aria-label="Compartilhar">
                <Share2 size={16} />
              </Button>
            )}
          </>
        }
        footer={
          <DialogActions
            primary={
              <Button onClick={() => onEdit(tx)} icon={<Pencil size={14} />} disabled={notSynced}>
                Editar
              </Button>
            }
            secondary={
              <div className="flex flex-col gap-2 md:flex-row">
                <Button variant="outline" onClick={() => onRepeat(tx)} icon={<Repeat size={14} />} className="w-full md:w-auto">
                  Repetir
                </Button>
                <Button variant="outline" onClick={() => onDuplicate(tx)} icon={<Copy size={14} />} className="w-full md:w-auto">
                  Duplicar
                </Button>
              </div>
            }
            destructive={
              <Button
                variant="ghost"
                onClick={() => setConfirmDelete(true)}
                disabled={notSynced}
                icon={<Trash2 size={14} />}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              >
                Excluir
              </Button>
            }
          />
        }
      >
        {/* Cabeçalho: o valor é o protagonista */}
        <div className="flex items-start gap-3">
          {isTransfer || !category ? (
            <div className="[&>div]:h-12 [&>div]:w-12 [&_svg]:h-6 [&_svg]:w-6">
              <TransactionTypeIcon type={tx.type} />
            </div>
          ) : (
            <IconBadge color={category.color || 'var(--muted-foreground)'} size="lg" className="h-12 w-12 rounded-2xl" strong>
              <CategoryIcon icon={category.icon} size={24} />
            </IconBadge>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-semibold leading-tight">{title}</p>
            <p
              className={cn(
                'mt-1 text-[1.625rem] font-bold leading-none tabular-nums',
                isTransfer && amount === tx.amount ? 'text-foreground' : amount < 0 ? 'text-expense' : 'text-income'
              )}
            >
              {amount < 0 ? '-' : isTransfer && amount === tx.amount ? '' : '+'}
              {formatBRL(Math.abs(amount))}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground">{describeDate(tx.date)}</p>
            {(pendingSync || notSynced) && <PendingSyncBadge className="mt-2" />}
          </div>
        </div>

        {/* Detalhes: só o que existe */}
        <dl className="divide-y divide-border rounded-xl border border-border">
          {isTransfer ? (
            <DetailRow label="Transferência">
              <span className="flex min-w-0 items-center gap-1.5">
                <AccountName account={account} fallback={tx.accountName} />
                <ArrowRight size={14} className="flex-shrink-0 text-muted-foreground" />
                <AccountName account={destination} fallback={tx.destinationAccountName} />
              </span>
            </DetailRow>
          ) : (
            <DetailRow label="Conta">
              <AccountName account={account} fallback={tx.accountName} />
            </DetailRow>
          )}
          {!isTransfer && category && (
            <DetailRow label="Categoria">
              {/* Cor só no ícone/fundo: texto na cor normal mantém contraste (ex.: amarelo no tema claro). */}
              <span
                className="inline-flex max-w-full items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium text-foreground"
                style={{ backgroundColor: `color-mix(in oklch, ${category.color} 18%, transparent)` }}
              >
                <CategoryIcon icon={category.icon} size={13} color={category.color} />
                <span className="truncate">{category.name}</span>
              </span>
            </DetailRow>
          )}
          {tx.debtName && (
            <DetailRow label="Dívida">
              <span className="flex min-w-0 items-center gap-1.5">
                <HandCoins size={14} className="flex-shrink-0 text-muted-foreground" />
                <span className="truncate">{tx.debtName}</span>
              </span>
            </DetailRow>
          )}
        </dl>

        {notSynced ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-4 text-center text-sm text-muted-foreground">
            O comprovante poderá ser anexado depois que esta transação sincronizar.
          </p>
        ) : (
          <AttachmentSection
            transaction={tx}
            uploading={!!uploading}
            onUpload={(file) => onUploadAttachment(tx, file)}
            onRemove={() => onRemoveAttachment(tx)}
            onView={() => onViewAttachment(tx)}
          />
        )}

        <p className="text-center text-xs text-muted-foreground">
          Criada em {createdAtFormat.format(createdAt)} às {createdAtTime.format(createdAt)}
        </p>
      </ResponsiveDialog>

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title={`Excluir “${title}” de ${formatBRL(tx.amount)}?`}
        message="Você poderá desfazer logo em seguida."
        confirmText="Excluir"
        destructive
        onConfirm={() => {
          setConfirmDelete(false)
          navigator.vibrate?.(10)
          onDelete(tx)
        }}
      />
    </>
  )
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-3.5 py-2.5 text-sm">
      <dt className="flex-shrink-0 text-muted-foreground">{label}</dt>
      <dd className="flex min-w-0 justify-end font-medium">{children}</dd>
    </div>
  )
}

function AccountName({ account, fallback }: { account?: Account; fallback?: string }) {
  const visual = account ? accountTypeVisual[account.type] : undefined
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {visual && <visual.Icon size={14} className="flex-shrink-0" style={{ color: visual.color }} />}
      <span className="truncate">{account?.name ?? fallback ?? '—'}</span>
    </span>
  )
}

function AttachmentSection({
  transaction: tx,
  uploading,
  onUpload,
  onRemove,
  onView,
}: {
  transaction: Transaction
  uploading: boolean
  onUpload: (file: File) => Promise<unknown>
  onRemove: () => Promise<unknown>
  onView: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [preparing, setPreparing] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const busy = uploading || preparing

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') return
    setPreparing(true)
    try {
      await onUpload(file)
    } finally {
      setPreparing(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    void handleFile(e.dataTransfer.files?.[0])
  }

  if (tx.attachmentId) {
    return (
      <>
        <AttachmentPreview
          attachmentId={tx.attachmentId}
          fileName={tx.attachmentFileName ?? 'Comprovante'}
          contentType={tx.attachmentContentType ?? ''}
          fileSize={tx.attachmentFileSize}
          onView={onView}
          onRemove={() => setConfirmRemove(true)}
        />
        <ConfirmDialog
          open={confirmRemove}
          onOpenChange={setConfirmRemove}
          title="Remover comprovante?"
          message={tx.attachmentFileName}
          confirmText="Remover"
          destructive
          onConfirm={() => {
            setConfirmRemove(false)
            void onRemove()
          }}
        />
      </>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        disabled={busy}
        className={cn(
          'flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-5 text-sm transition-colors cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait',
          dragging
            ? 'border-primary bg-brand-light text-primary'
            : 'border-border text-muted-foreground hover:border-primary/60 hover:text-foreground'
        )}
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
        {busy ? 'Enviando comprovante…' : 'Anexar comprovante (PDF ou imagem)'}
      </button>
      {/* Sem `capture`: o celular oferece câmera e galeria. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  )
}

function formatSize(bytes?: number) {
  if (!bytes) return undefined
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function AttachmentPreview({
  attachmentId,
  fileName,
  contentType,
  fileSize,
  onView,
  onRemove,
}: {
  attachmentId: string
  fileName: string
  contentType: string
  fileSize?: number
  onView: () => void
  onRemove: () => void
}) {
  const isImage = contentType.startsWith('image/')
  const { url, isLoading } = useAttachmentBlob(attachmentId)

  const download = () => {
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border p-2.5">
      <button
        type="button"
        onClick={onView}
        aria-label="Ver comprovante"
        className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isImage && url ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : isLoading ? (
          <Loader2 size={18} className="animate-spin text-muted-foreground" />
        ) : (
          <FileText size={22} className="text-muted-foreground" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{fileName}</p>
        <p className="text-xs text-muted-foreground">
          {[contentType === 'application/pdf' ? 'PDF' : isImage ? 'Imagem' : null, formatSize(fileSize)]
            .filter(Boolean)
            .join(' · ')}
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-0.5">
        <Button variant="ghost" size="icon-sm" onClick={onView} aria-label="Ver comprovante" title="Ver">
          <Eye size={16} />
        </Button>
        <Button variant="ghost" size="icon-sm" onClick={download} disabled={!url} aria-label="Baixar comprovante" title="Baixar">
          <Download size={16} />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          aria-label="Remover comprovante"
          title="Remover"
          className="text-destructive/80 hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </div>
    </div>
  )
}
