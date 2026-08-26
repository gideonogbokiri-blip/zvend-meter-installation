import { createContext } from 'react'

export const THEMES = [
  { id: 'blue', label: 'Blue', swatch: '#2563eb' },
  { id: 'orange', label: 'Orange', swatch: '#ea580c' },
  { id: 'red', label: 'Red', swatch: '#dc2626' },
  { id: 'indigo', label: 'Indigo', swatch: '#4f46e5' },
] as const

export type ThemeId = (typeof THEMES)[number]['id']

export interface ThemeContextValue {
  theme: ThemeId
  setTheme: (theme: ThemeId) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)
