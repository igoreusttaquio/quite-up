import { Outlet } from 'react-router-dom'
import { Text } from '@fluentui/react-components'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Text as="h1" size={900} weight="bold" className="text-brand">
            Quite-Up
          </Text>
          <Text size={300} className="text-muted mt-1 block">
            Gerencie suas finanças com clareza
          </Text>
        </div>

        <div className="bg-surface rounded-2xl shadow-xl border border-subtle p-8">
          <Outlet />
        </div>
      </motion.div>
    </div>
  )
}
