import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import { authApi } from '../../api/auth'

const schema = z.object({
  name: z.string().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').regex(/[A-Z]/, 'Deve conter 1 letra maiúscula').regex(/[a-z]/, 'Deve conter 1 minúscula').regex(/[0-9]/, 'Deve conter 1 número'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, { message: 'Senhas não conferem', path: ['confirmPassword'] })
type FormData = z.infer<typeof schema>

const fields: { label: string; key: keyof FormData; type: string }[] = [
  { label: 'Nome completo', key: 'name', type: 'text' },
  { label: 'Email', key: 'email', type: 'email' },
  { label: 'Senha', key: 'password', type: 'password' },
  { label: 'Confirmar senha', key: 'confirmPassword', type: 'password' },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const { register, handleSubmit, formState: { errors }, setError } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => navigate('/verify-email', { state: { email: 'Seu email' } }),
    onError: () => setError('root', { message: 'Email ou senha inválidos' }),
  })

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit((d) => mutation.mutate(d))}
      className="space-y-5"
    >
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Criar sua conta</h1>
        <p className="text-gray-500 text-sm mt-1">Comece a organizar suas finanças hoje</p>
      </div>

      {errors.root && (
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
          className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-200 flex items-center gap-2">
          <span>⚠️</span> {errors.root.message}
        </motion.div>
      )}

      {fields.map((f) => (
        <div key={f.key} className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">{f.label}</label>
          <Input
            type={f.type}
            placeholder={`Seu ${f.label.toLowerCase()}`}
            className={errors[f.key] ? 'border-red-400' : ''}
            {...register(f.key)}
          />
          {errors[f.key] && <p className="text-red-500 text-xs mt-1">{errors[f.key]?.message}</p>}
        </div>
      ))}

      <Button type="submit" variant="primary" fullWidth isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-lg shadow-indigo-200 border-0">
        {mutation.isPending ? 'Cadastrando...' : 'Criar conta'}
      </Button>

      <p className="text-center text-sm text-gray-500">
        Já tem conta?{' '}
        <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Entrar</Link>
      </p>
    </motion.form>
  )
}
