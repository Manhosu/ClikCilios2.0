import { supabase } from '../lib/supabase'
import { CuponsService } from './cuponsService'

// Configurações da Hotmart
export const HOTMART_CONFIG = {
  webhookSecret: import.meta.env.VITE_HOTMART_WEBHOOK_SECRET || '',
  validStatuses: ['APPROVED', 'COMPLETE', 'PAID'] // Status que liberam acesso
}

// Interface para dados do webhook da Hotmart
export interface HotmartWebhookData {
  id: string
  event: string
  data: {
    purchase: {
      order_id: string
      order_date: number
      status: string
      buyer: {
        name: string
        email: string
      }
      offer: {
        code: string
        name: string
      }
      price: {
        value: number
        currency_code: string
      }
      affiliations?: Array<{
        affiliate: {
          name: string
          email: string
        }
        source?: string
        coupon?: string
      }>
      commissions?: Array<{
        source: string
        value: number
        currency_code: string
      }>
      tracking?: {
        source?: string
        coupon?: string
        utm_source?: string
        utm_medium?: string
        utm_campaign?: string
      }
    }
  }
}

// Interface para resposta do processamento
export interface ProcessamentoHotmart {
  success: boolean
  message: string
  data?: {
    user_created: boolean
    user_id?: string
    cupom_usado?: string
    uso_cupom_id?: string
  }
  error?: string
}

/**
 * Serviço para integração com Hotmart
 */
export class HotmartService {

  /**
   * Validar assinatura HMAC do webhook
   */
  static async validarAssinatura(body: string, signature: string): Promise<boolean> {
    if (!HOTMART_CONFIG.webhookSecret) {
      console.warn('⚠️ HOTMART_WEBHOOK_SECRET não configurado - webhook sem validação')
      return true // Permitir em desenvolvimento
    }

    try {
      // Implementar validação HMAC-SHA256
      const encoder = new TextEncoder()
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(HOTMART_CONFIG.webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
      const expectedSignature = 'sha256=' + Array.from(new Uint8Array(sig))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      return expectedSignature === signature
    } catch (error) {
      console.error('❌ Erro ao validar assinatura HMAC:', error)
      return false
    }
  }

  /**
   * Processar webhook da Hotmart
   */
  static async processarWebhook(webhookData: HotmartWebhookData): Promise<ProcessamentoHotmart> {
    try {
      const { data: { purchase } } = webhookData

      console.log('🚀 Processando webhook Hotmart:', {
        order_id: purchase.order_id,
        buyer_email: purchase.buyer.email,
        status: purchase.status
      })

      // Verificar se o status libera acesso
      if (!HOTMART_CONFIG.validStatuses.includes(purchase.status)) {
        return {
          success: false,
          message: `Status ${purchase.status} não libera acesso`
        }
      }

      // Extrair informações do cupom
      const cupomCodigo = this.extrairCupom(purchase) || undefined
      
      // Criar ou buscar usuário
      const userResult = await this.criarOuBuscarUsuario(purchase.buyer)
      if (!userResult.success) {
        return {
          success: false,
          message: userResult.message,
          error: userResult.error
        }
      }

      // Registrar uso do cupom se presente
      let usoCupomId: string | undefined
      if (cupomCodigo) {
        const cupomResult = await this.registrarUsoCupom(
          cupomCodigo,
          purchase.buyer.email,
          purchase.price.value,
          purchase.order_id
        )
        
        if (cupomResult.success) {
          usoCupomId = cupomResult.uso_id
        } else {
          console.warn('⚠️ Erro ao registrar cupom:', cupomResult.error)
        }
      }

      return {
        success: true,
        message: 'Compra processada com sucesso',
        data: {
          user_created: userResult.created,
          user_id: userResult.user_id,
          cupom_usado: cupomCodigo,
          uso_cupom_id: usoCupomId
        }
      }

    } catch (error) {
      console.error('❌ Erro ao processar webhook:', error)
      return {
        success: false,
        message: 'Erro interno no processamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Extrair código do cupom dos dados de tracking
   */
  private static extrairCupom(purchase: any): string | null {
    // Verificar várias fontes possíveis do cupom
    const fontes = [
      purchase.tracking?.coupon,
      purchase.tracking?.source,
      purchase.affiliations?.[0]?.coupon,
      purchase.affiliations?.[0]?.source,
      purchase.commissions?.[0]?.source
    ]

    for (const fonte of fontes) {
      if (fonte && typeof fonte === 'string' && fonte.length > 0) {
        // Normalizar código do cupom
        const codigo = fonte.toUpperCase().trim()
        if (codigo.match(/^[A-Z0-9]+$/)) { // Apenas letras e números
          return codigo
        }
      }
    }

    return null
  }

  /**
   * Criar ou buscar usuário no Supabase Auth
   */
  private static async criarOuBuscarUsuario(buyer: any): Promise<{
    success: boolean
    created: boolean
    user_id?: string
    message: string
    error?: string
  }> {
    try {
      const email = buyer.email.toLowerCase().trim()
      const nome = buyer.name.trim()

      // Verificar se usuário já existe
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, auth_user_id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return {
          success: true,
          created: false,
          user_id: existingUser.auth_user_id,
          message: 'Usuário já existe'
        }
      }

      // Criar usuário no Supabase Auth
      const tempPassword = this.gerarSenhaTemporaria()
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // Confirmar email automaticamente
        user_metadata: {
          nome: nome,
          origem: 'hotmart',
          created_via_webhook: true
        }
      })

      if (authError || !authData.user) {
        return {
          success: false,
          created: false,
          message: 'Erro ao criar usuário no Auth',
          error: authError?.message
        }
      }

      // Criar perfil na tabela users
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          email: email,
          nome: nome,
          tipo: 'profissional',
          auth_user_id: authData.user.id
        })

      if (profileError) {
        console.error('❌ Erro ao criar perfil:', profileError)
        // Não falhar o processo por isso
      }

      console.log('✅ Usuário criado:', { email, user_id: authData.user.id })

      return {
        success: true,
        created: true,
        user_id: authData.user.id,
        message: 'Usuário criado com sucesso'
      }

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error)
      return {
        success: false,
        created: false,
        message: 'Erro interno ao criar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Registrar uso do cupom
   */
  private static async registrarUsoCupom(
    codigoCupom: string,
    emailCliente: string,
    valorVenda: number,
    orderId: string
  ): Promise<{ success: boolean; uso_id?: string; error?: string }> {
    try {
      // Buscar cupom válido
      const { data: cupom, error: cupomError } = await CuponsService.buscarCupomPorCodigo(codigoCupom)
      
      if (cupomError || !cupom) {
        return {
          success: false,
          error: `Cupom ${codigoCupom} não encontrado ou inativo`
        }
      }

      // Registrar uso
      const { data: uso, error: usoError } = await CuponsService.registrarUsoCupom({
        cupom_id: cupom.id,
        email_cliente: emailCliente,
        valor_venda: valorVenda,
        origem: 'hotmart',
        observacoes: `Compra Hotmart - Order ID: ${orderId}`
      })

      if (usoError || !uso) {
        return {
          success: false,
          error: usoError || 'Erro ao registrar uso do cupom'
        }
      }

      console.log('✅ Cupom registrado:', {
        cupom: codigoCupom,
        cliente: emailCliente,
        valor: valorVenda,
        uso_id: uso.id
      })

      return {
        success: true,
        uso_id: uso.id
      }

    } catch (error) {
      console.error('❌ Erro ao registrar cupom:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Gerar senha temporária para novos usuários
   */
  private static gerarSenhaTemporaria(): string {
    // Gerar senha segura temporária
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
    let senha = ''
    for (let i = 0; i < 12; i++) {
      senha += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return senha
  }

  /**
   * Validar estrutura do webhook
   */
  static validarEstrutura(data: any): data is HotmartWebhookData {
    try {
      return (
        data &&
        data.data &&
        data.data.purchase &&
        data.data.purchase.buyer &&
        data.data.purchase.buyer.email &&
        data.data.purchase.buyer.name &&
        data.data.purchase.status &&
        data.data.purchase.order_id
      )
    } catch {
      return false
    }
  }

  /**
   * Processar cancelamento de compra
   */
  static async processarCancelamento(webhookData: HotmartWebhookData): Promise<ProcessamentoHotmart> {
    try {
      const { data: { purchase } } = webhookData

      console.log('🚫 Processando cancelamento:', {
        order_id: purchase.order_id,
        buyer_email: purchase.buyer.email
      })

      // Por enquanto, apenas registrar o cancelamento
      // Futuramente: desativar acesso, marcar cupom como cancelado, etc.

      return {
        success: true,
        message: 'Cancelamento registrado'
      }

    } catch (error) {
      console.error('❌ Erro ao processar cancelamento:', error)
      return {
        success: false,
        message: 'Erro ao processar cancelamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
} 