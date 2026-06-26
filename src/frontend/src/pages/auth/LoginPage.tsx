import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
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
    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
        <p className="text-gray-500 text-sm mt-1">Entre para gerenciar suas finanças</p>
      </div>
      {errors.root && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </motion.div>
      )}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <Input type="email" placeholder="seu@email.com" {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Senha</label>
        <Input type="password" placeholder="Sua senha" {...register('password')} />
        {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
      </div>
      <div className="text-right">
        <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Esqueceu a senha?</Link>
      </div>
      <Button type="submit" variant="primary" fullWidth isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 border-0">
        {mutation.isPending ? 'Entrando...' : 'Entrar'}
      </Button>
      <p className="text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Cadastre-se</Link>
      </p>
    </motion.form>
  )
}
