import { EmailTemplatesService } from './emailTemplates.js';
import { createClient } from '@supabase/supabase-js';

// Cliente Supabase para gerenciar usuários
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.VITE_SUPABASE_ANON_KEY || ''
);

// Cliente admin para operações privilegiadas
const adminClient = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

interface SendEmailOptions {
  to: string;
  subject: string;
  htmlContent: string;
  textContent: string;
}

/**
 * Serviço para envio de emails usando SendGrid
 */
export class EmailService {
  private static apiKey = process.env.SENDGRID_API_KEY;
  private static fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@ciliosclick.com';
  private static fromName = process.env.SENDGRID_FROM_NAME || 'CíliosClick';

  /**
   * Garante que o usuário existe no sistema com as credenciais fornecidas
   */
  private static async ensureUserExists(
    email: string,
    password: string,
    name: string
  ): Promise<boolean> {
    try {
      // Verificar se o usuário já existe e pode fazer login
      const { data: loginTest } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (loginTest && loginTest.user) {
        console.log(`✅ Usuário ${email} já existe e credenciais são válidas`);
        await supabase.auth.signOut();
        return true;
      }

      // Se chegou aqui, o usuário não existe ou as credenciais estão incorretas
      console.log(`🔧 Criando/atualizando usuário ${email}...`);

      // Tentar deletar usuário existente se houver
      if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { data: users } = await adminClient.auth.admin.listUsers();
        const existingUser = users?.users.find(u => u.email === email);
        
        if (existingUser) {
          console.log(`🗑️ Deletando usuário existente ${email}...`);
          await adminClient.auth.admin.deleteUser(existingUser.id);
          
          // Deletar da tabela users também
          await supabase.from('users').delete().eq('email', email);
          
          // Aguardar propagação
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Criar novo usuário
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { name }
        });

        if (createError) {
          console.error(`❌ Erro ao criar usuário ${email}:`, createError.message);
          return false;
        }

        // Inserir na tabela users
        await supabase.from('users').insert({
          id: newUser.user.id,
          email,
          name,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log(`✅ Usuário ${email} criado com sucesso`);
        return true;
      } else {
        console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
        return false;
      }
    } catch (error) {
      console.error(`❌ Erro ao garantir usuário ${email}:`, error);
      return false;
    }
  }

  /**
   * Envia um email usando a API do SendGrid
   */
  static async sendEmail(options: SendEmailOptions): Promise<boolean> {
    if (!this.apiKey) {
      console.error('❌ SENDGRID_API_KEY não configurada');
      return false;
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to }],
              subject: options.subject,
            },
          ],
          from: {
            email: this.fromEmail,
            name: this.fromName,
          },
          content: [
            {
              type: 'text/plain',
              value: options.textContent,
            },
            {
              type: 'text/html',
              value: options.htmlContent,
            },
          ],
        }),
      });

      if (response.ok) {
        console.log(`✅ Email enviado com sucesso para ${options.to}`);
        return true;
      } else {
        const errorData = await response.text();
        console.error(`❌ Erro ao enviar email:`, response.status, errorData);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro ao enviar email:', error);
      return false;
    }
  }

  /**
   * Envia email com credenciais de acesso
   * Garante que o usuário existe no sistema antes de enviar
   */
  static async sendCredentialsEmail(
    email: string,
    userName: string,
    password: string,
    loginUrl: string = 'https://clik-cilios2-0.vercel.app/login'
  ): Promise<boolean> {
    // Garantir que o usuário existe no sistema
    const userExists = await this.ensureUserExists(email, password, userName);
    
    if (!userExists) {
      console.error(`❌ Não foi possível garantir que o usuário ${email} existe no sistema`);
      return false;
    }

    const template = EmailTemplatesService.credentialsEmail({
      userName,
      password,
      loginUrl,
      userEmail: email
    });

    const emailSent = await this.sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    });

    if (emailSent) {
      console.log(`✅ Email de credenciais enviado para ${email} com credenciais VÁLIDAS`);
    }

    return emailSent;
  }

  /**
   * Envia email de boas-vindas
   * Garante que o usuário existe no sistema antes de enviar
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string,
    loginUrl: string = 'https://clik-cilios2-0.vercel.app/login',
    cupomCode?: string,
    parceiraName?: string,
    password: string = 'ClikCilios2024!' // Senha padrão para novos usuários
  ): Promise<boolean> {
    // Garantir que o usuário existe no sistema
    const userExists = await this.ensureUserExists(email, password, userName);
    
    if (!userExists) {
      console.error(`❌ Não foi possível garantir que o usuário ${email} existe no sistema`);
      return false;
    }

    const template = EmailTemplatesService.welcomeEmail({
      userName,
      userEmail: email,
      loginUrl,
      cupomCode,
      parceiraName,
    });

    const emailSent = await this.sendEmail({
      to: email,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent
    });

    if (emailSent) {
      console.log(`✅ Email de boas-vindas enviado para ${email} com credenciais VÁLIDAS`);
    }

    return emailSent;
  }

  /**
   * Envia notificação para parceira
   */
  static async sendParceiraNotification(
    parceiraEmail: string,
    parceiraName: string,
    clientName: string,
    clientEmail: string,
    cupomCode: string,
    commissionAmount: number,
    purchaseValue: number
  ): Promise<boolean> {
    const template = EmailTemplatesService.parceiraNotification({
      parceiraName,
      parceiraEmail,
      clientName,
      clientEmail,
      cupomCode,
      commissionAmount,
      purchaseValue,
    });

    return this.sendEmail({
      to: parceiraEmail,
      subject: template.subject,
      htmlContent: template.htmlContent,
      textContent: template.textContent,
    });
  }
}