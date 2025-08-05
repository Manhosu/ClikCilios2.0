# Sistema de Onboarding - CíliosClick

## 📋 Visão Geral

O sistema de onboarding da CíliosClick proporciona uma experiência de boas-vindas completa para novas usuárias, incluindo:

- **Modal de boas-vindas interativo** após primeiro login
- **Templates de email profissionais** para comunicação automática
- **Tour guiado** pelos recursos principais
- **Comunicação automática com parceiras** sobre comissões

## 🎯 Componentes Principais

### 1. Hook useOnboarding
**Arquivo:** `src/hooks/useOnboarding.ts`

Gerencia o estado e lógica do onboarding:
- Detecta primeiro login (usuário criado nas últimas 24h)
- Controla progresso do tour guiado
- Marca onboarding como concluído
- Persiste estado no banco de dados

```typescript
const {
  showWelcome,        // Mostrar modal de boas-vindas
  currentStep,        // Passo atual do tour
  steps,             // Lista de passos
  nextStep,          // Avançar passo
  completeOnboarding, // Finalizar onboarding
  skipOnboarding     // Pular tour
} = useOnboarding()
```

### 2. Modal de Boas-vindas
**Arquivo:** `src/components/WelcomeModal.tsx`

Modal interativo com:
- Tela de boas-vindas personalizada
- Tour guiado em 5 passos
- Barra de progresso
- Dicas profissionais
- Ações rápidas para começar

**Passos do Tour:**
1. **Boas-vindas** - Apresentação da plataforma
2. **Primeiro teste** - Upload e aplicação de cílios
3. **Estilos** - Explorar os 6 estilos disponíveis
4. **Download** - Salvar resultados
5. **Conclusão** - Pronta para atender clientes

### 3. Templates de Email
**Arquivo:** `src/services/emailTemplates.ts`

Templates profissionais para:

#### 🎉 Email de Boas-vindas
- Personalizado com nome da usuária
- Instruções de acesso e primeiro login
- Dicas profissionais
- Design responsivo
- Versões HTML e texto

#### 💰 Notificação de Comissão (Parceiras)
- Detalhes da venda e comissão
- Informações da nova cliente
- Valores e cupom utilizado
- Incentivo para continuar indicando

#### 📖 Guia Rápido
- Instruções passo a passo
- Dicas de melhores práticas
- Formato texto para WhatsApp/telegram

### 4. Página Administrativa
**Arquivo:** `src/pages/AdminEmailsPage.tsx`

Interface para administradores:
- Preview de todos os templates
- Geração com dados de teste
- Cópia para área de transferência
- Download de templates HTML
- Instruções de uso

## 🔄 Fluxo de Onboarding

### Para Usuárias Regulares
1. **Primeiro Login** → Modal de boas-vindas automático
2. **Tour Guiado** → 5 passos interativos
3. **Teste Prático** → Aplicar cílios na primeira foto
4. **Conclusão** → Onboarding marcado como concluído

### Para Usuárias via Cupom
1. **Compra na Hotmart** → Webhook cria usuário
2. **Email Automático** → Instruções de acesso
3. **Primeiro Login** → Modal personalizado com cupom
4. **Tour Específico** → Focado em primeiros passos

### Para Parceiras
1. **Nova Venda** → Webhook detecta uso do cupom
2. **Email Comissão** → Notificação automática
3. **Detalhes** → Valor, cliente, comissão

## ⚙️ Configuração

### 1. Banco de Dados
Executar migração:
```sql
ALTER TABLE users 
ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
```

### 2. Integração no App
```typescript
// App.tsx
import WelcomeModal from './components/WelcomeModal'

function App() {
  return (
    <AuthProvider>
      {/* ... rotas ... */}
      <WelcomeModal />
    </AuthProvider>
  )
}
```

### 3. Webhook Hotmart
Atualizar webhook para enviar emails:
```typescript
// Após criar usuário
const emailData = {
  userName: userData.name,
  userEmail: userData.email,
  loginUrl: 'https://ciliosclick.vercel.app/login',
  cupomCode: extractedCupom,
  parceiraName: parceiraData.name
}
const template = EmailTemplatesService.welcomeEmail(emailData)
// Enviar email via serviço de email
```

## 📧 Integração com Email

### Provedores Recomendados
- **SendGrid** - Robusto e confiável
- **Mailgun** - Boa entregabilidade
- **Amazon SES** - Econômico
- **Resend** - Moderno e fácil

### Exemplo com SendGrid
```typescript
import sgMail from '@sendgrid/mail'

export const sendWelcomeEmail = async (emailData: WelcomeEmailData) => {
  const template = EmailTemplatesService.welcomeEmail(emailData)
  
  const msg = {
    to: emailData.userEmail,
    from: 'noreply@ciliosclick.com',
    subject: template.subject,
    text: template.textContent,
    html: template.htmlContent,
  }
  
  await sgMail.send(msg)
}
```

## 🎨 Personalização

### Modificar Passos do Tour
```typescript
// useOnboarding.ts - defaultSteps
const customSteps = [
  {
    id: 'welcome',
    title: 'Sua mensagem personalizada',
    description: 'Descrição customizada',
    // ...
  }
]
```

### Personalizar Templates
```typescript
// emailTemplates.ts
static customWelcomeEmail(data: CustomData): EmailTemplate {
  // Personalizar conteúdo
  const htmlContent = `<!-- Seu HTML customizado -->`
  return { subject, htmlContent, textContent }
}
```

## 📊 Métricas Sugeridas

### KPIs de Onboarding
- Taxa de conclusão do tour
- Tempo médio para primeira aplicação
- Abandono por passo
- Usuárias que retornam após 7 dias

### Query para Métricas
```sql
-- Taxa de conclusão do onboarding
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(CASE WHEN onboarding_completed THEN 1 END) as completaram,
  ROUND(COUNT(CASE WHEN onboarding_completed THEN 1 END) * 100.0 / COUNT(*), 2) as taxa_conclusao
FROM users 
WHERE created_at >= NOW() - INTERVAL '30 days';
```

## 🚀 Próximos Passos

### Melhorias Futuras
1. **Analytics Avançado** - Tracking de cada passo
2. **A/B Testing** - Diferentes versões do tour
3. **Email Sequences** - Série de emails educativos
4. **Push Notifications** - Lembretes mobile
5. **Video Tours** - Tour em vídeo opcional

### Automações Adicionais
1. **Email de Lembrete** - Se não usar em 3 dias
2. **Email de Tips** - Dicas semanais
3. **Survey de Feedback** - Após 1 semana de uso
4. **Reativação** - Para usuárias inativas

## 🔧 Troubleshooting

### Modal não aparece
- Verificar se usuário é novo (< 24h)
- Conferir campo `onboarding_completed` no banco
- Verificar importação do `WelcomeModal`

### Emails não chegam
- Validar configuração do provedor
- Verificar spam/lixo eletrônico
- Conferir rate limits do provedor

### Performance
- Templates são gerados dinamicamente
- Cache recomendado para alta escala
- Lazy loading do modal

## 📝 Checklist de Implementação

- [ ] Hook `useOnboarding` funcionando
- [ ] Modal `WelcomeModal` integrado
- [ ] Templates de email criados
- [ ] Página admin `/admin/emails` configurada
- [ ] Migração do banco executada
- [ ] Webhook atualizado para emails
- [ ] Provedor de email configurado
- [ ] Testes em ambiente de desenvolvimento
- [ ] Testes com usuários reais
- [ ] Deploy em produção

---

## 💡 Dicas de Implementação

1. **Teste Gradual** - Ativar para % pequena inicialmente
2. **Feedback Rápido** - Botão para reportar problemas
3. **Mobile First** - Garantir funcionamento perfeito mobile
4. **Acessibilidade** - Suporte a leitores de tela
5. **Loading States** - Indicadores visuais claros

O sistema de onboarding é fundamental para o sucesso da plataforma, criando uma primeira impressão profissional e guiando usuárias para o sucesso desde o primeiro momento. 🎉 