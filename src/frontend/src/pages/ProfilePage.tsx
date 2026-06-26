import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Button,
  Field,
  Input,
  Text,
  Card,
  CardHeader,
} from '@fluentui/react-components'
import {
  useProfile,
  useUpdateProfile,
  useChangePassword,
  useChangeEmail,
  useDeleteAccount,
} from '../hooks/useProfile'
import { PageHeader } from '../components/PageHeader'
import { LoadingScreen } from '../components/LoadingScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'

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

  const [deleteOpen, setDeleteOpen] = useState(false)

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    values: { name: profile?.name || '' },
  })

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { newEmail: '', currentPassword: '' },
  })

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' },
  })

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data)
    } catch {
      // handled by query client
    }
  }

  const handleEmailSubmit = async (data: EmailFormData) => {
    try {
      await changeEmail.mutateAsync(data)
      emailForm.reset()
    } catch {
      // handled by query client
    }
  }

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword.mutateAsync(data)
      passwordForm.reset()
    } catch {
      // handled by query client
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync({ password: '' })
    } catch {
      // handled by query client
    }
  }

  if (isLoading) return <LoadingScreen />

  return (
    <div>
      <PageHeader title="Perfil" />

      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader header={<Text weight="semibold">Dados Pessoais</Text>} />
          <div className="space-y-4">
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
              appearance="primary"
              onClick={profileForm.handleSubmit(handleProfileSubmit as () => Promise<void>)}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader header={<Text weight="semibold">Alterar E-mail</Text>} />
          <div className="space-y-4">
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
              appearance="primary"
              onClick={emailForm.handleSubmit(handleEmailSubmit as () => Promise<void>)}
              disabled={changeEmail.isPending}
            >
              {changeEmail.isPending ? 'Alterando...' : 'Alterar E-mail'}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader header={<Text weight="semibold">Alterar Senha</Text>} />
          <div className="space-y-4">
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
              appearance="primary"
              onClick={passwordForm.handleSubmit(handlePasswordSubmit as () => Promise<void>)}
              disabled={changePassword.isPending}
            >
              {changePassword.isPending ? 'Alterando...' : 'Alterar Senha'}
            </Button>
          </div>
        </Card>

        <Card>
          <CardHeader header={<Text weight="semibold" style={{ color: 'var(--colorPaletteRedForeground1)' }}>Zona de Perigo</Text>} />
          <div className="space-y-4">
            <Text size={200} style={{ color: 'var(--colorNeutralForeground3)' }}>
              Excluir sua conta é uma ação irreversível. Todos os seus dados serão removidos.
            </Text>
            <Button
              appearance="secondary"
              style={{ borderColor: 'var(--colorPaletteRedBackground3)', color: 'var(--colorPaletteRedForeground1)' }}
              onClick={() => setDeleteOpen(true)}
            >
              Excluir Conta
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Conta"
        message="Tem certeza que deseja excluir sua conta? Esta ação é irreversível."
        confirmText="Excluir"
        destructive
        onConfirm={handleDeleteAccount}
        loading={deleteAccount.isPending}
      />
    </div>
  )
}
