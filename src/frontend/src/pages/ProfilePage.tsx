import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@heroui/react'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../stores/auth'

const nameSchema = z.object({ name: z.string().min(2).max(100) })
const emailSchema = z.object({ email: z.string().email(), currentPassword: z.string().min(1) })
const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/), confirmNewPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Senhas não conferem', path: ['confirmNewPassword'] })

function SectionCard({ title, children, danger, icon }: { title: string; children: React.ReactNode; danger?: boolean; icon?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-0 shadow-lg shadow-gray-200/50 overflow-hidden ${danger ? 'border-l-4 border-l-red-500' : ''}`}>
        <div className={`h-1 ${danger ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-violet-500 to-indigo-600'}`} />
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  )
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const nameForm = useForm<z.infer<typeof nameSchema>>({ resolver: zodResolver(nameSchema), values: { name: user?.name ?? '' } })
  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) })

  const updateName = useMutation({ mutationFn: (d: { name: string }) => profileApi.updateName(d.name), onSuccess: ({ data }) => setUser(data) })
  const changeEmail = useMutation({ mutationFn: (d: z.infer<typeof emailSchema>) => profileApi.changeEmail(d.email, d.currentPassword) })
  const changePassword = useMutation({ mutationFn: (d: z.infer<typeof passwordSchema>) => profileApi.changePassword(d.currentPassword, d.newPassword, d.confirmNewPassword), onSuccess: () => passwordForm.reset() })
  const deleteAccount = useMutation({ mutationFn: (password: string) => profileApi.deleteAccount(password), onSuccess: () => { logout(); navigate('/login') } })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      <SectionCard title="Nome" icon="✏️">
        <form onSubmit={nameForm.handleSubmit((d) => updateName.mutate(d))} className="flex gap-3">
          <div className="flex-1">
            <Input {...nameForm.register('name')} />
          </div>
          <Button type="submit" variant="primary" isDisabled={updateName.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600">Salvar</Button>
        </form>
      </SectionCard>

      <SectionCard title="Email" icon="📧">
        <p className="text-sm text-gray-500 mb-3">Email atual: <span className="font-medium text-gray-700">{user?.email}</span></p>
        <form onSubmit={emailForm.handleSubmit((d) => changeEmail.mutate(d))} className="space-y-3">
          <Input placeholder="Novo email" type="email" {...emailForm.register('email')} />
          <Input placeholder="Senha atual" type="password" {...emailForm.register('currentPassword')} />
          <Button type="submit" variant="primary" isDisabled={changeEmail.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600">Alterar email</Button>
        </form>
      </SectionCard>

      <SectionCard title="Senha" icon="🔒">
        <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="space-y-3">
          <Input placeholder="Senha atual" type="password" {...passwordForm.register('currentPassword')} />
          <Input placeholder="Nova senha" type="password" {...passwordForm.register('newPassword')} />
          <Input placeholder="Confirmar nova senha" type="password" {...passwordForm.register('confirmNewPassword')} />
          <Button type="submit" variant="primary" isDisabled={changePassword.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600">Alterar senha</Button>
        </form>
      </SectionCard>

      <SectionCard title="Excluir conta" icon="⚠️" danger>
        <p className="text-sm text-gray-500 mb-3">Todos os seus dados serão excluídos permanentemente. Essa ação não pode ser desfeita.</p>
        <Button variant="outline"
          onPress={() => { const pwd = prompt('Digite sua senha para confirmar:'); if (pwd) deleteAccount.mutate(pwd) }}
          isDisabled={deleteAccount.isPending}
          className="text-red-600 border-red-300 hover:bg-red-50">
          Excluir minha conta
        </Button>
      </SectionCard>
    </motion.div>
  )
}
