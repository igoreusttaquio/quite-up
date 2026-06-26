import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../stores/auth'

const nameSchema = z.object({ name: z.string().min(2).max(100) })
const emailSchema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1),
})
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/),
    confirmNewPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    message: 'Senhas não conferem',
    path: ['confirmNewPassword'],
  })

function SectionCard({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border ${danger ? 'border-red-200' : 'border-gray-200'} p-6`}>
      <h2 className={`text-lg font-semibold mb-4 ${danger ? 'text-red-600' : 'text-gray-900'}`}>{title}</h2>
      {children}
    </div>
  )
}

function InputField({ label, type, error, ...props }: { label: string; type?: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type || 'text'}
        className={`w-full px-4 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 ${error ? 'border-red-400' : 'border-gray-300'}`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
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

  const emailForm = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
  })

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
  })

  const updateName = useMutation({
    mutationFn: (d: { name: string }) => profileApi.updateName(d.name),
    onSuccess: ({ data }) => setUser(data),
  })

  const changeEmail = useMutation({
    mutationFn: (d: z.infer<typeof emailSchema>) => profileApi.changeEmail(d.email, d.currentPassword),
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
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Perfil</h1>

      <SectionCard title="Nome">
        <form onSubmit={nameForm.handleSubmit((d) => updateName.mutate(d))} className="flex gap-3">
          <div className="flex-1">
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              {...nameForm.register('name')}
            />
            {nameForm.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{nameForm.formState.errors.name.message}</p>
            )}
          </div>
          <button type="submit" disabled={updateName.isPending}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {updateName.isPending ? 'Salvando...' : 'Salvar'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Email">
        <p className="text-sm text-gray-500 mb-3">Email atual: {user?.email}</p>
        <form onSubmit={emailForm.handleSubmit((d) => changeEmail.mutate(d))} className="space-y-3">
          <InputField label="Novo email" type="email" error={emailForm.formState.errors.email?.message} {...emailForm.register('email')} />
          <InputField label="Senha atual" type="password" error={emailForm.formState.errors.currentPassword?.message} {...emailForm.register('currentPassword')} />
          <button type="submit" disabled={changeEmail.isPending}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {changeEmail.isPending ? 'Alterando...' : 'Alterar email'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Senha">
        <form onSubmit={passwordForm.handleSubmit((d) => changePassword.mutate(d))} className="space-y-3">
          <InputField label="Senha atual" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
          <InputField label="Nova senha" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
          <InputField label="Confirmar nova senha" type="password" error={passwordForm.formState.errors.confirmNewPassword?.message} {...passwordForm.register('confirmNewPassword')} />
          <button type="submit" disabled={changePassword.isPending}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">
            {changePassword.isPending ? 'Alterando...' : 'Alterar senha'}
          </button>
        </form>
      </SectionCard>

      <SectionCard title="Zona de perigo" danger>
        <p className="text-sm text-gray-500 mb-3">Todos os seus dados serão excluídos permanentemente.</p>
        <button
          onClick={() => {
            const pwd = prompt('Digite sua senha para confirmar:')
            if (pwd) deleteAccount.mutate(pwd)
          }}
          disabled={deleteAccount.isPending}
          className="px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50"
        >
          {deleteAccount.isPending ? 'Excluindo...' : 'Excluir minha conta'}
        </button>
      </SectionCard>
    </div>
  )
}
