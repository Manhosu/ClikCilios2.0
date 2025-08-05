import { supabase, isDevMode } from '../lib/supabase'

export interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  data_nascimento?: string
  observacoes?: string
  created_at: string
}

// Chave para armazenamento local
const STORAGE_KEY = 'ciliosclick_clientes'

// Gerar ID único para desenvolvimento
const generateId = () => `cliente_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

// Gerenciamento local de clientes
class ClientesLocalStorage {
  private getClientes(): Cliente[] {
    try {
      const dados = localStorage.getItem(STORAGE_KEY)
      return dados ? JSON.parse(dados) : []
    } catch (error) {
      console.warn('Erro ao carregar clientes do localStorage:', error)
      return []
    }
  }

  private salvarClientes(clientes: Cliente[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clientes))
    } catch (error) {
      console.error('Erro ao salvar clientes no localStorage:', error)
    }
  }

  async listar(): Promise<Cliente[]> {
    const clientes = this.getClientes()
    // Em modo desenvolvimento local, retornar todos os clientes (não há separação por usuário)
    return clientes
  }

  async criar(dadosCliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
    const novoCliente: Cliente = {
      ...dadosCliente,
      id: generateId(),
      created_at: new Date().toISOString()
    }

    const clientes = this.getClientes()
    clientes.push(novoCliente)
    this.salvarClientes(clientes)

    return novoCliente
  }

  async atualizar(id: string, dadosCliente: Partial<Cliente>): Promise<Cliente | null> {
    const clientes = this.getClientes()
    const index = clientes.findIndex(c => c.id === id)

    if (index === -1) return null

    clientes[index] = { ...clientes[index], ...dadosCliente }
    this.salvarClientes(clientes)

    return clientes[index]
  }

  async excluir(id: string): Promise<boolean> {
    const clientes = this.getClientes()
    const novaLista = clientes.filter(c => c.id !== id)

    if (novaLista.length === clientes.length) return false

    this.salvarClientes(novaLista)
    return true
  }
}

// Instância do gerenciador local
const clientesLocal = new ClientesLocalStorage()

// Serviço principal
export const clientesService = {
  async listar(userId: string): Promise<Cliente[]> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - carregando clientes do localStorage')
      return await clientesLocal.listar()
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      throw error
    }
  },

  async criar(userId: string, dadosCliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - salvando cliente no localStorage')
      return await clientesLocal.criar(dadosCliente)
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: userId,
          nome: dadosCliente.nome,
          email: dadosCliente.email || null,
          telefone: dadosCliente.telefone || null,
          data_nascimento: dadosCliente.data_nascimento || null,
          observacoes: dadosCliente.observacoes || null
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao criar cliente:', error)
      throw error
    }
  },

  async atualizar(id: string, dadosCliente: Partial<Cliente>): Promise<Cliente | null> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - atualizando cliente no localStorage')
      return await clientesLocal.atualizar(id, dadosCliente)
    }

    try {
      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: dadosCliente.nome,
          email: dadosCliente.email || null,
          telefone: dadosCliente.telefone || null,
          data_nascimento: dadosCliente.data_nascimento || null,
          observacoes: dadosCliente.observacoes || null
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      throw error
    }
  },

  async excluir(id: string): Promise<boolean> {
    if (isDevMode) {
      console.info('🔧 Modo desenvolvimento - excluindo cliente do localStorage')
      return await clientesLocal.excluir(id)
    }

    try {
      const { error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Erro ao excluir cliente:', error)
      throw error
    }
  }
}