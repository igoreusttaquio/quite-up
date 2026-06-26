import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button, Input } from '@heroui/react'
import { authApi } from '../../api/auth'
import { useState } from 'react'

const schema = z.object({ email: z.string().email('Email inválido') })
type FormData = z.infer<typeof schema>

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const mutation = useMutation({ mutationFn: (d: FormData) => authApi.forgotPassword(d.email), onSuccess: () => setSent(true) })

  if (sent) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
        className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
        <span className="text-4xl">📧</span>
      </motion.div>
      <h1 className="text-2xl font-bold text-gray-900">Email enviado</h1>
      <p className="text-gray-500">Se o email existir, você receberá um link para redefinir sua senha.</p>
      <Link to="/login" className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Voltar para o login</Link>
    </motion.div>
  )

  return (
    <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}
      onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Redefinir senha</h1>
        <p className="text-gray-500 text-sm mt-1">Digite seu email e enviaremos um link de redefinição.</p>
      </div>
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <Input type="email" placeholder="seu@email.com" className={errors.email ? 'border-red-400' : ''} {...register('email')} />
        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
      </div>
      <Button type="submit" variant="primary" fullWidth isDisabled={mutation.isPending}
        className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-indigo-200">
        {mutation.isPending ? 'Enviando...' : 'Enviar link'}
      </Button>
      <Link to="/login" className="block text-center text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">Voltar para o login</Link>
    </motion.form>
  )
}
