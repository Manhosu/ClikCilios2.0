import { supabase } from '../lib/supabase'

export interface Configuracoes {
  id?: string
  user_id: string
  tema: 'claro' | 'escuro'
  notificacoes_email: boolean
  notificacoes_push: boolean
  idioma: 'pt-BR' | 'en-US' | 'es-ES'
  timezone: string
  formato_data: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
  formato_hora: '12h' | '24h'
  moeda: 'BRL' | 'USD' | 'EUR'
  backup_automatico: boolean
  backup_frequencia: 'diario' | 'semanal' | 'mensal'
  created_at?: string
  updated_at?: string
}

// Configurações padrão
const configuracoesDefault: Omit<Configuracoes, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  tema: 'claro',
  notificacoes_email: true,
  notificacoes_push: true,
  idioma: 'pt-BR',
  timezone: 'America/Sao_Paulo',
  formato_data: 'DD/MM/YYYY',
  formato_hora: '24h',
  moeda: 'BRL',
  backup_automatico: true,
  backup_frequencia: 'semanal'
}

export const configuracoesService = {
  async obter(userId: string): Promise<Configuracoes> {
    const { data, error } = await supabase
      .from('configuracoes_usuario')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Erro ao carregar configurações: ${error.message}`)
    }

    if (!data) {
      // Criar configurações padrão se não existirem
      return await this.criar(userId)
    }

    return data
  },

  async criar(userId: string): Promise<Configuracoes> {
    const novasConfiguracoes: Omit<Configuracoes, 'id' | 'created_at' | 'updated_at'> = {
      ...configuracoesDefault,
      user_id: userId
    }

    const { data, error } = await supabase
      .from('configuracoes_usuario')
      .insert(novasConfiguracoes)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao criar configurações: ${error.message}`)
    }

    return data
  },

  async atualizar(userId: string, configuracoes: Partial<Configuracoes>): Promise<Configuracoes> {
    const { data, error } = await supabase
      .from('configuracoes_usuario')
      .update({
        ...configuracoes,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erro ao atualizar configurações: ${error.message}`)
    }

    return data
  }
}