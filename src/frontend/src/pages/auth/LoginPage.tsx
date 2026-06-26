import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useAuthStore } from '../../stores/auth'

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha obrigatória'),
})
type FormData = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => { setUser(data.user); navigate('/', { replace: true }) },
    onError: () => setError('root', { message: 'Email ou senha inválidos' }),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <h1 className="text-2xl font-bold text-center text-gray-900">Entrar</h1>
      {errors.root && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{errors.root.message}</div>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
        <input type="password" className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} {...register('password')} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div className="text-right"><Link to="/forgot-password" className="text-sm text-indigo-600 hover:underline">Esqueceu a senha?</Link></div>
      <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
        {mutation.isPending ? 'Entrando...' : 'Entrar'}
      </button>
      <p className="text-center text-sm text-gray-500">Não tem conta? <Link to="/register" className="text-indigo-600 hover:underline font-medium">Cadastre-se</Link></p>
    </form>
  )
}
