import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
const HOTMART_CONFIG = {
    webhookSecret: process.env.VITE_HOTMART_WEBHOOK_SECRET || '',
    validStatuses: ['APPROVED', 'COMPLETE', 'PAID']
};
function validarAssinatura(body, signature) {
    try {
        const expectedSignature = crypto
            .createHmac('sha256', HOTMART_CONFIG.webhookSecret)
            .update(body)
            .digest('hex');
        const receivedSignature = signature.replace('sha256=', '');
        return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(receivedSignature, 'hex'));
    }
    catch (error) {
        return false;
    }
}
function validarEstrutura(data) {
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
function gerarSenhaTemporaria() {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
}
async function criarOuBuscarUsuario(buyer) {
    try {
        const email = buyer.email.toLowerCase().trim();
        const nome = buyer.name.trim();
        const { data: existingProfile } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();
        if (existingProfile) {
            return {
                success: true,
                user_id: existingProfile.id,
                created: false
            };
        }
        const senhaTemporaria = gerarSenhaTemporaria();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: email,
            password: senhaTemporaria,
            email_confirm: true,
            user_metadata: {
                nome: nome,
                created_by: 'hotmart_webhook'
            }
        });
        if (authError) {
            return {
                success: false,
                message: 'Erro ao criar usuário no Auth',
                error: authError.message
            };
        }
        const { error: profileError } = await supabase
            .from('users')
            .insert({
            id: authData.user.id,
            email: email,
            nome: nome,
            is_admin: false,
            onboarding_completed: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });
        if (profileError) {
            return {
                success: false,
                message: 'Erro ao criar perfil do usuário',
                error: profileError.message
            };
        }
        return {
            success: true,
            user_id: authData.user.id,
            created: true,
            senha_temporaria: senhaTemporaria
        };
    }
    catch (error) {
        return {
            success: false,
            message: 'Erro interno ao processar usuário',
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        };
    }
}
async function registrarUsoCupom(cupomCodigo, userId, valorCompra, orderId) {
    try {
        const { data: cupom, error: cupomError } = await supabase
            .from('cupons')
            .select('id')
            .eq('codigo', cupomCodigo)
            .eq('ativo', true)
            .single();
        if (cupomError || !cupom) {
            return null;
        }
        const { data: usoCupom, error: usoError } = await supabase
            .from('usos_cupons')
            .insert({
            cupom_id: cupom.id,
            user_id: userId,
            valor_compra: valorCompra,
            valor_comissao: valorCompra * 0.1,
            origem: 'hotmart',
            hotmart_transaction_id: orderId,
            created_at: new Date().toISOString()
        })
            .select()
            .single();
        if (usoError) {
            return null;
        }
        return usoCupom.id;
    }
    catch (error) {
        return null;
    }
}
async function processarWebhook(webhookData) {
    try {
        const { data: { purchase } } = webhookData;
        if (!HOTMART_CONFIG.validStatuses.includes(purchase.status)) {
            return {
                success: false,
                message: `Status ${purchase.status} não libera acesso`
            };
        }
        const userResult = await criarOuBuscarUsuario(purchase.buyer);
        if (!userResult.success) {
            return {
                success: false,
                message: userResult.message,
                error: userResult.error
            };
        }
        let usoCupomId = null;
        const cupomCodigo = purchase.tracking?.coupon || purchase.tracking?.source;
        if (cupomCodigo && userResult.user_id) {
            usoCupomId = await registrarUsoCupom(cupomCodigo, userResult.user_id, purchase.price.value, purchase.order_id);
        }
        return {
            success: true,
            message: 'Compra processada com sucesso',
            data: {
                user_created: userResult.created,
                user_id: userResult.user_id,
                cupom_usado: cupomCodigo || null,
                uso_cupom_id: usoCupomId,
                senha_temporaria: userResult.senha_temporaria
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
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Hotmart-Signature');
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido' });
    }
    try {
        const signature = req.headers['x-hotmart-signature'];
        if (!signature) {
            return res.status(401).json({ error: 'Assinatura HMAC necessária' });
        }
        const body = JSON.stringify(req.body);
        const assinaturaValida = validarAssinatura(body, signature);
        if (!assinaturaValida) {
            return res.status(401).json({ error: 'Assinatura HMAC inválida' });
        }
        if (!validarEstrutura(req.body)) {
            return res.status(400).json({ error: 'Estrutura de dados inválida' });
        }
        let resultado;
        const evento = req.body.event;
        switch (evento) {
            case 'PURCHASE_APPROVED':
            case 'PURCHASE_COMPLETE':
                resultado = await processarWebhook(req.body);
                break;
            case 'PURCHASE_CANCELED':
            case 'PURCHASE_REFUNDED':
            case 'PURCHASE_CHARGEBACK':
                return res.status(200).json({
                    message: `Evento ${evento} recebido mas não processado`
                });
            default:
                return res.status(200).json({
                    message: 'Evento não reconhecido'
                });
        }
        return res.status(resultado.success ? 200 : 400).json(resultado);
    }
    catch (error) {
        console.error('❌ Erro fatal no webhook:', error);
        return res.status(500).json({
            success: false,
            error: 'Erro interno do servidor'
        });
    }
}
