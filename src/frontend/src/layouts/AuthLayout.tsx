import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'

export function AuthLayout() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full min-w-0 max-w-md"
      >
        <div className="text-center mb-8">
          <img src="/favicon.svg" alt="Quite-Up" className="mx-auto h-16 w-16 mb-3" />
          <h1 className="text-4xl font-bold text-primary tracking-tight">Quite-Up</h1>
          <p className="text-sm text-muted-foreground mt-1.5">Gerencie suas finanças com clareza</p>
        </div>

        <div className="card p-7 md:p-8">
          <Outlet />
        </div>
      </motion.div>
    </div>
  )
}
