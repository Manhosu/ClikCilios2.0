import { isDevMode } from '../lib/supabase'

export interface Configuracoes {
  id?: string
  tema: 'claro'
  auto_salvar: boolean
}

// Chave para armazenamento local
const STORAGE_KEY = 'ciliosclick_configuracoes'

// Configurações padrão
const DEFAULT_CONFIGURACOES: Configuracoes = {
  tema: 'claro',
  auto_salvar: true
}

// Gerenciamento local de configurações
class ConfiguracoesLocalStorage {
  private getConfiguracoes(): Configuracoes {
    try {
      const dados = localStorage.getItem(STORAGE_KEY)
      return dados ? { ...DEFAULT_CONFIGURACOES, ...JSON.parse(dados) } : DEFAULT_CONFIGURACOES
    } catch (error) {
      console.warn('Erro ao carregar configurações do localStorage:', error)
      return DEFAULT_CONFIGURACOES
    }
  }

  private salvarConfiguracoes(configuracoes: Configuracoes): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(configuracoes))
    } catch (error) {
      console.error('Erro ao salvar configurações no localStorage:', error)
    }
  }

  async carregar(userId: string): Promise<Configuracoes> {
    return this.getConfiguracoes()
  }

  async salvar(userId: string, configuracoes: Configuracoes): Promise<Configuracoes> {
    const configComId = {
      ...configuracoes,
      id: configuracoes.id || `config_${userId}_${Date.now()}`
    }
    
    this.salvarConfiguracoes(configComId)
    return configComId
  }
}

// Instância do gerenciador local
const configuracoesLocal = new ConfiguracoesLocalStorage()

// Serviço principal
export const configuracoesService = {
  async carregar(userId: string): Promise<Configuracoes> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - carregando configurações do localStorage')
      return await configuracoesLocal.carregar(userId)
    }

    // TODO: Implementar integração com Supabase quando tabela 'configuracoes_usuario' for criada
    console.warn('⚠️ Tabela configuracoes_usuario não implementada no Supabase ainda')
    return DEFAULT_CONFIGURACOES
  },

  async salvar(userId: string, configuracoes: Configuracoes): Promise<Configuracoes> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - salvando configurações no localStorage')
      return await configuracoesLocal.salvar(userId, configuracoes)
    }

    // TODO: Implementar integração com Supabase quando tabela 'configuracoes_usuario' for criada
    throw new Error('Tabela configuracoes_usuario não implementada no Supabase ainda')
  }
} 