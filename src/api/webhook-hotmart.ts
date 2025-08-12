import { HotmartService, HotmartWebhookData } from '../services/hotmartService';

// Configuração do webhook
const WEBHOOK_CONFIG = {
  secret: import.meta.env.VITE_HOTMART_WEBHOOK_SECRET || '',
  validEvents: [
    'PURCHASE_APPROVED',
    'PURCHASE_COMPLETE',
    'PURCHASE_CANCELLED',
    'PURCHASE_REFUNDED',
    'PURCHASE_CHARGEBACK'
  ]
};

/**
 * Processar webhook da Hotmart - NOVA VERSÃO SEM PRE_USERS
 */
export async function processarWebhookHotmart(
  request: Request
): Promise<Response> {
  try {
    // 1. Ler corpo da requisição
    const body = await request.text();
    const signature = request.headers.get('x-hotmart-signature') || '';
    
    console.log('📨 Webhook recebido da Hotmart');
    
    // 2. Validar assinatura usando HotmartService
    const assinaturaValida = await HotmartService.validarAssinatura(body, signature);
    if (!assinaturaValida) {
      console.error('❌ Assinatura inválida do webhook');
      return new Response(
        JSON.stringify({ success: false, error: 'Assinatura inválida' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 3. Parsear dados
    let webhookData: HotmartWebhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('❌ Erro ao parsear JSON do webhook:', error);
      return new Response(
        JSON.stringify({ success: false, error: 'JSON inválido' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // 4. Validar estrutura usando HotmartService
    if (!HotmartService.validarEstrutura(webhookData)) {
      console.error('❌ Estrutura inválida do webhook:', webhookData);
      return new Response(
        JSON.stringify({ success: false, error: 'Estrutura inválida' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`🔄 Processando evento: ${webhookData.event}`);
    console.log(`👤 Comprador: ${webhookData.data.purchase.buyer.email}`);
    console.log(`💳 Order ID: ${webhookData.data.purchase.order_id}`);
    
    let resultado;
    
    // 5. Processar baseado no tipo de evento usando HotmartService
    switch (webhookData.event) {
      case 'PURCHASE_APPROVED':
      case 'PURCHASE_COMPLETE':
        // Processar compra aprovada - criar usuário real
        resultado = await HotmartService.processarWebhook(webhookData);
        break;
        
      case 'PURCHASE_CANCELLED':
      case 'PURCHASE_REFUNDED':
      case 'PURCHASE_CHARGEBACK':
        // Processar cancelamento/reembolso
        resultado = await HotmartService.processarCancelamento(webhookData);
        break;
        
      default:
        resultado = {
          success: true,
          message: 'Evento processado (sem ação específica)'
        };
    }
    
    // 6. Log do resultado
    if (resultado.success) {
      console.log(`✅ Webhook processado com sucesso: ${resultado.message}`);
    } else {
      console.error(`❌ Erro no processamento: ${resultado.message}`);
    }
    
    // 7. Retornar resposta
    return new Response(
      JSON.stringify(resultado),
      { 
        status: resultado.success ? 200 : 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Erro fatal no webhook:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Erro interno do servidor'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Handler para requisições GET (teste do endpoint)
 */
export async function testarWebhookHotmart(): Promise<Response> {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'Webhook Hotmart funcionando - VERSÃO ATUALIZADA',
      timestamp: new Date().toISOString(),
      config: {
        webhook_secret_configured: !!WEBHOOK_CONFIG.secret,
        valid_events: WEBHOOK_CONFIG.validEvents
      },
      status: 'Agora cria usuários reais diretamente via HotmartService'
    }),
    { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    }
  );
}