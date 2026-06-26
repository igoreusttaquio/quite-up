import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '../../api/auth'
import { useState } from 'react'

const schema = z.object({
  password: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] })
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
    <div className="text-center space-y-5">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto"><span className="text-3xl">❌</span></div>
      <h1 className="text-2xl font-bold text-gray-900">Link inválido</h1>
      <p className="text-gray-500">Este link de redefinição é inválido ou expirou.</p>
      <Link to="/forgot-password" className="block text-sm text-indigo-600 hover:underline">Solicitar novo link</Link>
    </div>
  )

  if (done) return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"><span className="text-3xl">✅</span></div>
      <h1 className="text-2xl font-bold text-gray-900">Senha redefinida!</h1>
      <p className="text-gray-500">Sua senha foi alterada com sucesso.</p>
      <Link to="/login" className="block w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700">Ir para o login</Link>
    </div>
  )

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <h1 className="text-2xl font-bold text-center text-gray-900">Nova senha</h1>
      {errors.root && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-200">{errors.root.message}</div>}
      {[{ label: 'Nova senha', key: 'password' as const }, { label: 'Confirmar senha', key: 'confirmPassword' as const }].map((f) => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          <input type="password" className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${errors[f.key] ? 'border-red-400 bg-red-50' : 'border-gray-300'}`} {...register(f.key)} />
          {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]?.message}</p>}
        </div>
      ))}
      <button type="submit" disabled={mutation.isPending} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50">
        {mutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
      </button>
    </form>
  )
}
