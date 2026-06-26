import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { Button } from '@heroui/react'
import { authApi } from '../../api/auth'
import { useState } from 'react'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [verified, setVerified] = useState(!!token)
  const verifyMutation = useMutation({ mutationFn: (t: string) => authApi.verifyEmail(t), onSuccess: () => setVerified(true) })
  const resendMutation = useMutation({ mutationFn: (email: string) => authApi.resendVerification(email) })

  if (token && !verified && !verifyMutation.isPending) verifyMutation.mutate(token)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-6">
      {verified || verifyMutation.isSuccess ? (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-green-200">
            <span className="text-4xl">✅</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Email verificado!</h1>
          <p className="text-gray-500">Sua conta foi ativada e você já pode acessar o sistema.</p>
          <Link to="/login">
            <Button variant="primary" fullWidth
              className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white border-0 shadow-lg shadow-indigo-200">
              Ir para o login
            </Button>
          </Link>
        </>
      ) : (
        <>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-blue-200">
            <span className="text-4xl">📧</span>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-900">Verifique seu email</h1>
          <p className="text-gray-500">Enviamos um link de verificação. Clique no link para ativar sua conta.</p>
          <Button variant="outline" fullWidth isDisabled={resendMutation.isPending}
            onPress={() => { const email = prompt('Digite seu email:'); if (email) resendMutation.mutate(email) }}>
            Reenviar email
          </Button>
          <Link to="/login" className="block text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors">
            Voltar para o login
          </Link>
        </>
      )}
    </motion.div>
  )
}
