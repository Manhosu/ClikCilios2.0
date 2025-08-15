// Teste das variáveis de ambiente
require('dotenv').config();

console.log('🔧 Testando carregamento das variáveis de ambiente...');
console.log('');

// Variáveis do .env
console.log('📁 Variáveis do arquivo .env:');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada');
console.log('');

// Simular o contexto do Vite
console.log('🌐 Simulando contexto do Vite:');
// Em Node.js, sempre será considerado API context (sem import.meta)
const isApiContext = true;
console.log('isApiContext:', isApiContext);

// Como o Vite carregaria as variáveis no contexto de API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('supabaseUrl (como Vite carregaria):', supabaseUrl);
console.log('supabaseAnonKey (como Vite carregaria):', supabaseAnonKey ? 'Configurada' : 'Não configurada');
console.log('');

// Verificar se seria considerado desenvolvimento
const isDevelopment = !supabaseUrl || !supabaseAnonKey;
console.log('🔍 Seria considerado modo desenvolvimento?', isDevelopment);

if (isDevelopment) {
  console.log('⚠️ PROBLEMA IDENTIFICADO:');
  console.log('   O sistema está entrando em modo desenvolvimento');
  console.log('   porque as variáveis não estão sendo carregadas corretamente.');
  console.log('');
  console.log('💡 POSSÍVEIS SOLUÇÕES:');
  console.log('   1. Reiniciar o servidor de desenvolvimento (npm run dev)');
  console.log('   2. Verificar se o arquivo .env está na raiz do projeto');
  console.log('   3. Verificar se as variáveis começam com VITE_');
} else {
  console.log('✅ Configuração correta! Sistema usará Supabase.');
}

console.log('');
console.log('🏁 Teste concluído.');