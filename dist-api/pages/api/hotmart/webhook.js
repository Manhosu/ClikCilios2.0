import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
const hotmartSupabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const hotmartUsersService = {
    async assignUserToHotmart(buyerEmail, buyerName, transactionId, notificationId) {
        try {
            const { data: availableUsers, error: fetchError } = await hotmartSupabase
                .from('users')
                .select('*')
                .eq('is_admin', false)
                .eq('status', 'available')
                .is('hotmart_buyer_email', null)
                .order('created_at', { ascending: true })
                .limit(1);
            if (fetchError) {
                throw fetchError;
            }
            if (!availableUsers || availableUsers.length === 0) {
                return {
                    success: false,
                    message: 'Nenhum usuário disponível para atribuição'
                };
            }
            const user = availableUsers[0];
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);
            const { error: updateError } = await hotmartSupabase
                .from('users')
                .update({
                status: 'occupied',
                hotmart_buyer_email: buyerEmail,
                hotmart_buyer_name: buyerName,
                hotmart_transaction_id: transactionId,
                hotmart_notification_id: notificationId,
                assigned_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString(),
                updated_at: new Date().toISOString()
            })
                .eq('id', user.id);
            if (updateError) {
                throw updateError;
            }
            return {
                success: true,
                user_id: user.id,
                username: user.username,
                message: 'Usuário atribuído com sucesso'
            };
        }
        catch (error) {
            console.error('Erro ao atribuir usuário:', error);
            throw error;
        }
    },
    async releaseUserByTransaction(transactionId) {
        try {
            const { data: users, error: fetchError } = await hotmartSupabase
                .from('users')
                .select('*')
                .eq('hotmart_transaction_id', transactionId);
            if (fetchError) {
                throw fetchError;
            }
            if (!users || users.length === 0) {
                return {
                    success: false,
                    message: 'Usuário não encontrado para esta transação'
                };
            }
            const user = users[0];
            const { error: updateError } = await hotmartSupabase
                .from('users')
                .update({
                status: 'available',
                hotmart_buyer_email: null,
                hotmart_buyer_name: null,
                hotmart_transaction_id: null,
                hotmart_notification_id: null,
                assigned_at: null,
                expires_at: null,
                updated_at: new Date().toISOString()
            })
                .eq('id', user.id);
            if (updateError) {
                throw updateError;
            }
            return {
                success: true,
                user_id: user.id,
                username: user.username,
                message: 'Usuário liberado com sucesso'
            };
        }
        catch (error) {
            console.error('Erro ao liberar usuário:', error);
            throw error;
        }
    }
};
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl) {
    throw new Error('SUPABASE_URL não configurada. Configure NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL no Vercel.');
}
if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel.');
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);
function generateSecurePassword(length = 12) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = crypto.randomInt(0, charset.length);
        password += charset[randomIndex];
    }
    return password;
}
async function sendCredentialsEmail(email, username, password) {
    try {
        console.log(`📧 Tentando enviar credenciais para ${email}`);
        console.log(`📋 Credenciais geradas:`);
        console.log(`   Email: ${email}`);
        console.log(`   Username: ${username}`);
        console.log(`   Password: ${password}`);
        console.log(`   Login URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://ciliosclick.com/login'}`);
        console.log(`✅ Credenciais preparadas para ${email} (email seria enviado em produção)`);
        return true;
    }
    catch (error) {
        console.error(`❌ Erro ao preparar credenciais:`, error);
        return false;
    }
}
async function releaseUser(transactionId, notificationId) {
    try {
        const result = await hotmartUsersService.releaseUserByTransaction(transactionId);
        if (!result) {
            console.log('⚠️ Usuário não encontrado ou já liberado');
            return false;
        }
        console.log(`✅ Usuário ${result.username} liberado com sucesso`);
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao liberar usuário:', error);
        return false;
    }
}
export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    try {
        const hotmartToken = req.headers['x-hotmart-hottok'];
        if (!hotmartToken || hotmartToken !== process.env.HOTMART_HOTTOK) {
            console.log('❌ Token Hotmart inválido');
            return res.status(401).json({ error: 'Invalid Hotmart token' });
        }
        const payload = req.body;
        const { error: webhookError } = await supabase
            .from('webhook_events')
            .insert({
            source: 'hotmart',
            event_type: payload.event,
            payload: payload,
            received_at: new Date().toISOString()
        });
        if (webhookError) {
            console.error('❌ Erro ao salvar webhook event:', webhookError);
        }
        const { event, data } = payload;
        console.log(`📥 Webhook Hotmart recebido: ${event}`);
        if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
            const { buyer, purchase } = data;
            const password = generateSecurePassword(12);
            const passwordHash = await bcrypt.hash(password, 12);
            try {
                const result = await hotmartUsersService.assignUserToHotmart(buyer.email, buyer.name, purchase.transaction, payload.id);
                if (!result) {
                    console.log('⚠️ Notificação já processada ou nenhum usuário disponível');
                    return res.status(503).json({
                        error: 'No available users or already processed',
                        message: 'Please retry later'
                    });
                }
                await sendCredentialsEmail(buyer.email, result.username, password);
                console.log(`✅ Usuário ${result.username} alocado para ${buyer.email}`);
                return res.status(200).json({
                    message: 'User assigned successfully',
                    username: result.username,
                    user_id: result.user_id
                });
            }
            catch (error) {
                console.error('❌ Erro ao processar compra:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
        else if (event === 'PURCHASE_CANCELLED' || event === 'PURCHASE_REFUNDED') {
            const { buyer, purchase } = data;
            try {
                const released = await releaseUser(purchase.transaction, payload.id);
                if (released) {
                    console.log(`✅ Usuário liberado para ${buyer.email}`);
                }
                else {
                    console.log(`ℹ️ Usuário não encontrado ou já liberado para ${buyer.email}`);
                }
                return res.status(200).json({
                    message: released ? 'User released successfully' : 'User not found or already released',
                    released: released
                });
            }
            catch (error) {
                console.error('❌ Erro ao liberar usuário:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
        }
        else {
            console.log(`ℹ️ Evento ${event} recebido mas não processado`);
            return res.status(200).json({ message: 'Event received' });
        }
    }
    catch (error) {
        console.error('❌ Erro geral no webhook:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
