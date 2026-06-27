import { useEffect, type ReactNode } from 'react'
import { Button, Text } from '@fluentui/react-components'
import { DismissRegular } from '@fluentui/react-icons'
import { motion, AnimatePresence } from 'framer-motion'

interface SlidePanelProps {
  open: boolean
  title: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export function SlidePanel({ open, title, children, onClose, footer }: SlidePanelProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
          className="fixed top-0 right-0 h-full w-full max-w-md z-50 flex flex-col bg-surface border-l border-subtle shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-subtle flex-shrink-0">
            <Text size={500} weight="semibold">{title}</Text>
            <Button appearance="subtle" icon={<DismissRegular />} onClick={onClose} size="small" />
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-5">
            {children}
          </div>

          {/* Footer */}
          {footer && (
            <div className="flex-shrink-0 px-5 py-4 border-t border-subtle">
              {footer}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
