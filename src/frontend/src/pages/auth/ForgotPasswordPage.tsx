import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import { authApi } from '../../api/auth'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: (d: FormData) => authApi.forgotPassword(d.email),
    onSuccess: () => setSent(true),
  })

  if (sent) return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
        <span className="text-4xl">📧</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Email enviado</h1>
      <p className="text-gray-500">Se o email existir, você receberá um link para redefinir sua senha.</p>
      <Link to="/login" className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        Voltar para o login
      </Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
        <p className="text-gray-500 text-sm mt-1">Digite seu email e enviaremos um link de redefinição.</p>
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

      <Button
        type="submit"
        fullWidth
        variant="primary"
        isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200"
      >
        Enviar link
      </Button>

      <Link to="/login" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
        Voltar para o login
      </Link>
    </form>
  )
}
