# 🎫 Sistema de Cupons CíliosClick

## 📋 Resumo da Implementação

Sistema completo de gerenciamento de cupons e comissões para parceiras do CíliosClick, implementado com Supabase e React.

## 🏗️ Estrutura do Sistema

### Banco de Dados

#### Tabela `cupons`
```sql
- id: UUID (chave primária)
- codigo: TEXT UNIQUE (ex: LANA20, BIAFOX)
- nome_parceira: TEXT
- email_parceira: TEXT  
- comissao_percentual: FLOAT (padrão: 20.0)
- ativo: BOOLEAN (padrão: true)
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### Tabela `usos_cupons`
```sql
- id: UUID (chave primária)
- cupom_id: UUID (referência para cupons)
- email_cliente: TEXT
- valor_venda: FLOAT (opcional)
- comissao_calculada: FLOAT (calculada automaticamente)
- data_uso: TIMESTAMPTZ (padrão: NOW())
- origem: TEXT (manual, hotmart, outro)
- observacoes: TEXT (opcional)
- created_at: TIMESTAMPTZ
```

### Segurança (RLS)
- Apenas administradores podem acessar as tabelas
- Políticas configuradas para verificar tipo de usuário
- Trigger automático para definir Carina como admin

## 🎯 Funcionalidades Implementadas

### 1. Gerenciamento de Cupons (`/admin/cupons`)
- ✅ **Criar cupons**: Formulário completo com validação
- ✅ **Listar cupons**: Tabela com todos os cupons e status
- ✅ **Editar cupons**: Modificar dados existentes
- ✅ **Ativar/Desativar**: Toggle de status sem exclusão
- ✅ **Excluir cupons**: Remoção permanente com confirmação
- ✅ **Validação**: Códigos únicos e formato válido

### 2. Relatórios (`/admin/relatorio-cupons`)
- ✅ **Relatório de comissões**: Agrupado por cupom
- ✅ **Histórico detalhado**: Lista completa de usos
- ✅ **Filtros avançados**: Por cupom, data, origem
- ✅ **Registro manual**: Adicionar vendas manualmente
- ✅ **Estatísticas**: Total de usos, vendas e comissões
- ✅ **Formatação**: Valores em reais, datas brasileiras

### 3. Controle de Acesso
- ✅ **Hook useAdmin**: Verificação de permissões
- ✅ **Páginas protegidas**: Acesso apenas para admins
- ✅ **Dashboard integrado**: Links administrativos condicionais
- ✅ **Redirecionamento**: Usuários não-admin são redirecionados

## 🔧 Arquivos Criados/Modificados

### Novos Arquivos
```
src/services/cuponsService.ts         # Serviço completo de cupons
src/hooks/useAdmin.ts                 # Hook de verificação admin
src/pages/AdminCuponsPage.tsx         # Página de gerenciamento
src/pages/AdminRelatorioCuponsPage.tsx # Página de relatórios
CUPONS_SISTEMA.md                     # Esta documentação
```

### Arquivos Modificados
```
src/App.tsx                          # Adicionadas rotas admin
src/pages/Dashboard.tsx               # Links administrativos
README.md                             # Documentação atualizada
```

### Banco de Dados
```
4 migrações aplicadas:
- create_cupons_system: Tabelas e RLS
- auto_admin_carina: Trigger para admin automático
- cupons_utilities: Funções SQL utilitárias
- Dados de exemplo: 5 cupons + usos de teste
```

## 🎨 Interface do Sistema

### Página de Cupons
- **Header**: Título, botões de navegação
- **Formulário**: Criar/editar cupons (modal/expansível)
- **Tabela**: Lista com ações (editar, ativar, excluir)
- **Feedback**: Mensagens de sucesso/erro

### Página de Relatórios
- **Filtros**: Cupom, origem, período
- **Resumo**: Comissões agrupadas por cupom
- **Detalhes**: Histórico completo de usos
- **Registro**: Formulário para vendas manuais

## 📊 Exemplos de Uso

### Criar Cupom
```typescript
await CuponsService.criarCupom({
  codigo: 'NOVA25',
  nome_parceira: 'Nova Parceira',
  email_parceira: 'nova@email.com',
  comissao_percentual: 25.0
})
```

### Registrar Uso
```typescript
await CuponsService.registrarUsoCupom({
  cupom_id: 'uuid-do-cupom',
  email_cliente: 'cliente@email.com',
  valor_venda: 150.00,
  origem: 'hotmart',
  observacoes: 'Venda automática'
})
```

### Gerar Relatório
```typescript
const { data } = await CuponsService.relatorioComissoes({
  data_inicio: '2024-01-01',
  data_fim: '2024-12-31'
})
```

## 🚀 Fluxo de Trabalho

### Para Administradores
1. **Login** no sistema (Carina é admin automaticamente)
2. **Acesso** às páginas admin via Dashboard
3. **Gerenciar** cupons das parceiras
4. **Acompanhar** vendas e comissões
5. **Registrar** vendas manuais quando necessário

### Para Integração Hotmart (Futuro)
1. **Webhook** recebe dados da venda
2. **Validação** do cupom usado
3. **Registro** automático do uso
4. **Cálculo** da comissão
5. **Atualização** dos relatórios

## 🔮 Próximos Passos

### Integração Hotmart
- [ ] Endpoint para webhook
- [ ] Validação de assinatura
- [ ] Mapeamento de dados
- [ ] Tratamento de erros

### Melhorias do Sistema
- [ ] Notificações por email
- [ ] Exportação de relatórios (Excel/PDF)
- [ ] Dashboard de analytics
- [ ] Sistema de metas por parceira
- [ ] Histórico de alterações

### Performance
- [ ] Paginação nas tabelas
- [ ] Cache de relatórios
- [ ] Índices adicionais
- [ ] Otimização de queries

## 📝 Observações Técnicas

### Configurações Importantes
- RLS habilitado em todas as tabelas
- Triggers para automação
- Funções SQL para operações complexas
- Validações tanto no frontend quanto backend

### Segurança
- Acesso restrito por email da Carina
- Verificação de permissões em todas as rotas
- Sanitização de dados de entrada
- Logs de auditoria (futuro)

### Escalabilidade
- Estrutura preparada para múltiplos admins
- Sistema flexível de permissões
- Dados organizados para performance
- Integração preparada para APIs externas

---

**Status**: ✅ **Implementação Completa**  
**Testado**: ✅ **Funcional**  
**Documentado**: ✅ **Completo** 