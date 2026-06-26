import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Button, Input, Card, CardContent } from '@heroui/react'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../stores/auth'

const nameSchema = z.object({ name: z.string().min(2).max(100) })
const emailSchema = z.object({ email: z.string().email('Email inválido'), currentPassword: z.string().min(1, 'Senha obrigatória') })
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha obrigatória'),
  newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, {
  message: 'Senhas não conferem',
  path: ['confirmNewPassword'],
})

function SectionCard({ title, icon, danger, children }: { title: string; icon: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="overflow-hidden">
        <div className={`h-1 ${danger ? 'bg-gradient-to-r from-red-500 to-rose-400' : 'bg-gradient-to-r from-violet-500 to-indigo-600'}`} />
        <CardContent>
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>{icon}</span> {title}
          </h3>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function ProfilePage() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const nameForm = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    values: { name: user?.name ?? '' },
  })
  const emailForm = useForm<z.infer<typeof emailSchema>>({ resolver: zodResolver(emailSchema) })
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) })

  const updateName = useMutation({
    mutationFn: (d: z.infer<typeof nameSchema>) => profileApi.updateName(d.name),
    onSuccess: ({ data }) => setUser(data),
  })
  const changeEmail = useMutation({
    mutationFn: (d: z.infer<typeof emailSchema>) => profileApi.changeEmail(d.email, d.currentPassword),
    onSuccess: () => emailForm.reset(),
  })
  const changePassword = useMutation({
    mutationFn: (d: z.infer<typeof passwordSchema>) =>
      profileApi.changePassword(d.currentPassword, d.newPassword, d.confirmNewPassword),
    onSuccess: () => passwordForm.reset(),
  })
  const deleteAccount = useMutation({
    mutationFn: (password: string) => profileApi.deleteAccount(password),
    onSuccess: () => { logout(); navigate('/login') },
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie suas informações pessoais</p>
      </div>

      <SectionCard title="Nome" icon="✏️">
        <form onSubmit={nameForm.handleSubmit((d) => updateName.mutate(d))} className="flex gap-3">
          <div className="flex-1">
            <Input
              fullWidth
              {...nameForm.register('name')}
              className={nameForm.formState.errors.name ? 'border-red-500' : ''}
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isDisabled={updateName.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            Salvar
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Email" icon="📧">
        <p className="text-sm text-gray-500 mb-4">
          Email atual: <span className="font-medium text-gray-700">{user?.email}</span>
        </p>
        <form onSubmit={emailForm.handleSubmit((d) => changeEmail.mutate(d))} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Novo email</label>
            <Input
              fullWidth
              type="email"
              {...emailForm.register('email')}
              className={emailForm.formState.errors.email ? 'border-red-500' : ''}
            />
            {emailForm.formState.errors.email && (
              <p className="text-red-500 text-xs">{emailForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha atual</label>
            <Input
              fullWidth
              type="password"
              {...emailForm.register('currentPassword')}
              className={emailForm.formState.errors.currentPassword ? 'border-red-500' : ''}
            />
            {emailForm.formState.errors.currentPassword && (
              <p className="text-red-500 text-xs">{emailForm.formState.errors.currentPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            isDisabled={changeEmail.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            Alterar email
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Senha" icon="🔒">
        <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Senha atual</label>
            <Input fullWidth type="password" {...passwordForm.register('currentPassword')} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Nova senha</label>
            <Input fullWidth type="password" {...passwordForm.register('newPassword')} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700">Confirmar nova senha</label>
            <Input
              fullWidth
              type="password"
              {...passwordForm.register('confirmNewPassword')}
              className={passwordForm.formState.errors.confirmNewPassword ? 'border-red-500' : ''}
            />
            {passwordForm.formState.errors.confirmNewPassword && (
              <p className="text-red-500 text-xs">{passwordForm.formState.errors.confirmNewPassword.message}</p>
            )}
          </div>
          <Button
            type="submit"
            variant="primary"
            isDisabled={changePassword.isPending}
            className="bg-gradient-to-r from-violet-600 to-indigo-600"
          >
            Alterar senha
          </Button>
        </form>
      </SectionCard>

      <SectionCard title="Excluir conta" icon="⚠️" danger>
        <p className="text-sm text-gray-500 mb-4">
          Todos os seus dados serão excluídos permanentemente. Essa ação não pode ser desfeita.
        </p>
        <Button
          variant="danger"
          isDisabled={deleteAccount.isPending}
          onPress={() => {
            const pwd = prompt('Digite sua senha para confirmar a exclusão da conta:')
            if (pwd) deleteAccount.mutate(pwd)
          }}
        >
          Excluir minha conta
        </Button>
      </SectionCard>
    </motion.div>
  )
}
