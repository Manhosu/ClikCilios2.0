// import { NextApiRequest, NextApiResponse } from 'next';
import { EmailService } from '../../src/services/emailService';

interface NextApiRequest {
  method?: string;
  body: any;
}

interface NextApiResponse {
  status: (code: number) => NextApiResponse;
  json: (data: any) => void;
}

interface EmailRequest {
  type: 'credentials' | 'welcome' | 'parceira';
  data: {
    // Para credentials
    email?: string;
    userName?: string;
    password?: string;
    loginUrl?: string;
    
    // Para welcome
    userEmail?: string;
    cupomCode?: string;
    
    // Para parceira
    parceiraEmail?: string;
    parceiraName?: string;
    clientName?: string;
    clientEmail?: string;
    commissionAmount?: number;
    purchaseValue?: number;
  };
}

/**
 * API endpoint para envio de emails
 * 
 * POST /api/send-email
 * 
 * Body:
 * {
 *   "type": "credentials",
 *   "data": {
 *     "email": "usuario@exemplo.com",
 *     "userName": "Maria Silva",
 *     "password": "senha123",
 *     "loginUrl": "https://ciliosclick.com/login"
 *   }
 * }
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Apenas métodos POST são permitidos
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Apenas POST é permitido'
    });
  }

  try {
    const { type, data }: EmailRequest = req.body;

    // Validação básica
    if (!type || !data) {
      return res.status(400).json({
        error: 'Bad request',
        message: 'Campos obrigatórios: type, data'
      });
    }

    let success = false;
    let emailSent = '';

    switch (type) {
      case 'credentials':
        if (!data.email || !data.userName || !data.password) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Para credentials: email, userName e password são obrigatórios'
          });
        }
        
        success = await EmailService.sendCredentialsEmail(
          data.email,
          data.userName,
          data.password,
          data.loginUrl || 'https://ciliosclick.com/login'
        );
        emailSent = data.email;
        break;

      case 'welcome':
        if (!data.userEmail || !data.userName) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Para welcome: userEmail e userName são obrigatórios'
          });
        }
        
        success = await EmailService.sendWelcomeEmail(
          data.userEmail,
          data.userName,
          data.loginUrl || 'https://ciliosclick.com/login',
          data.cupomCode,
          data.parceiraName
        );
        emailSent = data.userEmail;
        break;

      case 'parceira':
        if (!data.parceiraEmail || !data.parceiraName || !data.clientName || 
            !data.clientEmail || !data.cupomCode || 
            data.commissionAmount === undefined || data.purchaseValue === undefined) {
          return res.status(400).json({
            error: 'Bad request',
            message: 'Para parceira: todos os campos são obrigatórios'
          });
        }
        
        success = await EmailService.sendParceiraNotification(
          data.parceiraEmail,
          data.parceiraName,
          data.clientName,
          data.clientEmail,
          data.cupomCode,
          data.commissionAmount,
          data.purchaseValue
        );
        emailSent = data.parceiraEmail;
        break;

      default:
        return res.status(400).json({
          error: 'Bad request',
          message: 'Tipo de email inválido. Use: credentials, welcome ou parceira'
        });
    }

    if (success) {
      return res.status(200).json({
        success: true,
        message: `Email ${type} enviado com sucesso`,
        emailSent,
        timestamp: new Date().toISOString()
      });
    } else {
      return res.status(500).json({
        error: 'Email sending failed',
        message: 'Falha ao enviar email. Verifique logs do servidor.',
        emailSent,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Erro na API de email:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: 'Erro interno do servidor',
      timestamp: new Date().toISOString()
    });
  }
}

// Configuração para o Vercel
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};