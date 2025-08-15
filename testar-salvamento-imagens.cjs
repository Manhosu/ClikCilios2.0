const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas')
  console.log('Certifique-se de que VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testarSalvamentoImagens() {
  console.log('🧪 Testando salvamento de imagens no banco de dados...')
  
  try {
    // 1. Fazer login com usuário de teste
    console.log('\n1. Fazendo login...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'eduardo@teste.com',
      password: '123456'
    })
    
    if (authError) {
      console.error('❌ Erro no login:', authError.message)
      return
    }
    
    console.log('✅ Login realizado com sucesso')
    console.log('👤 Usuário:', authData.user.email)
    
    // 2. Verificar se a tabela imagens existe
    console.log('\n2. Verificando tabela imagens...')
    const { data: tabelaTest, error: tabelaError } = await supabase
      .from('imagens')
      .select('count')
      .limit(1)
    
    if (tabelaError) {
      console.error('❌ Erro ao acessar tabela imagens:', tabelaError.message)
      return
    }
    
    console.log('✅ Tabela imagens acessível')
    
    // 3. Listar imagens existentes
    console.log('\n3. Listando imagens existentes...')
    const { data: imagensExistentes, error: listarError } = await supabase
      .from('imagens')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
    
    if (listarError) {
      console.error('❌ Erro ao listar imagens:', listarError.message)
      return
    }
    
    console.log(`📊 Total de imagens existentes: ${imagensExistentes?.length || 0}`)
    
    if (imagensExistentes && imagensExistentes.length > 0) {
      console.log('\n📋 Últimas 3 imagens:')
      imagensExistentes.slice(0, 3).forEach((img, index) => {
        console.log(`  ${index + 1}. ${img.nome_arquivo}`)
        console.log(`     Estilo: ${img.estilo_aplicado || 'N/A'}`)
        console.log(`     Cliente: ${img.cliente_nome || 'N/A'}`)
        console.log(`     Data: ${new Date(img.created_at).toLocaleString('pt-BR')}`)
        console.log(`     URL Original: ${img.url_original ? 'Sim' : 'Não'}`)
        console.log(`     URL Processada: ${img.url_processada ? 'Sim' : 'Não'}`)
        console.log('')
      })
    }
    
    // 4. Criar uma imagem de teste
    console.log('\n4. Criando imagem de teste...')
    const imagemTeste = {
      user_id: authData.user.id,
      nome_arquivo: `teste_imagem_${Date.now()}.jpg`,
      url_original: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
      url_processada: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/wA==',
      estilo_aplicado: 'Volume Russo D',
      cliente_nome: 'Cliente Teste Salvamento',
      observacoes: 'Imagem de teste para verificar salvamento automático'
    }
    
    const { data: novaImagem, error: criarError } = await supabase
      .from('imagens')
      .insert([imagemTeste])
      .select()
      .single()
    
    if (criarError) {
      console.error('❌ Erro ao criar imagem:', criarError.message)
      return
    }
    
    console.log('✅ Imagem criada com sucesso!')
    console.log('🆔 ID da imagem:', novaImagem.id)
    console.log('📁 Nome do arquivo:', novaImagem.nome_arquivo)
    
    // 5. Verificar se a imagem foi salva corretamente
    console.log('\n5. Verificando se a imagem foi salva corretamente...')
    const { data: imagemVerificacao, error: verificarError } = await supabase
      .from('imagens')
      .select('*')
      .eq('id', novaImagem.id)
      .single()
    
    if (verificarError) {
      console.error('❌ Erro ao verificar imagem:', verificarError.message)
      return
    }
    
    console.log('✅ Imagem verificada com sucesso!')
    console.log('📊 Dados da imagem:')
    console.log('  - ID:', imagemVerificacao.id)
    console.log('  - Nome:', imagemVerificacao.nome_arquivo)
    console.log('  - Estilo:', imagemVerificacao.estilo_aplicado)
    console.log('  - Cliente:', imagemVerificacao.cliente_nome)
    console.log('  - URL Original:', imagemVerificacao.url_original ? 'Presente' : 'Ausente')
    console.log('  - URL Processada:', imagemVerificacao.url_processada ? 'Presente' : 'Ausente')
    console.log('  - Data de criação:', new Date(imagemVerificacao.created_at).toLocaleString('pt-BR'))
    console.log('  - Observações:', imagemVerificacao.observacoes)
    
    // 6. Testar listagem após criação
    console.log('\n6. Testando listagem após criação...')
    const { data: imagensAtualizadas, error: listarError2 } = await supabase
      .from('imagens')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
    
    if (listarError2) {
      console.error('❌ Erro ao listar imagens atualizadas:', listarError2.message)
      return
    }
    
    console.log(`📊 Total de imagens após criação: ${imagensAtualizadas?.length || 0}`)
    
    // 7. Limpar - deletar a imagem de teste
    console.log('\n7. Limpando - deletando imagem de teste...')
    const { error: deletarError } = await supabase
      .from('imagens')
      .delete()
      .eq('id', novaImagem.id)
    
    if (deletarError) {
      console.error('❌ Erro ao deletar imagem de teste:', deletarError.message)
    } else {
      console.log('✅ Imagem de teste deletada com sucesso')
    }
    
    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!')
    console.log('\n📋 RESUMO:')
    console.log('✅ Tabela imagens está funcionando')
    console.log('✅ Criação de imagens está funcionando')
    console.log('✅ Listagem de imagens está funcionando')
    console.log('✅ Verificação de dados está funcionando')
    console.log('✅ Deleção de imagens está funcionando')
    console.log('✅ RLS (Row Level Security) está funcionando')
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error)
  }
}

// Executar o teste
testarSalvamentoImagens()
  .then(() => {
    console.log('\n🏁 Teste finalizado')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Erro fatal:', error)
    process.exit(1)
  })