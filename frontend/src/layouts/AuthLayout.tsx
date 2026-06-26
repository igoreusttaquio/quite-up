import { Outlet } from 'react-router-dom'
import { Text } from '@fluentui/react-components'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--colorBrandBackground2)] to-[var(--colorNeutralBackground1)] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Text as="h1" size={900} weight="bold" style={{ color: 'var(--colorBrandForeground1)' }}>
            Quite-Up
          </Text>
          <Text size={300} style={{ color: 'var(--colorNeutralForeground2)' }}>
            Gerencie suas finanças e quite suas dívidas
          </Text>
        </div>
        <div
          className="rounded-2xl shadow-xl p-8"
          style={{ backgroundColor: 'var(--colorNeutralBackground1)' }}
        >
          <Outlet />
        </div>
      </motion.div>
    </div>
  )
}
