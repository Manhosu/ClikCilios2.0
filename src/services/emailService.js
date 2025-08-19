import { EmailTemplatesService } from './emailTemplates';
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');
const adminClient = createClient(process.env.VITE_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');
export class EmailService {
    static async ensureUserExists(email, password, name) {
        try {
            const { data: loginTest } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (loginTest && loginTest.user) {
                console.log(`✅ Usuário ${email} já existe e credenciais são válidas`);
                await supabase.auth.signOut();
                return true;
            }
            console.log(`🔧 Criando/atualizando usuário ${email}...`);
            if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
                const { data: users } = await adminClient.auth.admin.listUsers();
                const existingUser = users?.users.find(u => u.email === email);
                if (existingUser) {
                    console.log(`🗑️ Deletando usuário existente ${email}...`);
                    await adminClient.auth.admin.deleteUser(existingUser.id);
                    await supabase.from('users').delete().eq('email', email);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
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
                await supabase.from('users').insert({
                    id: newUser.user.id,
                    email,
                    name,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
                console.log(`✅ Usuário ${email} criado com sucesso`);
                return true;
            }
            else {
                console.error('❌ SUPABASE_SERVICE_ROLE_KEY não configurada');
                return false;
            }
        }
        catch (error) {
            console.error(`❌ Erro ao garantir usuário ${email}:`, error);
            return false;
        }
    }
    static async sendEmail(options) {
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
            }
            else {
                const errorData = await response.text();
                console.error(`❌ Erro ao enviar email:`, response.status, errorData);
                return false;
            }
        }
        catch (error) {
            console.error('❌ Erro ao enviar email:', error);
            return false;
        }
    }
    static async sendCredentialsEmail(email, userName, password, loginUrl = 'https://clik-cilios2-0.vercel.app/login') {
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
    static async sendWelcomeEmail(email, userName, loginUrl = 'https://clik-cilios2-0.vercel.app/login', cupomCode, parceiraName, password = 'ClikCilios2024!') {
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
    static async sendParceiraNotification(parceiraEmail, parceiraName, clientName, clientEmail, cupomCode, commissionAmount, purchaseValue) {
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
EmailService.apiKey = process.env.SENDGRID_API_KEY;
EmailService.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@ciliosclick.com';
EmailService.fromName = process.env.SENDGRID_FROM_NAME || 'CíliosClick';
