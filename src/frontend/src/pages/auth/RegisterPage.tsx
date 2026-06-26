import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'

const schema = z
  .object({
    name: z.string().min(2, 'Mínimo 2 caracteres').max(100, 'Máximo 100 caracteres'),
    email: z.string().email('Email inválido'),
    password: z
      .string()
      .min(8, 'Mínimo 8 caracteres')
      .regex(/[A-Z]/, 'Deve conter 1 letra maiúscula')
      .regex(/[a-z]/, 'Deve conter 1 letra minúscula')
      .regex(/[0-9]/, 'Deve conter 1 número'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Senhas não conferem',
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate('/verify-email', { state: { email: 'Seu email' } })
    },
    onError: () => {
      setError('root', { message: 'Email ou senha inválidos' })
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <h1 className="text-2xl font-bold text-center text-gray-900">Criar conta</h1>

      {errors.root && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">
          {errors.root.message}
        </div>
      )}

      {[
        { label: 'Nome completo', key: 'name', type: 'text' },
        { label: 'Email', key: 'email', type: 'email' },
        { label: 'Senha', key: 'password', type: 'password' },
        { label: 'Confirmar senha', key: 'confirmPassword', type: 'password' },
      ].map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {field.label}
          </label>
          <input
            type={field.type}
            className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-colors outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${
              errors[field.key as keyof FormData]
                ? 'border-red-400 bg-red-50'
                : 'border-gray-300'
            }`}
            {...register(field.key as keyof FormData)}
          />
          {errors[field.key as keyof FormData] && (
            <p className="text-red-500 text-xs mt-1">
              {errors[field.key as keyof FormData]?.message}
            </p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={mutation.isPending}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? 'Cadastrando...' : 'Cadastrar'}
      </button>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline font-medium">
          Entrar
        </Link>
      </p>
    </form>
  )
}
