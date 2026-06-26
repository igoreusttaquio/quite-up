import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
      <div className="w-20 h-20 bg-gradient-to-br from-red-400 to-rose-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-200"><span className="text-4xl">❌</span></div>
      <h1 className="text-2xl font-bold text-gray-900">Link inválido</h1>
      <p className="text-gray-500">Este link de redefinição é inválido ou expirou.</p>
      <Link to="/forgot-password" className="text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors">Solicitar novo link</Link>
    </motion.div>
  )

  if (done) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200"><span className="text-4xl">✅</span></motion.div>
      <h1 className="text-2xl font-bold text-gray-900">Senha redefinida!</h1>
      <p className="text-gray-500">Sua senha foi alterada com sucesso.</p>
      <Link to="/login">
        <Button variant="primary" fullWidth
          className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-indigo-200">
          Ir para o login
        </Button>
      </Link>
    </motion.div>
  )

  return (
    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Nova senha</h1>
        <p className="text-gray-500 text-sm mt-1">Escolha uma senha segura para sua conta</p>
      </div>
      {errors.root && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </motion.div>
      )}
      {[{ label: 'Nova senha', key: 'password' as const }, { label: 'Confirmar senha', key: 'confirmPassword' as const }].map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
          <Input type="password" placeholder={f.label} className={errors[f.key] ? 'border-red-400' : ''} {...register(f.key)} />
          {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]?.message}</p>}
        </div>
      ))}
      <Button type="submit" variant="primary" fullWidth isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-indigo-200">
        {mutation.isPending ? 'Redefinindo...' : 'Redefinir senha'}
      </Button>
    </motion.form>
  )
}
