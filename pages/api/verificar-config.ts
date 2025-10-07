import { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Endpoint de Verificação de Configuração
 *
 * Este endpoint permite verificar se todas as variáveis de ambiente
 * necessárias estão configuradas corretamente no Vercel.
 *
 * URL: https://clik-cilios2-0.vercel.app/api/verificar-config
 *
 * Retorna:
 * - Status de cada variável (configurada ou ausente)
 * - Informações sobre o ambiente
 * - Sugestões de correção se houver problemas
 */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permitir apenas GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const config = {
    timestamp: new Date().toISOString(),
    environment: process.env.VERCEL_ENV || 'development',
    variables: {
      // Supabase
      supabase: {
        url: {
          configured: !!process.env.VITE_SUPABASE_URL,
          value: process.env.VITE_SUPABASE_URL ?
            `${process.env.VITE_SUPABASE_URL.substring(0, 30)}...` :
            'NOT_CONFIGURED'
        },
        anonKey: {
          configured: !!process.env.VITE_SUPABASE_ANON_KEY,
          value: process.env.VITE_SUPABASE_ANON_KEY ?
            `${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` :
            'NOT_CONFIGURED'
        },
        serviceRole: {
          configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          value: process.env.SUPABASE_SERVICE_ROLE_KEY ?
            `${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 20)}...` :
            'NOT_CONFIGURED'
        }
      },

      // SendGrid (Email)
      sendgrid: {
        apiKey: {
          configured: !!process.env.SENDGRID_API_KEY,
          value: process.env.SENDGRID_API_KEY ?
            `${process.env.SENDGRID_API_KEY.substring(0, 15)}...` :
            'NOT_CONFIGURED'
        },
        fromEmail: {
          configured: !!process.env.SENDGRID_FROM_EMAIL,
          value: process.env.SENDGRID_FROM_EMAIL || 'NOT_CONFIGURED'
        },
        fromName: {
          configured: !!process.env.SENDGRID_FROM_NAME,
          value: process.env.SENDGRID_FROM_NAME || 'NOT_CONFIGURED'
        }
      },

      // Hotmart
      hotmart: {
        token: {
          configured: !!process.env.HOTMART_TOKEN,
          value: process.env.HOTMART_TOKEN ?
            `${process.env.HOTMART_TOKEN.substring(0, 20)}...` :
            'NOT_CONFIGURED'
        }
      },

      // App
      app: {
        url: {
          configured: !!process.env.NEXT_PUBLIC_APP_URL,
          value: process.env.NEXT_PUBLIC_APP_URL || 'NOT_CONFIGURED'
        }
      }
    }
  }

  // Verificar quais variáveis CRÍTICAS estão faltando
  const missingCritical = []

  if (!config.variables.supabase.url.configured) {
    missingCritical.push('VITE_SUPABASE_URL')
  }
  if (!config.variables.supabase.serviceRole.configured) {
    missingCritical.push('SUPABASE_SERVICE_ROLE_KEY')
  }
  if (!config.variables.hotmart.token.configured) {
    missingCritical.push('HOTMART_TOKEN')
  }

  // Verificar quais variáveis OPCIONAIS estão faltando (mas recomendadas)
  const missingOptional = []

  if (!config.variables.sendgrid.apiKey.configured) {
    missingOptional.push('SENDGRID_API_KEY')
  }
  if (!config.variables.sendgrid.fromEmail.configured) {
    missingOptional.push('SENDGRID_FROM_EMAIL')
  }
  if (!config.variables.app.url.configured) {
    missingOptional.push('NEXT_PUBLIC_APP_URL')
  }

  // Status geral
  const allCriticalConfigured = missingCritical.length === 0
  const allOptionalConfigured = missingOptional.length === 0

  // Preparar resposta
  const response = {
    status: allCriticalConfigured ? 'OK' : 'ERROR',
    message: allCriticalConfigured
      ? 'Todas as variáveis críticas estão configuradas'
      : 'Algumas variáveis críticas estão faltando',
    config,
    issues: {
      critical: {
        missing: missingCritical,
        count: missingCritical.length
      },
      optional: {
        missing: missingOptional,
        count: missingOptional.length
      }
    },
    recommendations: []
  }

  // Adicionar recomendações
  if (missingCritical.length > 0) {
    response.recommendations.push({
      severity: 'CRITICAL',
      message: 'Configure as variáveis críticas no Vercel Dashboard → Settings → Environment Variables',
      variables: missingCritical
    })
  }

  if (missingOptional.length > 0) {
    response.recommendations.push({
      severity: 'WARNING',
      message: 'Configure as variáveis opcionais para funcionalidade completa',
      variables: missingOptional,
      impact: 'Emails de credenciais não serão enviados automaticamente'
    })
  }

  if (!config.variables.sendgrid.apiKey.configured) {
    response.recommendations.push({
      severity: 'WARNING',
      message: 'SendGrid não configurado: usuários não receberão emails com credenciais',
      solution: 'Configure SENDGRID_API_KEY, SENDGRID_FROM_EMAIL e SENDGRID_FROM_NAME'
    })
  }

  // Verificar se webhook pode funcionar
  const webhookStatus = {
    canReceiveWebhooks: allCriticalConfigured,
    canCreateUsers: config.variables.supabase.url.configured &&
                    config.variables.supabase.serviceRole.configured,
    canSendEmails: config.variables.sendgrid.apiKey.configured,
    canValidateToken: config.variables.hotmart.token.configured
  }

  response.webhookStatus = webhookStatus

  // Retornar status apropriado
  const httpStatus = allCriticalConfigured ? 200 : 500

  return res.status(httpStatus).json(response)
}

/**
 * COMO USAR ESTE ENDPOINT:
 *
 * 1. Acesse via browser ou Postman:
 *    GET https://clik-cilios2-0.vercel.app/api/verificar-config
 *
 * 2. Verifique o status retornado:
 *    - status: "OK" = Tudo configurado
 *    - status: "ERROR" = Faltam variáveis críticas
 *
 * 3. Siga as recomendações em "recommendations"
 *
 * 4. Re-deploy após configurar variáveis
 *
 * EXEMPLO DE RESPOSTA (Sucesso):
 * {
 *   "status": "OK",
 *   "message": "Todas as variáveis críticas estão configuradas",
 *   "config": { ... },
 *   "issues": {
 *     "critical": { "missing": [], "count": 0 },
 *     "optional": { "missing": [], "count": 0 }
 *   },
 *   "webhookStatus": {
 *     "canReceiveWebhooks": true,
 *     "canCreateUsers": true,
 *     "canSendEmails": true,
 *     "canValidateToken": true
 *   }
 * }
 *
 * EXEMPLO DE RESPOSTA (Erro):
 * {
 *   "status": "ERROR",
 *   "message": "Algumas variáveis críticas estão faltando",
 *   "issues": {
 *     "critical": {
 *       "missing": ["SENDGRID_API_KEY", "HOTMART_TOKEN"],
 *       "count": 2
 *     }
 *   },
 *   "recommendations": [
 *     {
 *       "severity": "CRITICAL",
 *       "message": "Configure as variáveis críticas...",
 *       "variables": ["SENDGRID_API_KEY", "HOTMART_TOKEN"]
 *     }
 *   ]
 * }
 */
