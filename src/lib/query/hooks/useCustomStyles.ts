'use client'

import { useQuery } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'

export interface UserCustomStyle {
  id: string
  name: string
  preview: string
  prompt: string
  createdAt: string
  updatedAt: string
}

export function useCustomStyles() {
  return useQuery<UserCustomStyle[]>({
    queryKey: ['custom-styles'],
    queryFn: async () => {
      const res = await apiFetch('/api/user/custom-styles')
      if (!res.ok) throw new Error('Failed to fetch custom styles')
      const data = await res.json() as { styles: UserCustomStyle[] }
      return data.styles
    },
  })
}
