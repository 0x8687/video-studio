'use client'

import { useEffect, useRef, useState } from 'react'
import { AppIcon, RatioPreviewIcon } from '@/components/ui/icons'
import { CUSTOM_STYLE_PREFIX } from '@/lib/constants'
import type { UserCustomStyle } from '@/lib/query/hooks'

interface RatioIconProps {
  ratio: string
  size?: number
  selected?: boolean
}

interface RatioSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
}

interface StyleSelectorProps {
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  customStyles?: UserCustomStyle[]
  onManageCustomStyles?: () => void
}

function RatioIcon({ ratio, size = 24, selected = false }: RatioIconProps) {
  // 始终以选中态渲染图标，保证所有比例选项的图标统一为蓝色
  return (
    <RatioPreviewIcon
      ratio={ratio}
      size={size}
      selected={selected || true}
      variant="surface"
    />
  )
}

export function RatioSelector({ value, onChange, options }: RatioSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((option) => option.value === value)

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center gap-3">
          <RatioIcon ratio={value} size={20} selected />
          <span className="text-sm text-[var(--glass-text-primary)] font-medium">
            {selectedOption?.label || value}
          </span>
        </div>
        <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          className="glass-surface-modal absolute z-50 mt-1 left-0 right-0 p-3 max-h-60 overflow-y-auto custom-scrollbar"
          style={{ minWidth: '280px' }}
        >
          <div className="grid grid-cols-5 gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg hover:bg-[var(--glass-bg-muted)] transition-colors ${
                  value === option.value
                    ? 'bg-[var(--glass-tone-info-bg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                    : ''
                }`}
              >
                <RatioIcon ratio={option.value} size={28} selected={value === option.value} />
                <span
                  className={`text-xs ${
                    value === option.value
                      ? 'text-[var(--glass-tone-info-fg)] font-medium'
                      : 'text-[var(--glass-text-secondary)]'
                  }`}
                >
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function StyleSelector({ value, onChange, options, customStyles, onManageCustomStyles }: StyleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const customStyleMatch = customStyles?.find(s => `${CUSTOM_STYLE_PREFIX}${s.id}` === value)
  const selectedBuiltin = options.find((option) => option.value === value) || options[0]
  const selectedLabel = customStyleMatch?.name ?? selectedBuiltin?.label ?? ''

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="glass-input-base h-11 px-3 flex items-center justify-between gap-2 cursor-pointer transition-colors"
      >
        <div className="flex items-center">
          <span className="text-sm text-[var(--glass-text-primary)] font-medium">{selectedLabel}</span>
        </div>
        <AppIcon name="chevronDown" className={`w-4 h-4 text-[var(--glass-text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="glass-surface-modal absolute z-50 mt-1 left-0 right-0 p-3 space-y-3">
          {/* Built-in styles */}
          <div className="grid grid-cols-2 gap-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`flex items-center p-3 rounded-lg text-left transition-all ${
                  value === option.value
                    ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                    : 'hover:bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)]'
                }`}
              >
                <span className="font-medium text-sm">{option.label}</span>
              </button>
            ))}
          </div>

          {/* Custom styles */}
          {customStyles && customStyles.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-[var(--glass-text-tertiary)] px-1">Custom Styles</p>
              <div className="grid grid-cols-2 gap-2">
                {customStyles.map((style) => {
                  const styleValue = `${CUSTOM_STYLE_PREFIX}${style.id}`
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => {
                        onChange(styleValue)
                        setIsOpen(false)
                      }}
                      className={`flex items-center gap-2 p-3 rounded-lg text-left transition-all ${
                        value === styleValue
                          ? 'bg-[var(--glass-tone-info-bg)] text-[var(--glass-tone-info-fg)] shadow-[0_0_0_1px_rgba(79,128,255,0.35)]'
                          : 'hover:bg-[var(--glass-bg-muted)] text-[var(--glass-text-secondary)]'
                      }`}
                    >
                      <span className="w-6 h-6 rounded flex-shrink-0 bg-[var(--glass-bg-muted)] flex items-center justify-center text-xs font-semibold">
                        {style.preview || 'S'}
                      </span>
                      <span className="font-medium text-sm truncate">{style.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Manage button */}
          {onManageCustomStyles && (
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onManageCustomStyles()
              }}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs text-[var(--glass-text-tertiary)] hover:bg-[var(--glass-bg-muted)] transition-colors border border-dashed border-[var(--glass-stroke)]"
            >
              <AppIcon name="plus" className="w-3 h-3" />
              <span>Manage custom styles</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
