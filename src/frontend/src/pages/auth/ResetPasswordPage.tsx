import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import { authApi } from '../../api/auth'

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [done, setDone] = useState(false)
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.resetPassword({ ...d, token: token! }),
    onSuccess: () => setDone(true),
    onError: () => setError('root', { message: 'Token inválido ou expirado' }),
  })

  if (!token) return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-200">
        <span className="text-4xl">❌</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Link inválido</h1>
      <p className="text-gray-500">Este link de redefinição é inválido ou expirou.</p>
      <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
        Solicitar novo link
      </Link>
    </div>
  )

  if (done) return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
        <span className="text-4xl">✅</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Senha redefinida!</h1>
      <p className="text-gray-500">Sua senha foi alterada com sucesso.</p>
      <Link to="/login">
        <Button
          fullWidth
          color="primary"
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
        >
          Ir para o login
        </Button>
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Nova senha</h1>
        <p className="text-gray-500 text-sm mt-1">Escolha uma senha segura para sua conta</p>
      </div>

      {errors.root && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </div>
      )}

      <Input
        label="Nova senha"
        type="password"
        placeholder="Mínimo 8 caracteres"
        {...register('password')}
        isInvalid={!!errors.password}
        errorMessage={errors.password?.message}
      />
      <Input
        label="Confirmar senha"
        type="password"
        placeholder="Repita a nova senha"
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
        Redefinir senha
      </Button>
    </form>
  )
}
