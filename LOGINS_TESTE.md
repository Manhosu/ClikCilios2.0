# 🔐 Logins para Teste - ClikCílios 2.0

## 📋 Informações Importantes

- **Sistema em Produção**: Usando Supabase Auth real
- **Modo Dev Desabilitado**: Sem usuários mock
- **Confirmação de Email**: Pode estar ativada no Supabase

## 👤 Usuários de Teste

### Admin Principal
```
Email: admin@clikcilios.com
Senha: Admin123!
Tipo: Administrador
Status: Ativo
```

### Usuário Teste 1
```
Email: teste1@clikcilios.com
Senha: Teste123!
Tipo: Cliente
Status: Ativo
```

### Usuário Teste 2
```
Email: teste2@clikcilios.com
Senha: Teste123!
Tipo: Cliente
Status: Ativo
```

### Usuário Demo
```
Email: demo@clikcilios.com
Senha: Demo123!
Tipo: Cliente
Status: Ativo
```

## 🚀 Como Testar

### 1. Desenvolvimento Local
```bash
npm run dev
```
Acesse: http://localhost:5173

### 2. Teste de Login
1. Acesse a página de login
2. Use qualquer um dos emails/senhas acima
3. Se der erro de "usuário não confirmado", verifique o Supabase Auth

### 3. Teste de Registro
1. Use um email novo (ex: `novo@teste.com`)
2. Senha: `NovoTeste123!`
3. Nome: `Usuário Novo`

## ⚙️ Configurações do Supabase

### Desabilitar Confirmação de Email (Opcional)
```sql
-- No Supabase SQL Editor
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email_confirmed_at IS NULL;
```

### Verificar Usuários Criados
```sql
-- Ver usuários no Auth
SELECT id, email, created_at, email_confirmed_at 
FROM auth.users 
ORDER BY created_at DESC;
```

## 🔧 Troubleshooting

### Erro: "Invalid login credentials"
- Verifique se o usuário existe no Supabase Auth
- Confirme se a senha está correta
- Verifique se o email foi confirmado

### Erro: "Email not confirmed"
- Confirme o email manualmente no Supabase
- Ou desabilite a confirmação de email

### Sistema não carrega perfil
- Normal! O sistema agora cria perfis dinamicamente
- Baseado nos dados do Supabase Auth
- Não depende mais da tabela `users`

## 📱 URLs de Teste

- **Login**: `/login`
- **Dashboard**: `/dashboard`
- **Aplicar Cílios**: `/aplicar-cilios`
- **Clientes**: `/clientes`
- **Admin Cupons**: `/admin/cupons`
- **Admin Emails**: `/admin/emails`

## 🎯 Funcionalidades para Testar

✅ **Login/Logout**
✅ **Registro de novos usuários**
✅ **Aplicação de cílios com IA**
✅ **Galeria de imagens**
✅ **Sistema de clientes**
✅ **Painel administrativo**
✅ **Sistema de cupons**
✅ **Webhook Hotmart** (em produção)

---

**Sistema 100% funcional e pronto para produção! 🚀**