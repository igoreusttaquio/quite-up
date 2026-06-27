import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Mail, LockKeyhole, Trash2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog'
import { Alert, AlertDescription } from '../components/ui/alert'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { useProfile, useUpdateProfile, useChangePassword, useChangeEmail, useDeleteAccount } from '../hooks/useProfile'
import { PageHeader } from '../components/PageHeader'
import { SkeletonCard } from '../components/Skeleton'
import { useAppToast } from '../hooks/useAppToast'
import { useAuthStore } from '../store/authStore'

const profileSchema = z.object({ name: z.string().min(2, 'Mínimo 2 caracteres') })
const emailSchema = z.object({ newEmail: z.string().email('E-mail inválido'), currentPassword: z.string().min(1, 'Senha é obrigatória') })
const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmNewPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmNewPassword, { message: 'Senhas não conferem', path: ['confirmNewPassword'] })

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

  const profileForm = useForm<ProfileFormData>({ resolver: zodResolver(profileSchema), defaultValues: { name: '' } })
  const emailForm = useForm<EmailFormData>({ resolver: zodResolver(emailSchema), defaultValues: { newEmail: '', currentPassword: '' } })
  const passwordForm = useForm<PasswordFormData>({ resolver: zodResolver(passwordSchema), defaultValues: { currentPassword: '', newPassword: '', confirmNewPassword: '' } })

  useEffect(() => { if (profile) profileForm.reset({ name: profile.name }) }, [profile, profileForm])

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try { await updateProfile.mutateAsync(data); toast.success('Perfil atualizado') } catch { toast.error('Erro ao salvar') }
  }
  const handleEmailSubmit = async (data: EmailFormData) => {
    try { await changeEmail.mutateAsync(data); emailForm.reset(); toast.success('E-mail alterado', 'Verifique sua caixa de entrada.') } catch { toast.error('Erro ao alterar e-mail') }
  }
  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try { await changePassword.mutateAsync(data); passwordForm.reset(); toast.success('Senha alterada') } catch { toast.error('Erro ao alterar senha') }
  }
  const handleDeleteAccount = async (password: string) => {
    try { await deleteAccount.mutateAsync({ password }) } catch { toast.error('Erro ao excluir conta') }
  }

  if (isLoading) {
    return <div><PageHeader title="Perfil" /><div className="max-w-2xl space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div></div>
  }

  return (
    <div>
      <PageHeader title="Perfil" />
      <div className="max-w-2xl space-y-5">
        <div className="rounded-xl border bg-card shadow-sm p-5 flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="bg-primary/10 text-primary text-lg">{profile?.name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{profile?.name}</p>
            <p className="text-sm text-muted-foreground">{profile?.email}</p>
          </div>
        </div>

        <SectionCard icon={<User className="h-[18px] w-[18px]" />} title="Dados Pessoais">
          <form onSubmit={profileForm.handleSubmit(handleProfileSubmit as () => Promise<void>)} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="name">Nome</Label><Input id="name" {...profileForm.register('name')} /></div>
            <div className="space-y-2"><Label>E-mail</Label><Input value={profile?.email || ''} disabled /></div>
            <Button type="submit" disabled={updateProfile.isPending}>{updateProfile.isPending ? 'Salvando…' : 'Salvar alterações'}</Button>
          </form>
        </SectionCard>

        <SectionCard icon={<Mail className="h-[18px] w-[18px]" />} title="Alterar E-mail">
          <form onSubmit={emailForm.handleSubmit(handleEmailSubmit as () => Promise<void>)} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="newEmail">Novo E-mail</Label><Input id="newEmail" type="email" placeholder="novo@email.com" {...emailForm.register('newEmail')} /></div>
            <div className="space-y-2"><Label htmlFor="emailPassword">Senha Atual</Label><Input id="emailPassword" type="password" {...emailForm.register('currentPassword')} /></div>
            <Button type="submit" disabled={changeEmail.isPending}>{changeEmail.isPending ? 'Alterando…' : 'Alterar E-mail'}</Button>
          </form>
        </SectionCard>

        <SectionCard icon={<LockKeyhole className="h-[18px] w-[18px]" />} title="Alterar Senha">
          <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit as () => Promise<void>)} className="space-y-4">
            <div className="space-y-2"><Label htmlFor="pwCurrent">Senha Atual</Label><Input id="pwCurrent" type="password" {...passwordForm.register('currentPassword')} /></div>
            <div className="space-y-2"><Label htmlFor="pwNew">Nova Senha</Label><Input id="pwNew" type="password" placeholder="Mínimo 6 caracteres" {...passwordForm.register('newPassword')} /></div>
            <div className="space-y-2"><Label htmlFor="pwConfirm">Confirmar Nova Senha</Label><Input id="pwConfirm" type="password" {...passwordForm.register('confirmNewPassword')} /></div>
            <Button type="submit" disabled={changePassword.isPending}>{changePassword.isPending ? 'Alterando…' : 'Alterar Senha'}</Button>
          </form>
        </SectionCard>

        <div className="rounded-xl border border-destructive/50 bg-card shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b">
            <Trash2 className="h-[18px] w-[18px] text-destructive" />
            <p className="text-sm font-semibold text-destructive">Zona de Perigo</p>
          </div>
          <p className="text-xs text-muted-foreground">Excluir sua conta é irreversível. Todos os dados serão removidos.</p>
          <Button variant="outline" className="border-destructive text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>Excluir minha conta</Button>
        </div>
      </div>

      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={handleDeleteAccount} loading={deleteAccount.isPending} />
    </div>
  )
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-card shadow-sm p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b">
        <span className="text-primary">{icon}</span>
        <p className="text-sm font-semibold">{title}</p>
      </div>
      {children}
    </div>
  )
}

function DeleteAccountDialog({ open, onOpenChange, onConfirm, loading }: {
  open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (password: string) => void; loading: boolean
}) {
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const close = () => { setPassword(''); setConfirmText(''); onOpenChange(false) }

  return (
    <Dialog open={open} onOpenChange={(open) => { if (!open) close() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir conta permanentemente</DialogTitle>
          <DialogDescription>Esta ação é irreversível.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <Alert variant="destructive">
            <AlertDescription>Todos os seus dados serão apagados.</AlertDescription>
          </Alert>
          <div className="space-y-2"><Label>Digite "excluir" para confirmar</Label><Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="excluir" /></div>
          <div className="space-y-2"><Label>Sua senha atual</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha atual" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={loading}>Cancelar</Button>
          <Button onClick={() => onConfirm(password)} disabled={loading || !password || confirmText.toLowerCase() !== 'excluir'}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {loading ? 'Excluindo…' : 'Excluir minha conta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
