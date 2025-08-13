import { createClient } from '@supabase/supabase-js'

// Detectar se estamos em ambiente de API (Vercel) ou frontend (Vite)
const isApiContext = typeof import.meta === 'undefined' || !import.meta.env

const supabaseUrl = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  : import.meta.env.VITE_SUPABASE_URL

const supabaseAnonKey = isApiContext 
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
  : import.meta.env.VITE_SUPABASE_ANON_KEY

// Modo desenvolvimento - usar credenciais demo se não configuradas
const isDevelopment = !supabaseUrl || !supabaseAnonKey

if (isDevelopment) {
  // Log de desenvolvimento apenas uma vez
  if (!(globalThis as any).__SUPABASE_DEV_LOGGED__) {
    console.info('🔧 Modo desenvolvimento ativo - Configure .env.local para produção')
    ;(globalThis as any).__SUPABASE_DEV_LOGGED__ = true
  }
} else {
  console.info('✅ Supabase configurado corretamente!')
}

// Credenciais para desenvolvimento (não funcionais, apenas para evitar erros)
const devUrl = 'https://demo.supabase.co'
const devKey = 'demo-key'

export const supabase = createClient(
  supabaseUrl || devUrl, 
  supabaseAnonKey || devKey, 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)

// Mock para desenvolvimento
export const isDevMode = isDevelopment

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