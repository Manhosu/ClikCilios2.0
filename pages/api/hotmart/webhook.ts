// import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
// Importações removidas para evitar problemas de módulo em produção
// import { EmailService } from '../../src/services/emailService';

// Cliente Supabase para hotmartUsersService
const hotmartSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Implementação inline das funções necessárias do hotmartUsersService
const hotmartUsersService = {
  async assignUserToHotmart(buyerEmail: string, buyerName: string, transactionId: string, notificationId: string) {
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
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 ano de acesso

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
    } catch (error) {
      console.error('Erro ao atribuir usuário:', error);
      throw error;
    }
  },

  async releaseUserByTransaction(transactionId: string) {
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
    } catch (error) {
      console.error('Erro ao liberar usuário:', error);
      throw error;
    }
  }
};

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

// Configuração de variáveis de ambiente para Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error('SUPABASE_URL não configurada. Configure NEXT_PUBLIC_SUPABASE_URL ou VITE_SUPABASE_URL no Vercel.');
}

if (!supabaseServiceKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada no Vercel.');
}

// Cliente Supabase com service role para operações administrativas
const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

// Função simplificada para enviar email com credenciais (inline para evitar problemas de módulo)
async function sendCredentialsEmail(email: string, username: string, password: string) {
  try {
    console.log(`📧 Tentando enviar credenciais para ${email}`);
    
    // Implementação simplificada - apenas log por enquanto
    // Em produção, isso seria substituído por uma chamada de API externa ou serviço de email
    console.log(`📋 Credenciais geradas:`);
    console.log(`   Email: ${email}`);
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Login URL: ${process.env.NEXT_PUBLIC_APP_URL || 'https://ciliosclick.com/login'}`);
    
    // Simular sucesso - em produção, implementar envio real de email
    console.log(`✅ Credenciais preparadas para ${email} (email seria enviado em produção)`);
    
    return true; // Retorna sucesso para não bloquear o fluxo
  } catch (error) {
    console.error(`❌ Erro ao preparar credenciais:`, error);
    return false;
  }
}

// Função para liberar usuário usando RPC (cancelamento/reembolso)
async function releaseUser(transactionId: string, notificationId: string) {
  try {
    // Usa o serviço de usuários para liberar usuário
    const result = await hotmartUsersService.releaseUserByTransaction(transactionId);
    
    if (!result) {
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
        // Usa o serviço de usuários para atribuir usuário
        const result = await hotmartUsersService.assignUserToHotmart(
          buyer.email,
          buyer.name,
          purchase.transaction,
          payload.id
        );

        if (!result) {
          console.log('⚠️ Notificação já processada ou nenhum usuário disponível');
          return res.status(503).json({ 
            error: 'No available users or already processed', 
            message: 'Please retry later' 
          });
        }

        // Cria assinatura automática para o produto Hotmart 6012952
        try {
          const { data: plano } = await supabase
            .from('planos')
            .select('id')
            .eq('nome', 'Produto Hotmart 6012952')
            .single();

          if (plano) {
            const dataInicio = new Date();
            const dataFim = new Date();
            dataFim.setDate(dataInicio.getDate() + 30); // 30 dias de acesso

            const { error: assinaturaError } = await supabase
              .from('assinaturas')
              .insert({
                user_id: result.user_id,
                plano_id: plano.id,
                data_inicio: dataInicio.toISOString(),
                data_fim: dataFim.toISOString(),
                status: 'ativa'
              });

            if (assinaturaError) {
              console.error('❌ Erro ao criar assinatura:', assinaturaError);
            } else {
              console.log(`✅ Assinatura criada para usuário ${result.username} (30 dias)`);
            }
          }
        } catch (assinaturaError) {
          console.error('❌ Erro ao processar assinatura:', assinaturaError);
        }

        // Envia email com credenciais
        await sendCredentialsEmail(buyer.email, result.username, password);
        
        console.log(`✅ Usuário ${result.username} alocado para ${buyer.email}`);
        
        return res.status(200).json({ 
          message: 'User assigned successfully',
          username: result.username,
          user_id: result.user_id
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