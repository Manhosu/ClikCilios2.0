import { createClient } from '@supabase/supabase-js'

// Detectar se estamos em ambiente de API (Vercel) ou frontend (Vite)
const isApiContext = typeof import.meta === 'undefined' || !import.meta.env

const supabaseUrl = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY

// Sistema sempre em produção - verificar se credenciais estão configuradas
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Credenciais do Supabase não configuradas. Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
}

console.info('✅ Supabase configurado corretamente!')
console.info('URL:', supabaseUrl)

export const supabase = createClient(
  supabaseUrl, 
  supabaseAnonKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key: string) => {
          try {
            return localStorage.getItem(key)
          } catch (error) {
            console.warn('Erro ao ler localStorage:', error)
            return null
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value)
          } catch (error) {
            console.warn('Erro ao escrever localStorage:', error)
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key)
          } catch (error) {
            console.warn('Erro ao remover localStorage:', error)
          }
        }
      },
      flowType: 'pkce'
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

export const isDevMode = false

// Tipos customizados para o banco de dados
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nome: string
          created_at: string
          updated_at: string
          is_admin?: boolean
          onboarding_completed?: boolean
        }
        Insert: {
          id: string
          email: string
          nome: string
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          onboarding_completed?: boolean
        }
        Update: {
          id?: string
          email?: string
          nome?: string
          created_at?: string
          updated_at?: string
          is_admin?: boolean
          onboarding_completed?: boolean
        }
      }
      clientes: {
        Row: {
          id: string
          user_id: string
          nome: string
          email?: string
          telefone?: string
          data_nascimento?: string
          observacoes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          nome: string
          email?: string
          telefone?: string
          data_nascimento?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          email?: string
          telefone?: string
          data_nascimento?: string
          observacoes?: string
          created_at?: string
          updated_at?: string
        }
      }
      configuracoes_usuario: {
        Row: {
          id: string
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
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tema?: 'claro' | 'escuro'
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          idioma?: 'pt-BR' | 'en-US' | 'es-ES'
          timezone?: string
          formato_data?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
          formato_hora?: '12h' | '24h'
          moeda?: 'BRL' | 'USD' | 'EUR'
          backup_automatico?: boolean
          backup_frequencia?: 'diario' | 'semanal' | 'mensal'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tema?: 'claro' | 'escuro'
          notificacoes_email?: boolean
          notificacoes_push?: boolean
          idioma?: 'pt-BR' | 'en-US' | 'es-ES'
          timezone?: string
          formato_data?: 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD'
          formato_hora?: '12h' | '24h'
          moeda?: 'BRL' | 'USD' | 'EUR'
          backup_automatico?: boolean
          backup_frequencia?: 'diario' | 'semanal' | 'mensal'
          created_at?: string
          updated_at?: string
        }
      }
      imagens_clientes: {
        Row: {
          id: string
          cliente_id: string
          user_id: string
          nome: string
          url: string
          tipo?: 'antes' | 'depois' | 'processo'
          descricao?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          width?: number
          height?: number
          storage_path?: string
          created_at: string
          updated_at?: string
        }
        Insert: {
          id?: string
          cliente_id: string
          user_id: string
          nome: string
          url: string
          tipo?: 'antes' | 'depois' | 'processo'
          descricao?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          width?: number
          height?: number
          storage_path?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cliente_id?: string
          user_id?: string
          nome?: string
          url?: string
          tipo?: 'antes' | 'depois' | 'processo'
          descricao?: string
          filename?: string
          original_name?: string
          file_size?: number
          mime_type?: string
          width?: number
          height?: number
          storage_path?: string
          created_at?: string
          updated_at?: string
        }
      }
      cupons: {
        Row: {
          id: string
          codigo: string
          parceira_nome: string
          parceira_email: string
          percentual_comissao: number
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          codigo: string
          parceira_nome: string
          parceira_email: string
          percentual_comissao?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          codigo?: string
          parceira_nome?: string
          parceira_email?: string
          percentual_comissao?: number
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usos_cupons: {
        Row: {
          id: string
          cupom_id: string
          user_id: string
          valor_compra: number
          valor_comissao: number
          origem: string
          hotmart_transaction_id?: string
          created_at: string
        }
        Insert: {
          id?: string
          cupom_id: string
          user_id: string
          valor_compra: number
          valor_comissao: number
          origem?: string
          hotmart_transaction_id?: string
          created_at?: string
        }
        Update: {
          id?: string
          cupom_id?: string
          user_id?: string
          valor_compra?: number
          valor_comissao?: number
          origem?: string
          hotmart_transaction_id?: string
          created_at?: string
        }
      }
    }
  }
}