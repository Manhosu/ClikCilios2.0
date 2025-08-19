import { supabase } from '../lib/supabase';
import { CuponsService } from './cuponsService';
export const HOTMART_CONFIG = {
    webhookSecret: import.meta.env.VITE_HOTMART_WEBHOOK_SECRET || '',
    validStatuses: ['APPROVED', 'COMPLETE', 'PAID']
};
export class HotmartService {
    static async validarAssinatura(body, signature) {
        if (!HOTMART_CONFIG.webhookSecret) {
            console.warn('⚠️ HOTMART_WEBHOOK_SECRET não configurado - webhook sem validação');
            return true;
        }
        try {
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey('raw', encoder.encode(HOTMART_CONFIG.webhookSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
            const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
            const expectedSignature = 'sha256=' + Array.from(new Uint8Array(sig))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
            return expectedSignature === signature;
        }
        catch (error) {
            console.error('❌ Erro ao validar assinatura HMAC:', error);
            return false;
        }
    }
    static async processarWebhook(webhookData) {
        try {
            const { data: { purchase } } = webhookData;
            console.log('🚀 Processando webhook Hotmart:', {
                order_id: purchase.order_id,
                buyer_email: purchase.buyer.email,
                status: purchase.status
            });
            if (!HOTMART_CONFIG.validStatuses.includes(purchase.status)) {
                return {
                    success: false,
                    message: `Status ${purchase.status} não libera acesso`
                };
            }
            const cupomCodigo = this.extrairCupom(purchase) || undefined;
            const userResult = await this.criarOuBuscarUsuario(purchase.buyer);
            if (!userResult.success) {
                return {
                    success: false,
                    message: userResult.message,
                    error: userResult.error
                };
            }
            let usoCupomId;
            if (cupomCodigo) {
                const cupomResult = await this.registrarUsoCupom(cupomCodigo, purchase.buyer.email, purchase.price.value, purchase.order_id);
                if (cupomResult.success) {
                    usoCupomId = cupomResult.uso_id;
                }
                else {
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
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro interno no processamento',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    static extrairCupom(purchase) {
        const fontes = [
            purchase.tracking?.coupon,
            purchase.tracking?.source,
            purchase.affiliations?.[0]?.coupon,
            purchase.affiliations?.[0]?.source,
            purchase.commissions?.[0]?.source
        ];
        for (const fonte of fontes) {
            if (fonte && typeof fonte === 'string' && fonte.length > 0) {
                const codigo = fonte.toUpperCase().trim();
                if (codigo.match(/^[A-Z0-9]+$/)) {
                    return codigo;
                }
            }
        }
        return null;
    }
    static async criarOuBuscarUsuario(buyer) {
        try {
            const email = buyer.email.toLowerCase().trim();
            const nome = buyer.name.trim();
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();
            if (existingUser) {
                return {
                    success: true,
                    created: false,
                    user_id: existingUser.id,
                    message: 'Usuário já existe'
                };
            }
            const tempPassword = this.gerarSenhaTemporaria();
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: email,
                password: tempPassword,
                email_confirm: true,
                user_metadata: {
                    nome: nome,
                    origem: 'hotmart',
                    created_via_webhook: true
                }
            });
            if (authError || !authData.user) {
                return {
                    success: false,
                    created: false,
                    message: 'Erro ao criar usuário no Auth',
                    error: authError?.message
                };
            }
            const { error: profileError } = await supabase
                .from('users')
                .insert({
                id: authData.user.id,
                email: email,
                nome: nome,
                is_admin: false,
                onboarding_completed: false
            });
            if (profileError) {
                console.error('❌ Erro ao criar perfil:', profileError);
            }
            console.log('✅ Usuário criado:', { email, user_id: authData.user.id });
            return {
                success: true,
                created: true,
                user_id: authData.user.id,
                message: 'Usuário criado com sucesso'
            };
        }
        catch (error) {
            console.error('❌ Erro ao criar usuário:', error);
            return {
                success: false,
                created: false,
                message: 'Erro interno ao criar usuário',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    static async registrarUsoCupom(codigoCupom, emailCliente, valorVenda, orderId) {
        try {
            const { data: cupom, error: cupomError } = await CuponsService.buscarCupomPorCodigo(codigoCupom);
            if (cupomError || !cupom) {
                return {
                    success: false,
                    error: `Cupom ${codigoCupom} não encontrado ou inativo`
                };
            }
            const { data: uso, error: usoError } = await CuponsService.registrarUsoCupom({
                cupom_id: cupom.id,
                email_cliente: emailCliente,
                valor_venda: valorVenda,
                origem: 'hotmart',
                observacoes: orderId
            });
            if (usoError || !uso) {
                return {
                    success: false,
                    error: usoError || 'Erro ao registrar uso do cupom'
                };
            }
            console.log('✅ Cupom registrado:', {
                cupom: codigoCupom,
                cliente: emailCliente,
                valor: valorVenda,
                uso_id: uso.id
            });
            return {
                success: true,
                uso_id: uso.id
            };
        }
        catch (error) {
            console.error('❌ Erro ao registrar cupom:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    static gerarSenhaTemporaria() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
        let senha = '';
        for (let i = 0; i < 12; i++) {
            senha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return senha;
    }
    static validarEstrutura(data) {
        try {
            return (data &&
                data.data &&
                data.data.purchase &&
                data.data.purchase.buyer &&
                data.data.purchase.buyer.email &&
                data.data.purchase.buyer.name &&
                data.data.purchase.status &&
                data.data.purchase.order_id);
        }
        catch {
            return false;
        }
    }
    static async processarCancelamento(webhookData) {
        try {
            const { data: { purchase } } = webhookData;
            console.log('🚫 Processando cancelamento:', {
                order_id: purchase.order_id,
                buyer_email: purchase.buyer.email
            });
            return {
                success: true,
                message: 'Cancelamento registrado'
            };
        }
        catch (error) {
            console.error('❌ Erro ao processar cancelamento:', error);
            return {
                success: false,
                message: 'Erro ao processar cancelamento',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
}
