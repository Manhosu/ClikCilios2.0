// import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { hotmartUsersService } from '../../src/services/hotmartUsersService.js';
import { EmailService } from '../../src/services/emailService.js';

// Interfaces para substituir Next.js
interface NextApiRequest {
  method?: string;
  body: any;
  headers: { [key: string]: string | string[] | undefined };
}

interface NextApiResponse {
  status: (code: number) => NextApiResponse;
  json: (data: any) => void;
}

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
  try {
    console.log(`📧 Enviando credenciais para ${email}`);
    
    const success = await EmailService.sendCredentialsEmail(
      email,
      username,
      password,
      process.env.NEXT_PUBLIC_APP_URL || 'https://ciliosclick.com/login'
    );
    
    if (success) {
      console.log(`✅ Email de credenciais enviado com sucesso para ${email}`);
    } else {
      console.error(`❌ Falha ao enviar email de credenciais para ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Erro ao enviar email de credenciais:`, error);
    return false;
  }
}

// Função para liberar usuário usando RPC (cancelamento/reembolso)
async function releaseUser(transactionId: string, notificationId: string) {
  try {
    // Usa o novo serviço consolidado para liberar usuário
    const result = await hotmartUsersService.releaseUser(transactionId, notificationId);
    
    if (!result || !result.success) {
      console.log('⚠️ Usuário não encontrado ou já liberado');
      return false;
    }
    
    console.log(`✅ Usuário ${result.username} liberado com sucesso`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao liberar usuário:', error);
    return false;
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
        // Usa o novo serviço consolidado para atribuir usuário
        const result = await hotmartUsersService.assignUser(
          buyer.email,
          buyer.name,
          purchase.transaction,
          payload.id,
          passwordHash
        );

        if (!result) {
          console.log('⚠️ Notificação já processada');
          return res.status(200).json({ message: 'Already processed' });
        }

        if (!result.success) {
          if (result.message.includes('Nenhum usuário disponível')) {
            console.log('⚠️ Nenhum usuário disponível');
            return res.status(503).json({ 
              error: 'No available users', 
              message: 'Please retry later' 
            });
          }
          throw new Error(result.message);
        }

        // Envia email com credenciais
        await sendCredentialsEmail(buyer.email, result.username, password);
        
        console.log(`✅ Usuário ${result.username} alocado para ${buyer.email}`);
        
        return res.status(200).json({ 
          message: 'User assigned successfully',
          username: result.username
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
        const released = await releaseUser(purchase.transaction, payload.id);
        
        if (released) {
          console.log(`✅ Usuário liberado para ${buyer.email}`);
        } else {
          console.log(`ℹ️ Usuário não encontrado ou já liberado para ${buyer.email}`);
        }
        
        return res.status(200).json({ 
          message: released ? 'User released successfully' : 'User not found or already released',
          released: released
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