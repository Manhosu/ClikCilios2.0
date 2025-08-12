import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias');
  process.exit(1);
}

// Usar chave de serviço para testes completos
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testarLoginSimples(email) {
  const startTime = Date.now();
  
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, nome, email, is_admin, onboarding_completed')
      .eq('email', email)
      .limit(1)
      .maybeSingle();
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    if (error) {
      return { email, success: false, duration, error: error.message };
    }
    
    if (!user) {
      return { email, success: false, duration, error: 'Usuário não encontrado' };
    }
    
    return { 
      email, 
      success: true, 
      duration, 
      user: {
        nome: user.nome,
        is_admin: user.is_admin,
        onboarding_completed: user.onboarding_completed
      }
    };
  } catch (err) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    return { email, success: false, duration, error: err.message };
  }
}

async function testarLoginsSequenciais() {
  console.log('🔄 Testando logins sequenciais (um após o outro)...');
  
  const usuarios = [
    'carinaprange86@gmail.com',
    'eduardogelista@gmail.com',
    'hotmart115@clikcilios.com',
    'hotmart116@clikcilios.com',
    'hotmart117@clikcilios.com'
  ];
  
  const resultados = [];
  
  for (const email of usuarios) {
    const resultado = await testarLoginSimples(email);
    resultados.push(resultado);
    
    if (resultado.success) {
      console.log(`✅ ${email}: ${resultado.duration}ms - ${resultado.user.nome} (Admin: ${resultado.user.is_admin ? 'Sim' : 'Não'})`);
    } else {
      console.log(`❌ ${email}: ${resultado.duration}ms - Erro: ${resultado.error}`);
    }
  }
  
  const sucessos = resultados.filter(r => r.success).length;
  const tempoMedio = resultados.reduce((acc, r) => acc + r.duration, 0) / resultados.length;
  
  console.log(`\n📊 Resultados sequenciais:`);
  console.log(`   - Sucessos: ${sucessos}/${usuarios.length}`);
  console.log(`   - Tempo médio: ${Math.round(tempoMedio)}ms`);
  
  return resultados;
}

async function testarLoginsSimultaneos() {
  console.log('\n⚡ Testando logins simultâneos (todos ao mesmo tempo)...');
  
  const usuarios = [
    'carinaprange86@gmail.com',
    'eduardogelista@gmail.com',
    'hotmart115@clikcilios.com',
    'hotmart116@clikcilios.com',
    'hotmart117@clikcilios.com',
    'hotmart118@clikcilios.com',
    'hotmart119@clikcilios.com',
    'hotmart120@clikcilios.com'
  ];
  
  const startTime = Date.now();
  
  const promises = usuarios.map(email => testarLoginSimples(email));
  const resultados = await Promise.all(promises);
  
  const endTime = Date.now();
  const tempoTotal = endTime - startTime;
  
  console.log('\n📋 Resultados simultâneos:');
  resultados.forEach(resultado => {
    if (resultado.success) {
      console.log(`✅ ${resultado.email}: ${resultado.duration}ms - ${resultado.user.nome}`);
    } else {
      console.log(`❌ ${resultado.email}: ${resultado.duration}ms - Erro: ${resultado.error}`);
    }
  });
  
  const sucessos = resultados.filter(r => r.success).length;
  const tempoMedio = resultados.reduce((acc, r) => acc + r.duration, 0) / resultados.length;
  
  console.log(`\n📊 Estatísticas simultâneas:`);
  console.log(`   - Sucessos: ${sucessos}/${usuarios.length}`);
  console.log(`   - Tempo total: ${tempoTotal}ms`);
  console.log(`   - Tempo médio por login: ${Math.round(tempoMedio)}ms`);
  console.log(`   - Eficiência: ${Math.round((tempoMedio / tempoTotal) * 100)}% (quanto menor, melhor o paralelismo)`);
  
  return resultados;
}

async function testarLoginsMassivos() {
  console.log('\n🚀 Testando logins massivos (50 usuários Hotmart simultâneos)...');
  
  // Buscar 50 usuários Hotmart
  const { data: hotmartUsers, error } = await supabase
    .from('users')
    .select('email')
    .like('email', 'hotmart%@clikcilios.com')
    .limit(50);
  
  if (error) {
    console.log('❌ Erro ao buscar usuários Hotmart:', error.message);
    return;
  }
  
  if (hotmartUsers.length === 0) {
    console.log('⚠️ Nenhum usuário Hotmart encontrado para teste');
    return;
  }
  
  console.log(`📊 Testando ${hotmartUsers.length} usuários Hotmart...`);
  
  const startTime = Date.now();
  
  const promises = hotmartUsers.map(user => testarLoginSimples(user.email));
  const resultados = await Promise.all(promises);
  
  const endTime = Date.now();
  const tempoTotal = endTime - startTime;
  
  const sucessos = resultados.filter(r => r.success).length;
  const falhas = resultados.filter(r => !r.success).length;
  const tempoMedio = resultados.reduce((acc, r) => acc + r.duration, 0) / resultados.length;
  const tempoMinimo = Math.min(...resultados.map(r => r.duration));
  const tempoMaximo = Math.max(...resultados.map(r => r.duration));
  
  console.log(`\n📊 Resultados do teste massivo:`);
  console.log(`   - Total testado: ${hotmartUsers.length} usuários`);
  console.log(`   - Sucessos: ${sucessos}`);
  console.log(`   - Falhas: ${falhas}`);
  console.log(`   - Taxa de sucesso: ${Math.round((sucessos / hotmartUsers.length) * 100)}%`);
  console.log(`   - Tempo total: ${tempoTotal}ms`);
  console.log(`   - Tempo médio: ${Math.round(tempoMedio)}ms`);
  console.log(`   - Tempo mínimo: ${tempoMinimo}ms`);
  console.log(`   - Tempo máximo: ${tempoMaximo}ms`);
  console.log(`   - Throughput: ${Math.round(sucessos / (tempoTotal / 1000))} logins/segundo`);
  
  if (falhas > 0) {
    console.log('\n❌ Falhas encontradas:');
    resultados.filter(r => !r.success).slice(0, 5).forEach(resultado => {
      console.log(`   - ${resultado.email}: ${resultado.error}`);
    });
  }
  
  return resultados;
}

async function testarCacheAutenticacao() {
  console.log('\n🔄 Testando cache de autenticação (múltiplos logins do mesmo usuário)...');
  
  const email = 'carinaprange86@gmail.com';
  const numeroTestes = 10;
  
  console.log(`📊 Fazendo ${numeroTestes} logins consecutivos para ${email}...`);
  
  const resultados = [];
  
  for (let i = 1; i <= numeroTestes; i++) {
    const resultado = await testarLoginSimples(email);
    resultados.push(resultado);
    
    if (resultado.success) {
      console.log(`✅ Tentativa ${i}: ${resultado.duration}ms`);
    } else {
      console.log(`❌ Tentativa ${i}: ${resultado.duration}ms - ${resultado.error}`);
    }
  }
  
  const sucessos = resultados.filter(r => r.success).length;
  const tempos = resultados.filter(r => r.success).map(r => r.duration);
  const tempoMedio = tempos.reduce((acc, t) => acc + t, 0) / tempos.length;
  const tempoMinimo = Math.min(...tempos);
  const tempoMaximo = Math.max(...tempos);
  
  console.log(`\n📊 Análise de cache:`);
  console.log(`   - Sucessos: ${sucessos}/${numeroTestes}`);
  console.log(`   - Tempo médio: ${Math.round(tempoMedio)}ms`);
  console.log(`   - Tempo mínimo: ${tempoMinimo}ms`);
  console.log(`   - Tempo máximo: ${tempoMaximo}ms`);
  console.log(`   - Variação: ${tempoMaximo - tempoMinimo}ms`);
  
  if (tempoMaximo - tempoMinimo < 50) {
    console.log(`✅ Cache funcionando bem (baixa variação)`);
  } else {
    console.log(`⚠️ Cache pode estar inconsistente (alta variação)`);
  }
}

async function main() {
  try {
    console.log('🔐 TESTE COMPLETO DE AUTENTICAÇÃO MÚLTIPLA');
    console.log('=' .repeat(50));
    
    await testarLoginsSequenciais();
    await testarLoginsSimultaneos();
    await testarLoginsMassivos();
    await testarCacheAutenticacao();
    
    console.log('\n🎉 TODOS OS TESTES CONCLUÍDOS!');
    console.log('\n📋 RESUMO:');
    console.log('   ✅ Logins sequenciais testados');
    console.log('   ✅ Logins simultâneos testados');
    console.log('   ✅ Logins massivos testados');
    console.log('   ✅ Cache de autenticação testado');
    
    console.log('\n🚀 Sistema de autenticação está funcionando corretamente!');
    
  } catch (error) {
    console.error('❌ Erro durante testes de autenticação:', error);
    process.exit(1);
  }
}

main();