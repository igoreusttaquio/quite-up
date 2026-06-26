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

      <Input
        label="Nome completo"
        type="text"
        placeholder="Seu nome"
        {...register('name')}
        isInvalid={!!errors.name}
        errorMessage={errors.name?.message}
      />
      <Input
        label="Email"
        type="email"
        placeholder="seu@email.com"
        {...register('email')}
        isInvalid={!!errors.email}
        errorMessage={errors.email?.message}
      />
      <Input
        label="Senha"
        type="password"
        placeholder="Mínimo 8 caracteres"
        {...register('password')}
        isInvalid={!!errors.password}
        errorMessage={errors.password?.message}
      />
      <Input
        label="Confirmar senha"
        type="password"
        placeholder="Repita a senha"
        {...register('confirmPassword')}
        isInvalid={!!errors.confirmPassword}
        errorMessage={errors.confirmPassword?.message}
      />

      <Button
        type="submit"
        fullWidth
        color="primary"
        isLoading={mutation.isPending}
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
