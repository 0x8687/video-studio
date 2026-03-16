'use client'

import { useState } from 'react'
import { AppIcon } from '@/components/ui/icons'
import {
  useCustomStyles,
  useCreateCustomStyle,
  useUpdateCustomStyle,
  useDeleteCustomStyle,
  type UserCustomStyle,
} from '@/lib/query/hooks'

interface FormState {
  name: string
  preview: string
  prompt: string
}

const EMPTY_FORM: FormState = { name: '', preview: '', prompt: '' }

interface CustomStyleManagerProps {
  open: boolean
  onClose: () => void
}

export default function CustomStyleManager({ open, onClose }: CustomStyleManagerProps) {
  const { data: styles = [], isLoading } = useCustomStyles()
  const createMutation = useCreateCustomStyle()
  const updateMutation = useUpdateCustomStyle()
  const deleteMutation = useDeleteCustomStyle()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function openCreateForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
    setShowForm(true)
  }

  function openEditForm(style: UserCustomStyle) {
    setEditingId(style.id)
    setForm({ name: style.name, preview: style.preview, prompt: style.prompt })
    setError(null)
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  async function handleSubmit() {
    setError(null)
    if (!form.name.trim()) { setError('Name is required'); return }
    if (!form.prompt.trim()) { setError('Style prompt is required'); return }
    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, ...form })
      } else {
        await createMutation.mutateAsync(form)
      }
      cancelForm()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Operation failed')
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
    } catch {
      // silent
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative glass-surface-modal rounded-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--glass-stroke)]">
          <h2 className="text-base font-semibold text-[var(--glass-text-primary)]">Manage Custom Styles</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors"
          >
            <AppIcon name="close" className="w-4 h-4 text-[var(--glass-text-tertiary)]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
          {/* Form */}
          {showForm && (
            <div className="glass-surface-soft rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-medium text-[var(--glass-text-primary)]">
                {editingId ? 'Edit Style' : 'New Style'}
              </h3>
              <div className="space-y-2">
                <label className="text-xs text-[var(--glass-text-muted)]">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. My Cyberpunk Style"
                  className="glass-input-base h-9 px-3 w-full text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--glass-text-muted)]">Preview character (max 2 chars)</label>
                <input
                  type="text"
                  value={form.preview}
                  onChange={e => setForm(f => ({ ...f, preview: e.target.value.slice(0, 2) }))}
                  placeholder="C"
                  className="glass-input-base h-9 px-3 w-20 text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs text-[var(--glass-text-muted)]">Style prompt</label>
                <textarea
                  value={form.prompt}
                  onChange={e => setForm(f => ({ ...f, prompt: e.target.value }))}
                  placeholder="cyberpunk style, neon lights, dark atmosphere..."
                  rows={4}
                  className="glass-textarea-base px-3 py-2 w-full text-sm resize-none custom-scrollbar"
                />
              </div>
              {error && (
                <p className="text-xs text-[var(--glass-tone-error-fg)]">{error}</p>
              )}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={cancelForm}
                  className="glass-btn-base px-3 h-8 text-xs text-[var(--glass-text-secondary)]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="glass-btn-base glass-btn-primary px-4 h-8 text-xs text-white disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {/* Style list */}
          {isLoading ? (
            <p className="text-sm text-[var(--glass-text-tertiary)] text-center py-6">Loading...</p>
          ) : styles.length === 0 && !showForm ? (
            <p className="text-sm text-[var(--glass-text-tertiary)] text-center py-6">No custom styles yet. Create one below.</p>
          ) : (
            <div className="space-y-2">
              {styles.map(style => (
                <div
                  key={style.id}
                  className="flex items-center gap-3 p-3 rounded-xl glass-surface-soft"
                >
                  <div className="w-9 h-9 rounded-lg bg-[var(--glass-tone-info-bg)] flex items-center justify-center text-sm font-semibold text-[var(--glass-tone-info-fg)] flex-shrink-0">
                    {style.preview || 'S'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[var(--glass-text-primary)] truncate">{style.name}</div>
                    <div className="text-xs text-[var(--glass-text-tertiary)] truncate">{style.prompt}</div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => openEditForm(style)}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors"
                    >
                      <AppIcon name="edit" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)]" />
                    </button>
                    <button
                      onClick={() => handleDelete(style.id)}
                      disabled={deleteMutation.isPending}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[var(--glass-tone-error-bg)] transition-colors disabled:opacity-50"
                    >
                      <AppIcon name="trash" className="w-3.5 h-3.5 text-[var(--glass-text-tertiary)]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!showForm && (
          <div className="p-4 border-t border-[var(--glass-stroke)]">
            <button
              onClick={openCreateForm}
              className="glass-btn-base glass-btn-primary w-full h-9 text-sm text-white flex items-center justify-center gap-2"
            >
              <AppIcon name="plus" className="w-4 h-4" />
              <span>New Style</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
