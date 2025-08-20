import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useAuthContext } from '../hooks/useAuthContext'
import { clientesService } from '../services/clientesService'
import { imageApiService } from '../services/imageApiService'
import { cacheService } from '../services/cacheService'

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
  const lastLoadRef = useRef<{ userId: string; timestamp: number } | null>(null)

  useEffect(() => {
    // Só carrega quando o user não estiver mais loading e existir
    if (!userLoading && user?.id) {
      // Verificar se já carregou para este usuário recentemente
      const now = Date.now()
      const shouldReload = !lastLoadRef.current || 
        lastLoadRef.current.userId !== user.id ||
        now - lastLoadRef.current.timestamp > 2 * 60 * 1000 // 2 minutos
        
      if (shouldReload) {
        console.log('🔄 [DataContext] Carregando dados (novo usuário ou cache expirado)')
        refreshData()
      } else {
        console.log('✅ [DataContext] Usando dados em cache')
        // Carregar do cache se disponível
        const cachedData = cacheService.getUserData(`data_${user.id}`)
        if (cachedData) {
          setTotalClientes(cachedData.totalClientes || 0)
          setTotalImagens(cachedData.totalImagens || 0)
          setLoading(false)
        } else {
          refreshData()
        }
      }
    } else if (!userLoading && !user?.id) {
      // Se não está mais loading mas não tem user, para o loading
      setLoading(false)
      setTotalClientes(0)
      setTotalImagens(0)
      lastLoadRef.current = null
    }
  }, [user?.id, userLoading]) // Removido 'user' completo para evitar re-renders desnecessários

  const refreshData = async () => {
    try {
      setLoading(true)
      
      if (!user?.id) {
        setTotalClientes(0)
        setTotalImagens(0)
        return
      }

      console.log('🔄 [DataContext] Buscando dados do servidor...')
      
      // Carregar dados em paralelo
      const [clientes, imagens] = await Promise.all([
        clientesService.listar(user.id),
        imageApiService.listar() // Usa a API list-images
      ])

      const totals = {
        totalClientes: clientes.length,
        totalImagens: imagens.length
      }

      setTotalClientes(totals.totalClientes)
      setTotalImagens(totals.totalImagens)
      
      // Salvar no cache
      cacheService.setUserData(`data_${user.id}`, totals, 5 * 60 * 1000) // 5 min cache
      
      // Atualizar referência de último carregamento
      lastLoadRef.current = {
        userId: user.id,
        timestamp: Date.now()
      }
      
      console.log(`✅ [DataContext] Dados carregados: ${totals.totalClientes} clientes, ${totals.totalImagens} imagens`)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setTotalClientes(0)
      setTotalImagens(0)
      
      // Tentar carregar do cache em caso de erro
      if (user?.id) {
        const cachedData = cacheService.getUserData(`data_${user.id}`)
        if (cachedData) {
          console.log('⚠️ [DataContext] Usando dados do cache devido a erro')
          setTotalClientes(cachedData.totalClientes || 0)
          setTotalImagens(cachedData.totalImagens || 0)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const incrementClientes = () => {
    setTotalClientes(prev => {
      const newTotal = prev + 1
      // Atualizar cache
      if (user?.id) {
        const cached = cacheService.getUserData(`data_${user.id}`) || {}
        cacheService.setUserData(`data_${user.id}`, { ...cached, totalClientes: newTotal }, 5 * 60 * 1000)
      }
      return newTotal
    })
  }

  const decrementClientes = () => {
    setTotalClientes(prev => {
      const newTotal = Math.max(0, prev - 1)
      // Atualizar cache
      if (user?.id) {
        const cached = cacheService.getUserData(`data_${user.id}`) || {}
        cacheService.setUserData(`data_${user.id}`, { ...cached, totalClientes: newTotal }, 5 * 60 * 1000)
      }
      return newTotal
    })
  }

  const incrementImagens = () => {
    setTotalImagens(prev => {
      const newTotal = prev + 1
      // Atualizar cache
      if (user?.id) {
        const cached = cacheService.getUserData(`data_${user.id}`) || {}
        cacheService.setUserData(`data_${user.id}`, { ...cached, totalImagens: newTotal }, 5 * 60 * 1000)
      }
      return newTotal
    })
  }

  const decrementImagens = () => {
    setTotalImagens(prev => {
      const newTotal = Math.max(0, prev - 1)
      // Atualizar cache
      if (user?.id) {
        const cached = cacheService.getUserData(`data_${user.id}`) || {}
        cacheService.setUserData(`data_${user.id}`, { ...cached, totalImagens: newTotal }, 5 * 60 * 1000)
      }
      return newTotal
    })
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