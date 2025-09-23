// import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { EmailService } from '../../src/services/emailService';


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
  const randomBytes = crypto.randomBytes(length);
  let password = '';

  for (let i = 0; i < length; i++) {
    password += charset[randomBytes[i] % charset.length];
  }

  return password;
}

// Função para enviar email com credenciais usando EmailService
async function sendCredentialsEmail(email: string, username: string, password: string) {
  try {
    console.log(`📧 Enviando credenciais para ${email}`);

    const loginUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://clik-cilios2-0.vercel.app/login';

    // Usar EmailService para envio real de email
    const emailSent = await EmailService.sendCredentialsEmail(
      email,
      username,
      password,
      loginUrl
    );

    if (emailSent) {
      console.log(`✅ Email de credenciais enviado para ${email}`);
      return true;
    } else {
      console.error(`❌ Falha ao enviar email para ${email}`);
      // Em caso de falha no email, não bloquear o processo
      // O usuário foi criado com sucesso, apenas o email falhou
      return true;
    }
  } catch (error) {
    console.error(`❌ Erro ao enviar credenciais:`, error);
    // Em caso de erro, não bloquear o processo
    return true;
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

    // Processa eventos de compra aprovada - aceita formatos diferentes
    const validPurchaseEvents = ['PURCHASE_APPROVED', 'PURCHASE_COMPLETE', 'approved', 'purchase_completed'];
    if (validPurchaseEvents.includes(event)) {
      const { buyer, purchase } = data;
      
      // Gera senha aleatória segura
      const password = generateSecurePassword(12);

      try {
        console.log(`🔍 Processando compra para ${buyer.email}`);

        // Verificar se já existe usuário com este email
        let userId: string;
        let isNewUser = false;

        const { data: existingUser } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', buyer.email.toLowerCase())
          .single();

        if (existingUser) {
          console.log(`✅ Usuário já existe: ${existingUser.id}`);
          userId = existingUser.id;

          // Atualizar senha do usuário existente
          const { error: updatePasswordError } = await supabase.auth.admin.updateUserById(
            userId,
            { password }
          );

          if (updatePasswordError) {
            console.error('❌ Erro ao atualizar senha:', updatePasswordError);
          }
        } else {
          // Criar novo usuário no Supabase Auth
          console.log(`🆕 Criando novo usuário para ${buyer.email}`);

          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email: buyer.email.toLowerCase(),
            password: password,
            email_confirm: true,
            user_metadata: {
              nome: buyer.name,
              origem: 'hotmart',
              created_via_webhook: true,
              hotmart_transaction_id: purchase.transaction
            }
          });

          if (authError || !authUser.user) {
            console.error('❌ Erro ao criar usuário no Auth:', authError);
            throw new Error(`Falha ao criar usuário: ${authError?.message}`);
          }

          userId = authUser.user.id;
          isNewUser = true;

          // Criar perfil na tabela users
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: userId,
              email: buyer.email.toLowerCase(),
              nome: buyer.name,
              is_admin: false,
              onboarding_completed: false,
              hotmart_buyer_email: buyer.email,
              hotmart_buyer_name: buyer.name,
              hotmart_transaction_id: purchase.transaction
            });

          if (profileError) {
            console.error('❌ Erro ao criar perfil:', profileError);
            // Não falhar o processo por isso, perfil pode ser criado depois
          }

          console.log(`✅ Usuário criado com sucesso: ${userId}`);
        }

        const result = {
          success: true,
          user_id: userId,
          username: buyer.email,
          message: isNewUser ? 'Usuário criado com sucesso' : 'Usuário já existia, senha atualizada'
        };

        // Verificar se a compra é do produto correto (6012952)
        const isCorrectProduct = purchase.product_id === 6012952 ||
                                purchase.product?.id === 6012952 ||
                                data.product?.id === 6012952;

        console.log('🔍 Verificando produto da compra:', {
          purchase_product_id: purchase.product_id,
          data_product_id: data.product?.id,
          expected_product_id: 6012952,
          is_correct_product: isCorrectProduct
        });

        if (!isCorrectProduct) {
          console.log('⚠️ Produto da compra não é o esperado (6012952), processando mesmo assim');
        }

        // Buscar ou criar plano para o produto Hotmart 6012952
        let planoId: string;

        const { data: existingPlano } = await supabase
          .from('planos')
          .select('id')
          .eq('nome', 'Produto Hotmart 6012952')
          .single();

        if (existingPlano) {
          planoId = existingPlano.id;
          console.log(`✅ Plano encontrado: ${planoId}`);
        } else {
          // Criar plano se não existir
          console.log('🆕 Criando plano para produto Hotmart 6012952');

          const { data: newPlano, error: createPlanoError } = await supabase
            .from('planos')
            .insert({
              nome: 'Produto Hotmart 6012952',
              descricao: 'Acesso via Hotmart - Produto 6012952',
              preco: purchase.price?.value || 97.00,
              duracao_dias: 30,
              ativo: true
            })
            .select('id')
            .single();

          if (createPlanoError || !newPlano) {
            console.error('❌ Erro ao criar plano:', createPlanoError);
            throw new Error('Falha ao criar plano para o produto');
          }

          planoId = newPlano.id;
          console.log(`✅ Plano criado: ${planoId}`);
        }

        // Verificar se já existe assinatura ativa para este usuário
        const { data: existingAssinatura } = await supabase
          .from('assinaturas')
          .select('id, status, data_fim')
          .eq('user_id', userId)
          .eq('plano_id', planoId)
          .in('status', ['ativa', 'pendente'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (existingAssinatura) {
          console.log(`✅ Usuário já possui assinatura ativa: ${existingAssinatura.id}`);
        } else {
          // Criar nova assinatura
          const dataInicio = new Date();
          const dataFim = new Date();
          dataFim.setDate(dataFim.getDate() + 30); // 30 dias de acesso

          const { error: assinaturaError } = await supabase
            .from('assinaturas')
            .insert({
              user_id: userId,
              plano_id: planoId,
              status: 'ativa',
              data_inicio: dataInicio.toISOString(),
              data_fim: dataFim.toISOString()
            });

          if (assinaturaError) {
            console.error('❌ Erro ao criar assinatura:', assinaturaError);
            // Não falhar o processo por isso
          } else {
            console.log(`✅ Assinatura criada para usuário ${result.username} - válida até ${dataFim.toLocaleDateString()}`);
          }
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

        // SEMPRE retornar 200 OK ao Hotmart, mesmo em caso de erro
        // Isso evita que o Hotmart reenvie o webhook múltiplas vezes
        return res.status(200).json({
          message: 'Webhook received but processing failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          transaction_id: data?.purchase?.transaction || 'unknown'
        });
      }
    }
    
    // Processa eventos de cancelamento/reembolso
    else if (event === 'PURCHASE_CANCELLED' || event === 'PURCHASE_REFUNDED') {
      const { buyer, purchase } = data;

      try {
        console.log(`🚫 Processando cancelamento/reembolso para ${buyer.email}`);

        // Buscar usuário pelo email
        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('hotmart_buyer_email', buyer.email)
          .single();

        if (!user) {
          console.log(`ℹ️ Usuário não encontrado para ${buyer.email}`);
          return res.status(200).json({
            message: 'User not found for cancellation',
            transaction_id: purchase.transaction
          });
        }

        // Buscar assinatura ativa do usuário
        const { data: assinatura } = await supabase
          .from('assinaturas')
          .select('id, status')
          .eq('user_id', user.id)
          .eq('status', 'ativa')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (assinatura) {
          // Cancelar assinatura
          const { error: cancelError } = await supabase
            .from('assinaturas')
            .update({
              status: 'cancelada',
              data_cancelamento: new Date().toISOString()
            })
            .eq('id', assinatura.id);

          if (cancelError) {
            console.error('❌ Erro ao cancelar assinatura:', cancelError);
          } else {
            console.log(`✅ Assinatura ${assinatura.id} cancelada`);
          }
        } else {
          console.log(`ℹ️ Assinatura não encontrada para ${buyer.email}`);
        }

        return res.status(200).json({
          message: 'Cancellation processed successfully',
          transaction_id: purchase.transaction
        });
        
      } catch (error) {
        console.error('❌ Erro ao liberar usuário:', error);

        // SEMPRE retornar 200 OK ao Hotmart, mesmo em caso de erro
        return res.status(200).json({
          message: 'Webhook received but release processing failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          transaction_id: data?.purchase?.transaction || 'unknown'
        });
      }
    }
    
    // Outros eventos são apenas logados
    else {
      console.log(`ℹ️ Evento ${event} recebido mas não processado`);
      return res.status(200).json({ message: 'Event received' });
    }
    
  } catch (error) {
    console.error('❌ Erro geral no webhook:', error);

    // SEMPRE retornar 200 OK ao Hotmart, mesmo em caso de erro geral
    // Isso evita que o Hotmart reenvie o webhook múltiplas vezes
    return res.status(200).json({
      message: 'Webhook received but general processing failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}