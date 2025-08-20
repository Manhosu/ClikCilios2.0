import { supabase } from '../lib/supabase'
import { cacheService } from './cacheService'

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
      // Validar e normalizar data de nascimento
      let dataNascimento = dadosCliente.data_nascimento || null;
      if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
        throw new Error('Data de nascimento deve estar no formato YYYY-MM-DD');
      }

      const { data, error } = await supabase
        .from('clientes')
        .insert({
          user_id: userId,
          nome: dadosCliente.nome,
          email: dadosCliente.email || null,
          telefone: dadosCliente.telefone || null,
          data_nascimento: dataNascimento,
          observacoes: dadosCliente.observacoes || null
        })
        .select()
        .single()

      if (error) throw error
      
      // Invalidar cache e notificar sobre criação
      cacheService.invalidateClientsCache(userId, 'created')
      
      return data
    } catch (error) {
      throw error
    }
  },

  async atualizar(id: string, dadosCliente: Partial<Cliente>): Promise<Cliente | null> {
    try {
      // Validar e normalizar data de nascimento
      let dataNascimento = dadosCliente.data_nascimento || null;
      if (dataNascimento && !/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
        throw new Error('Data de nascimento deve estar no formato YYYY-MM-DD');
      }

      const { data, error } = await supabase
        .from('clientes')
        .update({
          nome: dadosCliente.nome,
          email: dadosCliente.email || null,
          telefone: dadosCliente.telefone || null,
          data_nascimento: dataNascimento,
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
      // Primeiro buscar o cliente para obter o user_id
      const { data: cliente, error: selectError } = await supabase
        .from('clientes')
        .select('user_id')
        .eq('id', id)
        .single()

      if (selectError) throw selectError
      
      const { data, error } = await supabase
        .from('clientes')
        .delete()
        .eq('id', id)
        .select()

      if (error) throw error
      
      if (!data || data.length === 0) {
        return false
      }
      
      // Invalidar cache e notificar sobre exclusão
      if (cliente?.user_id) {
        cacheService.invalidateClientsCache(cliente.user_id, 'deleted')
      }
      
      return true
    } catch (error) {
      throw error
    }
  }
}