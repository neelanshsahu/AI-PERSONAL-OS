import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark')
  const [accent, setAccent] = useState(() => localStorage.getItem('accent') || 'indigo')

  useEffect(() => {
    const root = document.documentElement
    
    // Handle Light/Dark Mode
    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }
    localStorage.setItem('theme', theme)

    // Handle Accent Colors
    // Remove existing theme-* classes
    root.className = root.className.replace(/theme-\w+/g, '')
    
    // Add new theme class if not default indigo
    if (accent !== 'indigo') {
      root.classList.add(`theme-${accent}`)
    }
    localStorage.setItem('accent', accent)

    // Clear any lingering font-size override
    root.style.removeProperty('font-size')
    localStorage.removeItem('fontSize')
    
  }, [theme, accent])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
