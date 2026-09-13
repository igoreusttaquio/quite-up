import { useAuthStore } from '../store/authStore'
import { useProfilePhoto } from '../hooks/useProfilePhoto'
import { AvatarUser } from './ui/avatar'

interface UserAvatarProps {
  name?: string | null
  size?: number
  className?: string
}

export function UserAvatar({ name, size, className }: UserAvatarProps) {
  const user = useAuthStore((s) => s.user)
  const src = useProfilePhoto()

  return <AvatarUser name={name ?? user?.name} src={src} size={size} className={className} />
}
