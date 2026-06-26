import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useState } from 'react'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({ mutationFn: (d: FormData) => authApi.forgotPassword(d.email), onSuccess: () => setSent(true) })

  if (sent) return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto"><span className="text-3xl">📧</span></div>
      <h1 className="text-2xl font-bold text-gray-900">Email enviado</h1>
      <p className="text-gray-500">Se o email existir, você receberá um link para redefinir sua senha.</p>
      <Link to="/login" className="block text-sm text-indigo-600 hover:underline">Voltar para o login</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <h1 className="text-2xl font-bold text-center text-gray-900">Redefinir senha</h1>
      <p className="text-sm text-gray-500 text-center">Digite seu email e enviaremos um link para redefinir sua senha.</p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <input type="email" className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
        {mutation.isPending ? 'Enviando...' : 'Enviar link'}
      </button>
      <Link to="/login" className="block text-center text-sm text-indigo-600 hover:underline">Voltar para o login</Link>
    </form>
  )
}
