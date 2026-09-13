import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, Lock, Trash2, Loader2, Camera } from 'lucide-react'
import {
  useProfile,
  useUpdateProfile,
  useUploadProfilePhoto,
  useDeleteProfilePhoto,
  useChangePassword,
  useChangeEmail,
  useDeleteAccount,
} from '../hooks/useProfile'
import { PageHeader } from '../components/PageHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useAppToast } from '../hooks/useAppToast'
import { useAuthStore } from '../store/authStore'
import { UserAvatar } from '../components/UserAvatar'
import { ProfilePhotoEditor } from '../components/ProfilePhotoEditor'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Field } from '../components/ui/field'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog'
import { Spinner } from '../components/ui/spinner'
import { cn } from '../lib/utils'

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

type Tab = 'profile' | 'email' | 'password' | 'danger'

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'Dados Pessoais', icon: <User size={15} /> },
  { id: 'email', label: 'Alterar E-mail', icon: <Mail size={15} /> },
  { id: 'password', label: 'Alterar Senha', icon: <Lock size={15} /> },
  { id: 'danger', label: 'Zona de Perigo', icon: <Trash2 size={15} /> },
]

export function ProfilePage() {
  const { data: profile, isLoading } = useProfile()
  const updateProfile = useUpdateProfile()
  const uploadPhoto = useUploadProfilePhoto()
  const deletePhoto = useDeleteProfilePhoto()
  const changePassword = useChangePassword()
  const changeEmail = useChangeEmail()
  const deleteAccount = useDeleteAccount()
  const user = useAuthStore((s) => s.user)
  const toast = useAppToast()

  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const photoInputRef = useRef<HTMLInputElement>(null)

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

  const handlePhotoSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Formato inválido', 'Use uma imagem JPG, PNG ou WEBP.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Imagem muito grande', 'O tamanho máximo é 5 MB.')
      return
    }

    setPhotoFile(file)
    setEditorOpen(true)
  }

  if (isLoading) {
    return (
      <div className="w-full min-w-0">
        <PageHeader title="Perfil" />
        <div className="w-full min-w-0 max-w-2xl space-y-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0">
      <PageHeader title="Perfil" />

      <div className="w-full min-w-0 max-w-2xl">
        {/* Avatar section */}
        <div className="card w-full min-w-0 p-5 flex items-center gap-4 mb-5">
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="relative flex-shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Alterar foto de perfil"
          >
            <UserAvatar name={profile?.name || user?.name} size={52} />
            <span className="absolute -bottom-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow">
              <Camera size={11} />
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold truncate">{profile?.name}</p>
            <p className="text-sm text-muted-foreground truncate">{profile?.email}</p>
            {profile?.photoUpdatedAt && (
              <button
                type="button"
                onClick={() => deletePhoto.mutate()}
                disabled={deletePhoto.isPending}
                className="mt-1 text-xs text-destructive hover:underline disabled:opacity-50"
              >
                {deletePhoto.isPending ? 'Removendo…' : 'Remover foto'}
              </button>
            )}
          </div>
        </div>

        {/* Tab layout */}
        <div className="card w-full min-w-0 overflow-hidden">
          {/* Tab bar */}
          <div
            className="grid grid-cols-2 gap-2 border-b border-border p-3 sm:flex sm:max-w-full sm:min-w-0 sm:gap-0 sm:overflow-x-auto sm:p-0 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: 'none' }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              const isDanger = tab.id === 'danger'
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-md border px-2 py-2 text-xs font-medium transition-colors',
                    'sm:flex-shrink-0 sm:justify-start sm:gap-2 sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b-2 sm:px-4 sm:py-3 sm:text-sm sm:-mb-px',
                    isActive
                      ? isDanger
                        ? 'border-destructive bg-destructive/10 text-destructive sm:bg-transparent'
                        : 'border-primary bg-primary/10 text-primary sm:bg-transparent'
                      : cn(
                          'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                          'sm:border-transparent sm:hover:bg-transparent',
                          isDanger
                            ? 'sm:hover:text-destructive'
                            : 'sm:hover:border-border sm:hover:text-foreground'
                        )
                  )}
                >
                  <span className="flex-shrink-0">{tab.icon}</span>
                  <span className="truncate">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'profile' && (
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
                  disabled={updateProfile.isPending}
                  icon={updateProfile.isPending ? <Spinner size="tiny" /> : undefined}
                >
                  {updateProfile.isPending ? 'Salvando…' : 'Salvar alterações'}
                </Button>
              </form>
            )}

            {activeTab === 'email' && (
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
                  disabled={changeEmail.isPending}
                  icon={changeEmail.isPending ? <Spinner size="tiny" /> : undefined}
                >
                  {changeEmail.isPending ? 'Alterando…' : 'Alterar E-mail'}
                </Button>
              </form>
            )}

            {activeTab === 'password' && (
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
                  disabled={changePassword.isPending}
                  icon={changePassword.isPending ? <Spinner size="tiny" /> : undefined}
                >
                  {changePassword.isPending ? 'Alterando…' : 'Alterar Senha'}
                </Button>
              </form>
            )}

            {activeTab === 'danger' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Excluir sua conta é uma ação permanente e irreversível. Todos os seus dados serão removidos definitivamente.
                </p>
                <Button
                  variant="outline"
                  className="border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => setDeleteOpen(true)}
                  icon={<Trash2 size={15} />}
                >
                  Excluir minha conta
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handlePhotoSelected}
      />

      <ProfilePhotoEditor
        open={editorOpen}
        file={photoFile}
        uploading={uploadPhoto.isPending}
        onOpenChange={(open) => {
          setEditorOpen(open)
          if (!open) setPhotoFile(null)
        }}
        onConfirm={(cropped) => {
          uploadPhoto.mutate(cropped, {
            onSuccess: () => {
              setEditorOpen(false)
              setPhotoFile(null)
            },
          })
        }}
      />

      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleDeleteAccount}
        loading={deleteAccount.isPending}
      />
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
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) close() }}>
      <DialogContent showClose={false}>
        <DialogHeader>
          <DialogTitle>Excluir conta permanentemente</DialogTitle>
        </DialogHeader>

        <Alert intent="warning">
          <AlertDescription>Esta ação é irreversível. Todos os seus dados serão apagados.</AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Field label='Digite "excluir" para confirmar'>
            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="excluir"
            />
          </Field>
          <Field label="Sua senha atual">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha atual"
            />
          </Field>
        </div>

        <DialogFooter>
          <Button
            variant="destructive"
            onClick={() => onConfirm(password)}
            disabled={loading || !password || confirmText.toLowerCase() !== 'excluir'}
            icon={loading ? <Loader2 size={14} className="animate-spin" /> : undefined}
          >
            {loading ? 'Excluindo…' : 'Excluir minha conta'}
          </Button>
          <Button variant="outline" onClick={close} disabled={loading}>Cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
