import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
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
                    console.warn('⚠️ Erro ao registrar cupom:', cupomResult.error);
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
                .select('id, auth_user_id')
                .eq('email', email)
                .single();
            if (existingUser) {
                return {
                    success: true,
                    created: false,
                    user_id: existingUser.auth_user_id,
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
                email: email,
                nome: nome,
                tipo: 'profissional',
                auth_user_id: authData.user.id
            });
            if (profileError) {
            }
            return {
                success: true,
                created: true,
                user_id: authData.user.id,
                message: 'Usuário criado com sucesso'
            };
        }
        catch (error) {
            return {
                success: false,
                created: false,
                message: 'Erro interno ao criar usuário',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
    static async buscarCupom(codigo) {
        try {
            const { data: cupom, error } = await supabase
                .from('cupons')
                .select('id, percentual_comissao')
                .eq('codigo', codigo.toUpperCase())
                .eq('ativo', true)
                .single();
            if (error && error.code !== 'PGRST116') {
                return { data: null, error: error.message };
            }
            return { data: cupom, error: null };
        }
        catch (error) {
            return { data: null, error: 'Erro interno ao buscar cupom' };
        }
    }
    static async buscarUserIdPorEmail(email) {
        try {
            const { data: user, error } = await supabase
                .from('users')
                .select('id')
                .eq('email', email.toLowerCase())
                .single();
            if (error && error.code !== 'PGRST116') {
                return { data: null, error: error.message };
            }
            return { data: user?.id || null, error: null };
        }
        catch (error) {
            return { data: null, error: 'Erro interno ao buscar usuário' };
        }
    }
    static async registrarUsoCupom(codigoCupom, emailCliente, valorCompra, orderId) {
        try {
            const { data: cupom, error: cupomError } = await this.buscarCupom(codigoCupom);
            if (cupomError || !cupom) {
                return {
                    success: false,
                    error: `Cupom ${codigoCupom} não encontrado ou inativo`
                };
            }
            const { data: userId, error: userError } = await this.buscarUserIdPorEmail(emailCliente);
            if (userError || !userId) {
                return {
                    success: false,
                    error: 'Usuário não encontrado para registro do cupom'
                };
            }
            const valorComissao = valorCompra * (cupom.percentual_comissao / 100);
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
                .single();
            if (usoError || !uso) {
                return {
                    success: false,
                    error: usoError?.message || 'Erro ao registrar uso do cupom'
                };
            }
            return {
                success: true,
                uso_id: uso.id
            };
        }
        catch (error) {
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
    static async processarCancelamento() {
        try {
            return {
                success: true,
                message: 'Cancelamento registrado'
            };
        }
        catch (error) {
            return {
                success: false,
                message: 'Erro ao processar cancelamento',
                error: error instanceof Error ? error.message : 'Erro desconhecido'
            };
        }
    }
}
