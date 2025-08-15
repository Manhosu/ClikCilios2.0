import { supabase } from '../lib/supabase'
import { generateId } from '../utils/generateId'
// Force update to trigger Vite recompilation

export interface ImagemCliente {
  id: string
  cliente_id: string
  user_id: string
  nome: string
  url: string
  tipo: 'antes' | 'depois' | 'processo'
  descricao?: string
  created_at: string
}

// Serviço principal
export const imagensService = {
  async listar(clienteId?: string): Promise<ImagemCliente[]> {
    try {
      let query = supabase
        .from('imagens_clientes')
        .select('*')
        .order('created_at', { ascending: false })

      if (clienteId) {
        query = query.eq('cliente_id', clienteId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao carregar imagens:', error)
        throw new Error(`Erro ao carregar imagens: ${error.message}`)
      }

      return data || []
    } catch (error) {
      console.error('Erro na consulta de imagens:', error)
      throw error
    }
  },

  async criar(dadosImagem: Omit<ImagemCliente, 'id' | 'created_at'>): Promise<ImagemCliente> {
    try {
      const novaImagem = {
        ...dadosImagem,
        id: generateId(),
        created_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('imagens_clientes')
        .insert([novaImagem])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar imagem:', error)
        throw new Error(`Erro ao criar imagem: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro na criação de imagem:', error)
      throw error
    }
  },

  async atualizar(id: string, dadosImagem: Partial<ImagemCliente>): Promise<ImagemCliente | null> {
    try {
      const { data, error } = await supabase
        .from('imagens_clientes')
        .update(dadosImagem)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar imagem:', error)
        throw new Error(`Erro ao atualizar imagem: ${error.message}`)
      }

      return data
    } catch (error) {
      console.error('Erro na atualização de imagem:', error)
      throw error
    }
  },

  async excluir(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('imagens_clientes')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir imagem:', error)
        throw new Error(`Erro ao excluir imagem: ${error.message}`)
      }

      return true
    } catch (error) {
      console.error('Erro na exclusão de imagem:', error)
      throw error
    }
  }
}