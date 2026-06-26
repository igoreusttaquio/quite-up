import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@heroui/react'

const stats = [
  { label: 'Saldo total', value: 'R$ 0,00', color: 'from-violet-500 to-indigo-600', icon: '💰' },
  { label: 'Receitas do mês', value: 'R$ 0,00', color: 'from-emerald-400 to-green-500', icon: '📈' },
  { label: 'Despesas do mês', value: 'R$ 0,00', color: 'from-rose-400 to-red-500', icon: '📉' },
]

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

export function DashboardPage() {
  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visão geral das suas finanças</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item}>
            <Card className="overflow-hidden border-0 shadow-xl shadow-gray-200/50 hover:shadow-2xl hover:shadow-gray-300/50 transition-all duration-300 hover:-translate-y-1">
              <div className={`h-2 bg-gradient-to-r ${s.color}`} />
              <CardHeader className="pb-0">
                <span className="text-2xl">{s.icon}</span>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className={`text-3xl font-bold mt-1 bg-gradient-to-r ${s.color} bg-clip-text text-transparent`}>
                  {s.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item}>
        <Card className="border-0 shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Últimas movimentações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <span className="text-5xl">🏦</span>
              <p className="text-gray-400 mt-4">Nenhuma movimentação ainda</p>
              <p className="text-gray-400 text-sm">Crie uma conta e registre suas primeiras transações</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
