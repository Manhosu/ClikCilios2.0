import { supabase } from '../lib/supabase'

export interface Cliente {
  id: string
  nome: string
  email?: string
  telefone?: string
  data_nascimento?: string
  observacoes?: string
  created_at: string
}

// Serviço principal
export const clientesService = {
  async listar(userId: string): Promise<Cliente[]> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .eq('user_id', userId)
        .order('nome')

      if (error) throw error
      return data || []
    } catch (error) {
      throw error
    }
  },

  async criar(userId: string, dadosCliente: Omit<Cliente, 'id' | 'created_at'>): Promise<Cliente> {
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
      throw error
    }
  },

  async atualizar(id: string, dadosCliente: Partial<Cliente>): Promise<Cliente | null> {
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
      throw error
    }
  },

  async excluir(id: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      
      if (!data || data.length === 0) {
        return false
      }
      
      return true
    } catch (error) {
      throw error
    }
  }
}