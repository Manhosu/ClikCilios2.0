import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase com service role para operações administrativas
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Função para gerar senha aleatória segura
function generateSecurePassword(length: number = 12): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = crypto.randomInt(0, charset.length);
    password += charset[randomIndex];
  }
  
  return password;
}

// Função para enviar email com credenciais
async function sendCredentialsEmail(email: string, username: string, password: string) {
  // TODO: Implementar envio de email usando seu provedor preferido
  // Por exemplo: SendGrid, Nodemailer, etc.
  console.log(`📧 Enviando credenciais para ${email}:`);
  console.log(`   Usuário: ${username}`);
  console.log(`   Senha: ${password}`);
  
  // Placeholder para implementação real do email
  // await emailService.send({
  //   to: email,
  //   subject: 'Suas credenciais de acesso - CíliosClick',
  //   template: 'credentials',
  //   data: { username, password }
  // });
}

// Função para liberar usuário usando RPC (cancelamento/reembolso)
async function releaseUser(buyerEmail: string, transactionId: string, notificationId: string) {
  try {
    // Chama a função RPC para liberar usuário
    const { data: result, error: rpcError } = await supabase
      .rpc('release_pre_user', {
        p_buyer_email: buyerEmail,
        p_hotmart_transaction_id: transactionId,
        p_hotmart_notification_id: notificationId
      });

    if (rpcError) {
      throw rpcError;
    }

    if (!result || result.length === 0) {
      console.log(`⚠️ Cancelamento já processado ou atribuição não encontrada para ${buyerEmail}`);
      return { released: false, message: 'Already processed or no active assignment' };
    }

    const { username, released } = result[0];
    
    if (released) {
      console.log(`✅ Usuário ${username} liberado com sucesso para ${buyerEmail}`);
      return { released: true, username, message: 'User released successfully' };
    }
    
    return { released: false, message: 'User not released' };
    
  } catch (error) {
    console.error('❌ Erro ao liberar usuário:', error);
    throw error;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validação do token Hotmart
    const hotmartToken = req.headers['x-hotmart-hottok'] as string;
    if (!hotmartToken || hotmartToken !== process.env.HOTMART_HOTTOK) {
      console.log('❌ Token Hotmart inválido');
      return res.status(401).json({ error: 'Invalid Hotmart token' });
    }

    const payload = req.body;
    
    // Salva o payload bruto em webhook_events
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

    // Processa eventos de compra aprovada
    if (event === 'PURCHASE_APPROVED' || event === 'PURCHASE_COMPLETE') {
      const { buyer, purchase } = data;
      
      // Gera senha aleatória segura
      const password = generateSecurePassword(12);
      const passwordHash = await bcrypt.hash(password, 12);

      try {
        // Chama a função RPC para alocar usuário
        const { data: result, error: rpcError } = await supabase
          .rpc('assign_pre_user', {
            p_buyer_email: buyer.email,
            p_buyer_name: buyer.name,
            p_hotmart_transaction_id: purchase.transaction,
            p_hotmart_notification_id: payload.id,
            p_password_hash: passwordHash
          });

        if (rpcError) {
          if (rpcError.message.includes('no_available_user')) {
            console.log('⚠️ Nenhum usuário disponível');
            return res.status(503).json({ 
              error: 'No available users', 
              message: 'Please retry later' 
            });
          }
          throw rpcError;
        }

        if (!result || result.length === 0) {
          console.log('⚠️ Notificação já processada');
          return res.status(200).json({ message: 'Already processed' });
        }

        const { username } = result[0];
        
        // Envia email com credenciais
        await sendCredentialsEmail(buyer.email, username, password);
        
        console.log(`✅ Usuário ${username} alocado para ${buyer.email}`);
        
        return res.status(200).json({ 
          message: 'User assigned successfully',
          username: username
        });
        
      } catch (error) {
        console.error('❌ Erro ao processar compra:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
    
    // Processa eventos de cancelamento/reembolso
    else if (event === 'PURCHASE_CANCELLED' || event === 'PURCHASE_REFUNDED') {
      const { buyer, purchase } = data;
      
      try {
        const result = await releaseUser(buyer.email, purchase.transaction, payload.id);
        
        if (result.released) {
          console.log(`✅ Usuário ${result.username} liberado para ${buyer.email}`);
        } else {
          console.log(`ℹ️ ${result.message} para ${buyer.email}`);
        }
        
        return res.status(200).json({ 
          message: result.message,
          username: result.username || null,
          released: result.released
        });
        
      } catch (error) {
        console.error('❌ Erro ao liberar usuário:', error);
        return res.status(500).json({ error: 'Internal server error' });
      }
    }
    
    // Outros eventos são apenas logados
    else {
      console.log(`ℹ️ Evento ${event} recebido mas não processado`);
      return res.status(200).json({ message: 'Event received' });
    }
    
  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}