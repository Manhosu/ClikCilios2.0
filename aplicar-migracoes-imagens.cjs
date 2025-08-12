const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'demo-key'

const supabase = createClient(supabaseUrl, supabaseKey)

async function aplicarMigracaoImagens() {
  console.log('🖼️ Aplicando migração da tabela imagens...')
  
  try {
    // Ler o arquivo SQL da migração
    const sqlPath = path.join(__dirname, 'migrations', 'create_imagens_table.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf8')
    
    console.log('📄 Lendo arquivo de migração:', sqlPath)
    
    // Dividir o SQL em comandos individuais
    const comandos = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'))
    
    console.log(`⚡ Executando ${comandos.length} comandos SQL...`)
    
    // Executar cada comando individualmente
    for (let i = 0; i < comandos.length; i++) {
      const comando = comandos[i]
      console.log(`📝 Executando comando ${i + 1}/${comandos.length}...`)
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: comando })
        
        if (error) {
          console.warn(`⚠️ Aviso no comando ${i + 1}:`, error.message)
          // Continuar mesmo com avisos (pode ser que a tabela já exista)
        } else {
          console.log(`✅ Comando ${i + 1} executado com sucesso`)
        }
      } catch (cmdError) {
        console.warn(`⚠️ Erro no comando ${i + 1}:`, cmdError.message)
        // Continuar com os próximos comandos
      }
    }
    
    console.log('\n🎉 Migração da tabela imagens concluída!')
    
    // Testar se a tabela foi criada
    console.log('\n🧪 Testando tabela imagens...')
    const { data, error } = await supabase
      .from('imagens')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Erro ao testar tabela:', error.message)
      console.log('\n📋 INSTRUÇÕES MANUAIS:')
      console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard')
      console.log('2. Vá para seu projeto')
      console.log('3. Clique em "SQL Editor"')
      console.log('4. Cole e execute o seguinte SQL:')
      console.log('\n' + '='.repeat(50))
      console.log(sqlContent)
      console.log('='.repeat(50))
    } else {
      console.log('✅ Tabela imagens criada e funcionando!')
      console.log('\n🚀 Sistema de imagens pronto para uso!')
    }
    
  } catch (error) {
    console.error('❌ Erro na aplicação da migração:', error)
    console.log('\n📋 INSTRUÇÕES MANUAIS:')
    console.log('1. Acesse o painel do Supabase: https://supabase.com/dashboard')
    console.log('2. Vá para seu projeto')
    console.log('3. Clique em "SQL Editor"')
    console.log('4. Execute o arquivo: migrations/create_imagens_table.sql')
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  aplicarMigracaoImagens()
    .then(() => {
      console.log('\n🏁 Script finalizado')
      process.exit(0)
    })
    .catch(error => {
      console.error('💥 Erro fatal:', error)
      process.exit(1)
    })
}

module.exports = { aplicarMigracaoImagens }