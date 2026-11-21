import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { repushDialogEntry, useDialogHistory } from '../../hooks/useDialogHistory'
import { releaseStuckScrollLock } from '../../lib/scroll-lock'
import { Button } from './button'

/*
 * Diálogo único do app.
 * - Desktop (≥768px): modal centralizado (Radix Dialog), largura por `size`.
 * - Mobile (<768px): bottom sheet (vaul) com alça, altura pelo conteúdo, máx. 90dvh.
 * Embutido: Esc, overlay, X, swipe (mobile), "voltar" do Android, foco preso e devolvido
 * ao gatilho, trava de scroll do fundo (inclusive iOS), safe area, teclado virtual,
 * aria-labelledby/aria-describedby a partir de title/description e `confirmOnClose`.
 */

const sizes = {
  sm: 'md:max-w-[400px]',
  md: 'md:max-w-[480px]',
  lg: 'md:max-w-[640px]',
  xl: 'md:max-w-[960px]',
} as const

export type ResponsiveDialogSize = keyof typeof sizes

export interface ResponsiveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  /** Texto de apoio abaixo do título (vira aria-describedby). */
  description?: ReactNode
  /** Esconde título/descrição visualmente, mantendo-os para leitores de tela. */
  hideHeader?: boolean
  /**
   * Esconde só o título/descrição (continuam para leitores de tela); a linha do cabeçalho
   * com `headerAside` e o X permanece. Útil quando o corpo tem seu próprio destaque.
   */
  hideTitle?: boolean
  /** Conteúdo extra na linha do título (ex.: badge), à esquerda do X. */
  headerAside?: ReactNode
  size?: ResponsiveDialogSize
  /** Rodapé fixo (use <DialogActions /> para a ordem padrão dos botões). */
  footer?: ReactNode
  /** Pede "Descartar alterações?" antes de fechar (formulários alterados). */
  confirmOnClose?: boolean
  /** Sem X (ex.: confirmações, que já têm "Cancelar"). */
  hideClose?: boolean
  /** Classe extra no corpo (área com scroll). */
  bodyClassName?: string
  children?: ReactNode
}

export function ResponsiveDialog({
  open,
  onOpenChange,
  title,
  description,
  hideHeader,
  hideTitle,
  headerAside,
  size = 'md',
  footer,
  confirmOnClose = false,
  hideClose = false,
  bodyClassName,
  children,
}: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [discardOpen, setDiscardOpen] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  // Mantém montado só enquanto aberto e durante a animação de saída; depois desmonta,
  // para nenhum sheet/modal fechado ficar invisível no DOM (cobrindo a tela).
  const [mounted, setMounted] = useState(open)
  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    const t = window.setTimeout(() => setMounted(false), 600)
    return () => window.clearTimeout(t)
  }, [open])

  const requestClose = useCallback(
    (fromBack: boolean) => {
      if (confirmOnClose) {
        // "Voltar" já consumiu a entrada do history: recoloca, pois o diálogo continua aberto.
        if (fromBack) repushDialogEntry(historyId)
        setDiscardOpen(true)
        return
      }
      onOpenChange(false)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [confirmOnClose, onOpenChange]
  )

  const historyId = useDialogHistory(open, () => requestClose(true))

  // Rede de segurança: ao fechar o último diálogo, garante que a página voltou a aceitar
  // cliques e rolagem (Radix/vaul às vezes deixam pointer-events/overflow/position presos).
  useEffect(() => {
    if (open) return
    const timer = window.setTimeout(releaseStuckScrollLock, 700)
    return () => window.clearTimeout(timer)
  }, [open])

  const handleOpenChange = (next: boolean) => {
    if (next) onOpenChange(true)
    else requestClose(false)
  }

  // Sem autofoco no X (nem no 1º campo, que abriria o teclado no celular): foca o container.
  const focusContainer = (e: Event) => {
    e.preventDefault()
    contentRef.current?.focus({ preventScroll: true })
  }

  const header = (
    <div
      className={cn(
        'flex flex-shrink-0 items-start gap-3',
        hideHeader && 'sr-only',
        'px-4 pt-4 pb-3 sm:px-5 md:px-6 md:pt-6 md:pb-4'
      )}
    >
      <div className={cn('min-w-0 flex-1', hideTitle && 'sr-only')}>
        <TitleTag isDesktop={isDesktop} className="text-lg font-semibold leading-tight text-foreground">
          {title}
        </TitleTag>
        {description && (
          <DescriptionTag isDesktop={isDesktop} className="mt-1 text-sm text-muted-foreground">
            {description}
          </DescriptionTag>
        )}
      </div>
      {headerAside && (
        <div className={cn('flex flex-shrink-0 items-center gap-2', hideTitle && 'mr-auto')}>{headerAside}</div>
      )}
      {/* Título oculto e sem conteúdo extra: empurra o X para a direita. */}
      {hideTitle && !headerAside && <div className="flex-1" />}
      {!hideClose && <CloseTag isDesktop={isDesktop} />}
    </div>
  )

  const body = (
    <div
      className={cn(
        'min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 sm:px-5 md:px-6',
        footer ? 'pb-4' : 'pb-[max(1rem,env(safe-area-inset-bottom))] md:pb-6',
        bodyClassName
      )}
    >
      {children}
    </div>
  )

  const footerEl = footer ? (
    <div
      className={cn(
        'flex-shrink-0 border-t border-border bg-card px-4 pt-3 sm:px-5 md:px-6 md:py-4',
        'pb-[max(0.75rem,env(safe-area-inset-bottom))]'
      )}
    >
      {footer}
    </div>
  ) : null

  const discard = confirmOnClose ? (
    <ConfirmDialog
      open={discardOpen}
      onOpenChange={setDiscardOpen}
      title="Descartar alterações?"
      message="As alterações feitas neste formulário serão perdidas."
      confirmText="Descartar"
      cancelText="Continuar editando"
      destructive
      onConfirm={() => {
        setDiscardOpen(false)
        onOpenChange(false)
      }}
    />
  ) : null

  if (!open && !mounted) return discard

  if (isDesktop) {
    return (
      <>
        <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
          <DialogPrimitive.Portal>
            <DialogPrimitive.Overlay className="radix-dialog-overlay fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
            <DialogPrimitive.Content
              ref={contentRef}
              tabIndex={-1}
              onOpenAutoFocus={focusContainer}
              className={cn(
                'radix-dialog-content fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col',
                'rounded-xl border border-border bg-card text-card-foreground shadow-xl outline-none',
                sizes[size]
              )}
              {...(!description && { 'aria-describedby': undefined })}
            >
              {header}
              {children != null && body}
              {footerEl}
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
        {discard}
      </>
    )
  }

  return (
    <>
      {/* noBodyStyles: no Safari o vaul fixa o body (position:fixed !important) e, se o sheet
          for desmontado antes de fechar, a página para de rolar. A trava de rolagem já vem do Radix. */}
      <Drawer.Root open={open} onOpenChange={handleOpenChange} repositionInputs noBodyStyles>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/50" />
          <Drawer.Content
            ref={contentRef}
            tabIndex={-1}
            onOpenAutoFocus={focusContainer}
            {...(!description && { 'aria-describedby': undefined })}
            className={cn(
              'fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl border-t border-border',
              'bg-card text-card-foreground shadow-xl outline-none'
            )}
          >
            <Drawer.Handle className="mt-2.5! mb-0! h-1.5! w-10! flex-shrink-0 rounded-full! bg-muted-foreground/30!" />
            {header}
            {children != null && body}
            {footerEl}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
      {discard}
    </>
  )
}

/* Título/descrição/fechar ligados ao primitivo certo (aria-labelledby/describedby automáticos). */
function TitleTag({ isDesktop, className, children }: { isDesktop: boolean; className?: string; children: ReactNode }) {
  return isDesktop ? (
    <DialogPrimitive.Title className={className}>{children}</DialogPrimitive.Title>
  ) : (
    <Drawer.Title className={className}>{children}</Drawer.Title>
  )
}

function DescriptionTag({ isDesktop, className, children }: { isDesktop: boolean; className?: string; children: ReactNode }) {
  return isDesktop ? (
    <DialogPrimitive.Description className={className}>{children}</DialogPrimitive.Description>
  ) : (
    <Drawer.Description className={className}>{children}</Drawer.Description>
  )
}

function CloseTag({ isDesktop }: { isDesktop: boolean }) {
  const Close = isDesktop ? DialogPrimitive.Close : Drawer.Close
  return (
    <Close
      aria-label="Fechar"
      className={cn(
        'relative -mr-1.5 -mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors',
        'hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        'pointer-coarse:after:absolute pointer-coarse:after:-inset-1.5 cursor-pointer'
      )}
    >
      <X size={18} />
    </Close>
  )
}

/**
 * Rodapé padrão.
 * Desktop: [destrutiva] ··· [secundária] [primária]
 * Mobile: largura total, de cima para baixo: primária, secundária, destrutiva.
 */
export function DialogActions({
  primary,
  secondary,
  destructive,
  className,
}: {
  primary?: ReactNode
  secondary?: ReactNode
  destructive?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 [&>*]:w-full md:flex-row md:items-center md:[&>*]:w-auto',
        className
      )}
    >
      {destructive && <div className="order-3 md:order-none md:mr-auto [&>*]:w-full md:[&>*]:w-auto">{destructive}</div>}
      {!destructive && <div className="hidden md:block md:mr-auto" />}
      {secondary && <div className="order-2 md:order-none [&>*]:w-full md:[&>*]:w-auto">{secondary}</div>}
      {primary && <div className="order-1 md:order-none [&>*]:w-full md:[&>*]:w-auto">{primary}</div>}
    </div>
  )
}

/** Confirmação pronta (substitui confirm() nativo e confirmações avulsas). */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  destructive = false,
  loading = false,
  extraActions,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  message?: ReactNode
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  destructive?: boolean
  loading?: boolean
  /** Ações adicionais (ex.: escopo "Só esta" / "Todas"), exibidas antes do confirmar. */
  extraActions?: ReactNode
}) {
  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={(o) => {
        if (!loading) onOpenChange(o)
      }}
      title={title}
      description={message}
      size="sm"
      hideClose
      footer={
        <DialogActions
          primary={
            <div className="flex flex-col gap-2 md:flex-row">
              {extraActions}
              <Button
                variant={destructive ? 'destructive' : 'default'}
                onClick={onConfirm}
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? 'Aguarde…' : confirmText}
              </Button>
            </div>
          }
          secondary={
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelText}
            </Button>
          }
        />
      }
    />
  )
}
