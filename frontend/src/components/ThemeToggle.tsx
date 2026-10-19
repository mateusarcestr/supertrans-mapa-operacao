import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Moon, Sun } from 'lucide-react'

import { Button } from './orion/ui'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('supertrans-theme') as Theme | null
    return stored === 'light' || stored === 'dark' ? stored : 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('supertrans-theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((previous) => (previous === 'light' ? 'dark' : 'light'))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) return { theme: 'light' as Theme, toggleTheme: () => {} }
  return context
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const label = theme === 'light' ? 'Mudar para o tema escuro' : 'Mudar para o tema claro'

  return (
    <Button className="theme-toggle" variant="outline" size="icon" onClick={toggleTheme} aria-label={label} title={label}>
      {theme === 'light' ? <Moon aria-hidden="true" size={17} /> : <Sun aria-hidden="true" size={17} />}
    </Button>
  )
}
