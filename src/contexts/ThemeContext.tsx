import React, { createContext, useContext, ReactNode } from 'react'

interface ThemeContextType {
  theme: 'claro'
  isDark: false
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Sempre tema claro
  const theme = 'claro'
  const isDark = false

  return (
    <ThemeContext.Provider value={{ theme, isDark }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider')
  }
  return context
} 