import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { profileApi } from '../api/profile'
import { useAuthStore } from '../store/authStore'

export function useProfilePhoto() {
  const photoUpdatedAt = useAuthStore((s) => s.user?.photoUpdatedAt ?? null)

  const { data: blob } = useQuery({
    queryKey: ['profile-photo', photoUpdatedAt],
    queryFn: () => profileApi.getPhoto().then((r) => r.data),
    enabled: !!photoUpdatedAt,
    retry: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })

  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!blob) {
      setUrl(null)
      return
    }

    const objectUrl = URL.createObjectURL(blob)
    setUrl(objectUrl)
    return () => URL.revokeObjectURL(objectUrl)
  }, [blob])

  return url
}
