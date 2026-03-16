'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from '@/lib/api-fetch'
import type { UserCustomStyle } from '../hooks/useCustomStyles'

export function useCreateCustomStyle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: { name: string; preview?: string; prompt: string }) => {
      const res = await apiFetch('/api/user/custom-styles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof err.message === 'string' ? err.message : 'Failed to create style')
      }
      const result = await res.json() as { style: UserCustomStyle }
      return result.style
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-styles'] }),
  })
}

export function useUpdateCustomStyle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: string; name?: string; preview?: string; prompt?: string }) => {
      const res = await apiFetch(`/api/user/custom-styles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof err.message === 'string' ? err.message : 'Failed to update style')
      }
      const result = await res.json() as { style: UserCustomStyle }
      return result.style
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-styles'] }),
  })
}

export function useDeleteCustomStyle() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/user/custom-styles/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as Record<string, unknown>
        throw new Error(typeof err.message === 'string' ? err.message : 'Failed to delete style')
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['custom-styles'] }),
  })
}
