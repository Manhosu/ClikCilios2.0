import React, { useState } from 'react'
import { useAdmin } from '../hooks/useAdmin'
import { EmailTemplatesService } from '../services/emailTemplates'
import { Button } from '../components/Button'

const AdminEmailsPage: React.FC = () => {
  const { isAdmin, loading } = useAdmin()
  const [activeTemplate, setActiveTemplate] = useState<string>('')
  const [previewData, setPreviewData] = useState<any>({})
  const [showPreview, setShowPreview] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Apenas administradores podem acessar esta página.</p>
        </div>
      </div>
    )
  }

  const generateWelcomeEmail = () => {
    const data = {
      userName: previewData.userName || 'Maria Silva',
      userEmail: previewData.userEmail || 'maria@exemplo.com',
      loginUrl: 'https://ciliosclick.vercel.app/login',
      cupomCode: previewData.cupomCode || '',
      parceiraName: previewData.parceiraName || ''
    }
    return EmailTemplatesService.welcomeEmail(data)
  }

  const generateParceiraEmail = () => {
    const data = {
      parceiraName: previewData.parceiraName || 'Lana Santos',
      parceiraEmail: previewData.parceiraEmail || 'lana@exemplo.com',
      clientName: previewData.clientName || 'Maria Silva',
      clientEmail: previewData.clientEmail || 'maria@exemplo.com',
      cupomCode: previewData.cupomCode || 'LANA20',
      commissionAmount: previewData.commissionAmount || 79.40,
      purchaseValue: previewData.purchaseValue || 397.00
    }
    return EmailTemplatesService.parceiraNotification(data)
  }

  const previewTemplate = (templateType: string) => {
    setActiveTemplate(templateType)
    setShowPreview(true)
  }

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content)
    alert('Conteúdo copiado para a área de transferência!')
  }

  const downloadTemplate = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getTemplateContent = () => {
    switch (activeTemplate) {
      case 'welcome':
        return generateWelcomeEmail()
      case 'parceira':
        return generateParceiraEmail()
      default:
        return { subject: '', htmlContent: '', textContent: '' }
    }
  }

  const template = getTemplateContent()

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            📧 Gerenciar Templates de Email
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Painel de Controle */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Templates Disponíveis</h2>
              
              <div className="space-y-4">
                {/* Template de Boas-vindas */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🎉 Email de Boas-vindas</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enviado para novas usuárias após registro
                  </p>
                  <Button
                    onClick={() => previewTemplate('welcome')}
                    variant="secondary"
                    className="w-full"
                  >
                    Visualizar Template
                  </Button>
                </div>

                {/* Template de Notificação Parceira */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">💰 Notificação Parceira</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Enviado quando parceira recebe nova comissão
                  </p>
                  <Button
                    onClick={() => previewTemplate('parceira')}
                    variant="secondary"
                    className="w-full"
                  >
                    Visualizar Template
                  </Button>
                </div>

                {/* Guia Rápido */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">📖 Guia Rápido</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Texto de instruções para usuárias
                  </p>
                  <Button
                    onClick={() => {
                      const guide = EmailTemplatesService.quickGuideText()
                      copyToClipboard(guide)
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Copiar Guia
                  </Button>
                </div>
              </div>

              {/* Dados de Teste */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">🧪 Dados de Teste</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <label className="block text-gray-600">Nome da Usuária</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Maria Silva"
                      value={previewData.userName || ''}
                      onChange={(e) => setPreviewData({...previewData, userName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Email da Usuária</label>
                    <input
                      type="email"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="maria@exemplo.com"
                      value={previewData.userEmail || ''}
                      onChange={(e) => setPreviewData({...previewData, userEmail: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Código do Cupom</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="LANA20"
                      value={previewData.cupomCode || ''}
                      onChange={(e) => setPreviewData({...previewData, cupomCode: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Nome da Parceira</label>
                    <input
                      type="text"
                      className="w-full p-2 border border-gray-300 rounded"
                      placeholder="Lana Santos"
                      value={previewData.parceiraName || ''}
                      onChange={(e) => setPreviewData({...previewData, parceiraName: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Preview do Template</h2>
              
              {!showPreview ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-4">📧</div>
                  <p>Selecione um template para visualizar</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Assunto */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📝 Assunto</h3>
                    <div className="bg-gray-50 p-3 rounded border font-mono text-sm">
                      {template.subject}
                    </div>
                    <div className="mt-2">
                      <Button
                        onClick={() => copyToClipboard(template.subject)}
                        variant="secondary"
                        className="text-xs"
                      >
                        Copiar Assunto
                      </Button>
                    </div>
                  </div>

                  {/* Conteúdo HTML */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">🎨 HTML</h3>
                    <div className="bg-gray-50 p-3 rounded border max-h-80 overflow-auto">
                      <iframe
                        srcDoc={template.htmlContent}
                        className="w-full h-96 border-0"
                        title="Preview Email"
                      />
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Button
                        onClick={() => copyToClipboard(template.htmlContent)}
                        variant="secondary"
                        className="text-xs"
                      >
                        Copiar HTML
                      </Button>
                      <Button
                        onClick={() => downloadTemplate(template.htmlContent, `${activeTemplate}-template.html`)}
                        variant="secondary"
                        className="text-xs"
                      >
                        Download HTML
                      </Button>
                    </div>
                  </div>

                  {/* Conteúdo Texto */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📄 Texto Simples</h3>
                    <div className="bg-gray-50 p-3 rounded border max-h-60 overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap font-mono">
                        {template.textContent}
                      </pre>
                    </div>
                    <div className="mt-2">
                      <Button
                        onClick={() => copyToClipboard(template.textContent)}
                        variant="secondary"
                        className="text-xs"
                      >
                        Copiar Texto
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instruções */}
          <div className="mt-8 border-t pt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📋 Instruções de Uso</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🎉 Email de Boas-vindas</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enviar logo após registro da usuária</li>
                  <li>• Incluir dados: nome, email, cupom (se houver)</li>
                  <li>• Personalizar URL de login para produção</li>
                  <li>• Pode ser automatizado via webhook</li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">💰 Notificação Parceira</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Enviar quando cupom for usado</li>
                  <li>• Incluir detalhes da venda e comissão</li>
                  <li>• Pode ser automatizado via webhook</li>
                  <li>• Manter parceiras engajadas</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Importante</h3>
              <p className="text-sm text-yellow-700">
                Lembre-se de atualizar as URLs para produção antes de usar os templates em ambiente real. 
                Todos os templates são responsivos e funcionam bem em dispositivos móveis.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminEmailsPage 