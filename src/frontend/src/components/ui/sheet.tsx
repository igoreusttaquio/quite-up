import { forwardRef } from 'react'
import { Drawer } from 'vaul'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
  direction?: 'left' | 'right' | 'top' | 'bottom'
}

function Sheet({ open, onOpenChange, children, direction = 'right' }: SheetProps) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={direction}>
      {children}
    </Drawer.Root>
  )
}

const SheetTrigger = Drawer.Trigger
const SheetClose = Drawer.Close

function SheetPortal({ children }: { children: React.ReactNode }) {
  return <Drawer.Portal>{children}</Drawer.Portal>
}

const SheetOverlay = forwardRef<
  React.ElementRef<typeof Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
>(({ className, ...props }, ref) => (
  <Drawer.Overlay
    ref={ref}
    className={cn('fixed inset-0 z-50 bg-black/50 backdrop-blur-sm', className)}
    {...props}
  />
))
SheetOverlay.displayName = 'SheetOverlay'

interface SheetContentProps extends React.ComponentPropsWithoutRef<typeof Drawer.Content> {
  side?: 'left' | 'right' | 'top' | 'bottom'
  showClose?: boolean
}

const SheetContent = forwardRef<React.ElementRef<typeof Drawer.Content>, SheetContentProps>(
  ({ className, children, side = 'right', showClose = true, ...props }, ref) => (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        ref={ref}
        className={cn(
          'fixed z-50 flex flex-col bg-card shadow-xl',
          side === 'right' && 'inset-y-0 right-0 h-full w-full max-w-sm border-l border-border',
          side === 'left' && 'inset-y-0 left-0 h-full w-full max-w-sm border-r border-border',
          side === 'top' && 'inset-x-0 top-0 border-b border-border',
          side === 'bottom' && 'inset-x-0 bottom-0 border-t border-border',
          className
        )}
        {...props}
      >
        {showClose && (
          <Drawer.Close className="absolute right-4 top-4 z-10 rounded-sm opacity-60 hover:opacity-100 transition-opacity focus:outline-none focus:ring-2 focus:ring-ring">
            <X className="h-4 w-4" />
            <span className="sr-only">Fechar</span>
          </Drawer.Close>
        )}
        {children}
      </Drawer.Content>
    </SheetPortal>
  )
)
SheetContent.displayName = 'SheetContent'

function SheetHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center justify-between px-5 py-4 border-b border-border', className)}
      {...props}
    />
  )
}

function SheetBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1 overflow-y-auto p-5', className)} {...props} />
}

function SheetFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}

const SheetTitle = forwardRef<
  React.ElementRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ className, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn('text-lg font-semibold text-foreground', className)}
    {...props}
  />
))
SheetTitle.displayName = 'SheetTitle'

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetPortal,
  SheetOverlay,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
}
