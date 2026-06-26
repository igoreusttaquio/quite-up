export function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Saldo total', value: 'R$ 0,00', color: 'text-gray-900' },
          { label: 'Receitas do mês', value: 'R$ 0,00', color: 'text-green-600' },
          { label: 'Despesas do mês', value: 'R$ 0,00', color: 'text-red-600' },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <p className="text-gray-500 text-center py-8">
          Conecte-se a uma conta para começar a movimentar.
        </p>
      </div>
    </div>
  )
}
