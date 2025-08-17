import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import { clientesService } from '../services/clientesService'
import { imagensService } from '../services/imagensService'

interface DataContextType {
  totalClientes: number
  totalImagens: number
  loading: boolean
  refreshData: () => Promise<void>
  incrementClientes: () => void
  decrementClientes: () => void
  incrementImagens: () => void
  decrementImagens: () => void
}

const DataContext = createContext<DataContextType | undefined>(undefined)

interface DataProviderProps {
  children: ReactNode
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  const { user, isLoading: userLoading } = useAuthContext()
  const [totalClientes, setTotalClientes] = useState(0)
  const [totalImagens, setTotalImagens] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      refreshData()
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
      setTotalClientes(0)
      setTotalImagens(0)
    }
  }, [user, userLoading])

  const refreshData = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setTotalClientes(0)
        setTotalImagens(0)
        return
      }

      // Carregar dados em paralelo
      const [clientes, imagens] = await Promise.all([
        clientesService.listar(user.id),
        imagensService.listar(user.id) // Agora passa user_id como primeiro parâmetro
      ])

      setTotalClientes(clientes.length)
      setTotalImagens(imagens.length)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setTotalClientes(0)
      setTotalImagens(0)
    } finally {
      setLoading(false)
    }
  }

  const incrementClientes = () => {
    setTotalClientes(prev => prev + 1)
  }

  const decrementClientes = () => {
    setTotalClientes(prev => Math.max(0, prev - 1))
  }

  const incrementImagens = () => {
    setTotalImagens(prev => prev + 1)
  }

  const decrementImagens = () => {
    setTotalImagens(prev => Math.max(0, prev - 1))
  }

  const value: DataContextType = {
    totalClientes,
    totalImagens,
    loading,
    refreshData,
    incrementClientes,
    decrementClientes,
    incrementImagens,
    decrementImagens
  }

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  )
}

export const useDataContext = () => {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error('useDataContext deve ser usado dentro de um DataProvider')
  }
  return context
}