import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
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
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Bem-vindo de volta</h1>
        <p className="text-gray-500 text-sm mt-1">Entre para gerenciar suas finanças</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Email</label>
        <Input
          fullWidth
          type="email"
          placeholder="seu@email.com"
          {...register('email')}
          className={errors.email ? 'border-red-500' : ''}
        />
        {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Senha</label>
        <Input
          fullWidth
          type="password"
          placeholder="Sua senha"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
        <div className="text-right mt-1">
          <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
            Esqueceu a senha?
          </Link>
        </div>
      </div>

      <Button
        type="submit"
        fullWidth
        variant="primary"
        isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
      >
        Entrar
      </Button>

      <p className="text-center text-sm text-gray-500">
        Não tem conta?{' '}
        <Link to="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Cadastre-se
        </Link>
      </p>
    </form>
  )
}
