import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Field,
  Input,
  Text,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
  DialogActions,
  Spinner,
  Avatar,
  MessageBar,
  MessageBarBody,
} from '@fluentui/react-components'
import {
  PersonFilled,
  MailFilled,
  LockClosedFilled,
  DeleteFilled,
} from '@fluentui/react-icons'
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useChangeEmail,
  useDeleteAccount,
} from '../hooks/useProfile'
import { PageHeader } from '../components/PageHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useAppToast } from '../hooks/useAppToast'
import { useAuthStore } from '../store/authStore'

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
})

const emailSchema = z.object({
  newEmail: z.string().email('E-mail inválido'),
  currentPassword: z.string().min(1, 'Senha é obrigatória'),
})

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z.string().min(6, 'Nova senha deve ter no mínimo 6 caracteres'),
    confirmNewPassword: z.string().min(1, 'Confirmação é obrigatória'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Senhas não conferem',
    path: ['confirmNewPassword'],
  })

type ProfileFormData = z.infer<typeof profileSchema>
type EmailFormData = z.infer<typeof emailSchema>
type PasswordFormData = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const changePassword = useChangePassword()
  const changeEmail = useChangeEmail()
  const deleteAccount = useDeleteAccount()
  const user = useAuthStore((s) => s.user)
  const toast = useAppToast()

  const [deleteOpen, setDeleteOpen] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '' },
  })

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  useEffect(() => {
    if (profile) profileForm.reset({ name: profile.name })
  }, [profile, profileForm])

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data)
      toast.success('Perfil atualizado', 'Suas informações foram salvas com sucesso.')
    } catch {
      toast.error('Erro ao salvar', 'Não foi possível atualizar o perfil.')
    }
  }

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      await changeEmail.mutateAsync(data)
      emailForm.reset()
      toast.success('E-mail alterado', 'Verifique sua caixa de entrada para confirmar.')
    } catch {
      toast.error('Erro ao alterar e-mail', 'Verifique sua senha e tente novamente.')
    }
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data)
      passwordForm.reset()
      toast.success('Senha alterada', 'Sua senha foi atualizada com sucesso.')
    } catch {
      toast.error('Erro ao alterar senha', 'Verifique sua senha atual e tente novamente.')
    }
  }

  const handleDeleteAccount = async (password: string) => {
    try {
      await deleteAccount.mutateAsync({ password })
    } catch {
      toast.error('Erro ao excluir conta', 'Verifique sua senha e tente novamente.')
    }
  }

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Perfil" />
        <div className="max-w-2xl space-y-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Perfil" />

      <div className="max-w-2xl space-y-5">
        {/* Avatar section */}
        <div className="card p-5 flex items-center gap-4">
          <Avatar name={profile?.name || user?.name} size={56} color="colorful" />
          <div>
            <Text size={500} weight="semibold" block>{profile?.name}</Text>
            <Text size={300} className="text-muted">{profile?.email}</Text>
          </div>
        </div>

        {/* Personal data */}
        <SectionCard
          icon={<PersonFilled style={{ fontSize: 18 }} />}
          title="Dados Pessoais"
        >
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit as () => Promise<void>)} className="space-y-4">
            <Controller
              name="name"
              control={profileForm.control}
              render={({ field }) => (
                <Field
                  label="Nome"
                  validationState={profileForm.formState.errors.name ? 'error' : undefined}
                  validationMessage={profileForm.formState.errors.name?.message}
                >
                  <Input {...field} />
                </Field>
              )}
            />
            <Field label="E-mail">
              <Input value={profile?.email || ''} disabled />
            </Field>
            <Button
              type="submit"
              appearance="primary"
              disabled={updateProfile.isPending}
              icon={updateProfile.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {updateProfile.isPending ? 'Salvando…' : 'Salvar alterações'}
            </Button>
          </form>
        </SectionCard>

        {/* Change email */}
        <SectionCard
          icon={<MailFilled style={{ fontSize: 18 }} />}
          title="Alterar E-mail"
        >
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit as () => Promise<void>)} className="space-y-4">
            <Controller
              name="newEmail"
              control={emailForm.control}
              render={({ field }) => (
                <Field
                  label="Novo E-mail"
                  validationState={emailForm.formState.errors.newEmail ? 'error' : undefined}
                  validationMessage={emailForm.formState.errors.newEmail?.message}
                >
                  <Input {...field} type="email" placeholder="novo@email.com" />
                </Field>
              )}
            />
            <Controller
              name="currentPassword"
              control={emailForm.control}
              render={({ field }) => (
                <Field
                  label="Senha Atual"
                  validationState={emailForm.formState.errors.currentPassword ? 'error' : undefined}
                  validationMessage={emailForm.formState.errors.currentPassword?.message}
                >
                  <Input {...field} type="password" />
                </Field>
              )}
            />
            <Button
              type="submit"
              appearance="primary"
              disabled={changeEmail.isPending}
              icon={changeEmail.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {changeEmail.isPending ? 'Alterando…' : 'Alterar E-mail'}
            </Button>
          </form>
        </SectionCard>

        {/* Change password */}
        <SectionCard
          icon={<LockClosedFilled style={{ fontSize: 18 }} />}
          title="Alterar Senha"
        >
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit as () => Promise<void>)} className="space-y-4">
            <Controller
              name="currentPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <Field
                  label="Senha Atual"
                  validationState={passwordForm.formState.errors.currentPassword ? 'error' : undefined}
                  validationMessage={passwordForm.formState.errors.currentPassword?.message}
                >
                  <Input {...field} type="password" />
                </Field>
              )}
            />
            <Controller
              name="newPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <Field
                  label="Nova Senha"
                  validationState={passwordForm.formState.errors.newPassword ? 'error' : undefined}
                  validationMessage={passwordForm.formState.errors.newPassword?.message}
                >
                  <Input {...field} type="password" placeholder="Mínimo 6 caracteres" />
                </Field>
              )}
            />
            <Controller
              name="confirmNewPassword"
              control={passwordForm.control}
              render={({ field }) => (
                <Field
                  label="Confirmar Nova Senha"
                  validationState={passwordForm.formState.errors.confirmNewPassword ? 'error' : undefined}
                  validationMessage={passwordForm.formState.errors.confirmNewPassword?.message}
                >
                  <Input {...field} type="password" />
                </Field>
              )}
            />
            <Button
              type="submit"
              appearance="primary"
              disabled={changePassword.isPending}
              icon={changePassword.isPending ? <Spinner size="tiny" /> : undefined}
            >
              {changePassword.isPending ? 'Alterando…' : 'Alterar Senha'}
            </Button>
          </form>
        </SectionCard>

        {/* Danger zone */}
        <div className="card p-5 space-y-4" style={{ borderColor: 'var(--colorPaletteRedBorder2)' }}>
          <div className="flex items-center gap-2 pb-3 border-b border-subtle">
            <DeleteFilled className="text-danger" style={{ fontSize: 18 }} />
            <Text weight="semibold" className="text-danger">Zona de Perigo</Text>
          </div>
          <Text size={300} className="text-muted">
            Excluir sua conta é uma ação permanente e irreversível. Todos os seus dados serão removidos definitivamente.
          </Text>
          <Button
            appearance="outline"
            className="border-[var(--colorPaletteRedBorderActive)] text-danger"
            onClick={() => setDeleteOpen(true)}
          >
            Excluir minha conta
          </Button>
        </div>
      </div>

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteAccount}
        loading={deleteAccount.isPending}
      />
    </div>
  )
}

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-subtle">
        <span className="text-brand">{icon}</span>
        <Text weight="semibold">{title}</Text>
      </div>
      {children}
    </div>
  )
}

function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
  loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (password: string) => void
  loading: boolean
}) {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')

  const close = () => {
    setPassword('')
    setConfirmText('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(_, data) => { if (!data.open) close() }}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Excluir conta permanentemente</DialogTitle>
          <DialogContent>
            <div className="space-y-4">
              <MessageBar intent="warning">
                <MessageBarBody>
                  Esta ação é irreversível. Todos os seus dados serão apagados.
                </MessageBarBody>
              </MessageBar>

              <Field label='Digite "excluir" para confirmar'>
                <Input
                  value={confirmText}
                  onChange={(_, d) => setConfirmText(d.value)}
                  placeholder="excluir"
                />
              </Field>

              <Field label="Sua senha atual">
                <Input
                  type="password"
                  value={password}
                  onChange={(_, d) => setPassword(d.value)}
                  placeholder="Senha atual"
                />
              </Field>
            </div>
          </DialogContent>
          <DialogActions>
            <Button
              appearance="primary"
              onClick={() => onConfirm(password)}
              disabled={loading || !password || confirmText.toLowerCase() !== 'excluir'}
              icon={loading ? <Spinner size="tiny" /> : undefined}
              style={{ backgroundColor: 'var(--colorPaletteRedBackground3)' }}
            >
              {loading ? 'Excluindo…' : 'Excluir minha conta'}
            </Button>
            <Button onClick={close} disabled={loading}>Cancelar</Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  )
}
