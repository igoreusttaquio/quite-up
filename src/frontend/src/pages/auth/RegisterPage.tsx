import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import { authApi } from '../../api/auth'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string()
    .min(8, 'Mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Deve conter 1 letra maiúscula')
    .regex(/[a-z]/, 'Deve conter 1 minúscula')
    .regex(/[0-9]/, 'Deve conter 1 número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => navigate('/verify-email'),
    onError: () => setError('root', { message: 'Erro ao criar conta. Tente novamente.' }),
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Criar sua conta</h1>
        <p className="text-gray-500 text-sm mt-1">Comece a organizar suas finanças hoje</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </div>
      )}

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Nome completo</label>
        <Input
          fullWidth
          type="text"
          placeholder="Seu nome"
          {...register('name')}
          className={errors.name ? 'border-red-500' : ''}
        />
        {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
      </div>

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
          placeholder="Mínimo 8 caracteres"
          {...register('password')}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-gray-700">Confirmar senha</label>
        <Input
          fullWidth
          type="password"
          placeholder="Repita a senha"
          {...register('confirmPassword')}
          className={errors.confirmPassword ? 'border-red-500' : ''}
        />
        {errors.confirmPassword && <p className="text-red-500 text-xs">{errors.confirmPassword.message}</p>}
      </div>

      <Button
        type="submit"
        fullWidth
        variant="primary"
        isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
      >
        Criar conta
      </Button>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
          Entrar
        </Link>
      </p>
    </form>
  )
}
