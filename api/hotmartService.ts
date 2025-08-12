import { createClient } from '@supabase/supabase-js'

// Configuração do Supabase com service role para operações administrativas
const supabaseUrl = process.env.VITE_SUPABASE_URL!
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

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

      // Processando webhook Hotmart - log removido para produção

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
      // Erro ao processar webhook - log removido para produção
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
        // Erro ao criar perfil - log removido para produção
        // Não falhar o processo por isso
      }

      // Usuário criado - log removido para produção

      return {
        success: true,
        created: true,
        user_id: authData.user.id,
        message: 'Usuário criado com sucesso'
      }

    } catch (error) {
      // Erro ao criar usuário - log removido para produção
      return {
        success: false,
        created: false,
        message: 'Erro interno ao criar usuário',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Buscar cupom por código
   */
  private static async buscarCupom(codigo: string) {
    try {
      const { data: cupom, error } = await supabase
        .from('cupons')
        .select('id, percentual_comissao')
        .eq('codigo', codigo.toUpperCase())
        .eq('ativo', true)
        .single()

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message }
      }

      return { data: cupom, error: null }
    } catch (error) {
      return { data: null, error: 'Erro interno ao buscar cupom' }
    }
  }

  /**
   * Buscar user_id por email
   */
  private static async buscarUserIdPorEmail(email: string) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .single()

      if (error && error.code !== 'PGRST116') {
        return { data: null, error: error.message }
      }

      return { data: user?.id || null, error: null }
    } catch (error) {
      return { data: null, error: 'Erro interno ao buscar usuário' }
    }
  }

  /**
   * Registrar uso do cupom
   */
  private static async registrarUsoCupom(
    codigoCupom: string,
    emailCliente: string,
    valorCompra: number,
    orderId: string
  ): Promise<{ success: boolean; uso_id?: string; error?: string }> {
    try {
      // Buscar cupom válido
      const { data: cupom, error: cupomError } = await this.buscarCupom(codigoCupom)
      
      if (cupomError || !cupom) {
        return {
          success: false,
          error: `Cupom ${codigoCupom} não encontrado ou inativo`
        }
      }

      // Buscar user_id
      const { data: userId, error: userError } = await this.buscarUserIdPorEmail(emailCliente)
      
      if (userError || !userId) {
        return {
          success: false,
          error: 'Usuário não encontrado para registro do cupom'
        }
      }

      // Calcular comissão
      const valorComissao = valorCompra * (cupom.percentual_comissao / 100)

      // Registrar uso do cupom com schema correto
      const { data: uso, error: usoError } = await supabase
        .from('usos_cupons')
        .insert({
          cupom_id: cupom.id,
          user_id: userId,
          valor_compra: valorCompra,
          valor_comissao: valorComissao,
          origem: 'hotmart',
          hotmart_transaction_id: orderId
        })
        .select('id')
        .single()

      if (usoError || !uso) {
        return {
          success: false,
          error: usoError?.message || 'Erro ao registrar uso do cupom'
        }
      }

      return {
        success: true,
        uso_id: uso.id
      }

    } catch (error) {
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

      // Processando cancelamento - log removido para produção

      // Por enquanto, apenas registrar o cancelamento
      // Futuramente: desativar acesso, marcar cupom como cancelado, etc.

      return {
        success: true,
        message: 'Cancelamento registrado'
      }

    } catch (error) {
      // Erro ao processar cancelamento - log removido para produção
      return {
        success: false,
        message: 'Erro ao processar cancelamento',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }
}