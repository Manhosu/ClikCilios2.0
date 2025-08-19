import { supabase } from '../lib/supabase';
export class CuponsService {
    static async listarCupons() {
        try {
            const { data, error } = await supabase
                .from('cupons')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) {
                console.error('Erro ao listar cupons:', error);
                return { data: null, error: error.message };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro interno ao listar cupons:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async criarCupom(cupomData) {
        try {
            const { data: existente } = await supabase
                .from('cupons')
                .select('codigo')
                .eq('codigo', cupomData.codigo.toUpperCase())
                .single();
            if (existente) {
                return { data: null, error: 'Código de cupom já existe' };
            }
            const { data, error } = await supabase
                .from('cupons')
                .insert([{
                    codigo: cupomData.codigo.toUpperCase(),
                    parceira_nome: cupomData.parceira_nome,
                    parceira_email: cupomData.parceira_email.toLowerCase(),
                    percentual_comissao: cupomData.percentual_comissao || 20.0
                }])
                .select()
                .single();
            if (error) {
                console.error('Erro ao criar cupom:', error);
                return { data: null, error: error.message };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro interno ao criar cupom:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async atualizarCupom(id, cupomData) {
        try {
            const updateData = {};
            if (cupomData.codigo) {
                const { data: existente } = await supabase
                    .from('cupons')
                    .select('id')
                    .eq('codigo', cupomData.codigo.toUpperCase())
                    .neq('id', id)
                    .single();
                if (existente) {
                    return { data: null, error: 'Código de cupom já existe' };
                }
                updateData.codigo = cupomData.codigo.toUpperCase();
            }
            if (cupomData.parceira_nome)
                updateData.parceira_nome = cupomData.parceira_nome;
            if (cupomData.parceira_email)
                updateData.parceira_email = cupomData.parceira_email.toLowerCase();
            if (cupomData.percentual_comissao !== undefined)
                updateData.percentual_comissao = cupomData.percentual_comissao;
            const { data, error } = await supabase
                .from('cupons')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Erro ao atualizar cupom:', error);
                return { data: null, error: error.message };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro interno ao atualizar cupom:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async toggleAtivoCupom(id) {
        try {
            const { data: cupomAtual } = await supabase
                .from('cupons')
                .select('ativo')
                .eq('id', id)
                .single();
            if (!cupomAtual) {
                return { data: null, error: 'Cupom não encontrado' };
            }
            const { data, error } = await supabase
                .from('cupons')
                .update({ ativo: !cupomAtual.ativo })
                .eq('id', id)
                .select()
                .single();
            if (error) {
                console.error('Erro ao alterar status do cupom:', error);
                return { data: null, error: error.message };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro interno ao alterar status:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async excluirCupom(id) {
        try {
            const { error } = await supabase
                .from('cupons')
                .delete()
                .eq('id', id);
            if (error) {
                console.error('Erro ao excluir cupom:', error);
                return { error: error.message };
            }
            return { error: null };
        }
        catch (error) {
            console.error('Erro interno ao excluir cupom:', error);
            return { error: 'Erro interno do servidor' };
        }
    }
    static async buscarCupomPorCodigo(codigo) {
        try {
            const { data, error } = await supabase
                .from('cupons')
                .select('*')
                .eq('codigo', codigo.toUpperCase())
                .eq('ativo', true)
                .single();
            if (error && error.code !== 'PGRST116') {
                console.error('Erro ao buscar cupom:', error);
                return { data: null, error: error.message };
            }
            return { data, error: null };
        }
        catch (error) {
            console.error('Erro interno ao buscar cupom:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async registrarUsoCupom(usoData) {
        try {
            const { data: cupom } = await supabase
                .from('cupons')
                .select('id, percentual_comissao')
                .eq('id', usoData.cupom_id)
                .single();
            if (!cupom) {
                return { data: null, error: 'Cupom não encontrado' };
            }
            const { data: user } = await supabase
                .from('users')
                .select('id')
                .eq('email', usoData.email_cliente.toLowerCase())
                .single();
            if (!user) {
                return { data: null, error: 'Usuário não encontrado' };
            }
            const valorCompra = usoData.valor_venda || 0;
            const valorComissao = valorCompra * (cupom.percentual_comissao / 100);
            const { data: usoResult, error } = await supabase
                .from('usos_cupons')
                .insert([{
                    cupom_id: usoData.cupom_id,
                    user_id: user.id,
                    valor_compra: valorCompra,
                    valor_comissao: valorComissao,
                    origem: usoData.origem || 'manual',
                    hotmart_transaction_id: usoData.observacoes || null
                }])
                .select()
                .single();
            if (error) {
                console.error('Erro ao registrar uso do cupom:', error);
                return { data: null, error: error.message };
            }
            const usoMapeado = {
                id: usoResult.id,
                cupom_id: usoResult.cupom_id,
                email_cliente: usoData.email_cliente.toLowerCase(),
                valor_venda: usoResult.valor_compra,
                comissao_calculada: usoResult.valor_comissao,
                data_uso: usoResult.created_at,
                origem: usoResult.origem,
                observacoes: usoResult.hotmart_transaction_id,
                created_at: usoResult.created_at
            };
            return { data: usoMapeado, error: null };
        }
        catch (error) {
            console.error('Erro interno ao registrar uso:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async listarUsosCupons(filtros) {
        try {
            let query = supabase
                .from('usos_cupons')
                .select(`
          *,
          cupom:cupons(*),
          user:users(email)
        `)
                .order('created_at', { ascending: false });
            if (filtros?.cupom_id) {
                query = query.eq('cupom_id', filtros.cupom_id);
            }
            if (filtros?.origem) {
                query = query.eq('origem', filtros.origem);
            }
            if (filtros?.data_inicio) {
                query = query.gte('created_at', filtros.data_inicio);
            }
            if (filtros?.data_fim) {
                query = query.lte('created_at', filtros.data_fim);
            }
            const { data: rawData, error } = await query;
            if (error) {
                console.error('Erro ao listar usos de cupons:', error);
                return { data: null, error: error.message };
            }
            const usosMapeados = rawData?.map((uso) => ({
                id: uso.id,
                cupom_id: uso.cupom_id,
                email_cliente: uso.user?.email || '',
                valor_venda: uso.valor_compra,
                comissao_calculada: uso.valor_comissao,
                data_uso: uso.created_at,
                origem: uso.origem,
                observacoes: uso.hotmart_transaction_id,
                created_at: uso.created_at,
                cupom: uso.cupom
            })) || [];
            return { data: usosMapeados, error: null };
        }
        catch (error) {
            console.error('Erro interno ao listar usos:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
    static async relatorioComissoes(filtros) {
        try {
            let query = supabase
                .from('usos_cupons')
                .select(`
          cupom_id,
          cupom:cupons(codigo, parceira_nome, parceira_email, percentual_comissao),
          valor_compra,
          valor_comissao
        `);
            if (filtros?.data_inicio) {
                query = query.gte('created_at', filtros.data_inicio);
            }
            if (filtros?.data_fim) {
                query = query.lte('created_at', filtros.data_fim);
            }
            const { data, error } = await query;
            if (error) {
                console.error('Erro ao gerar relatório:', error);
                return { data: null, error: error.message };
            }
            const relatorio = data?.reduce((acc, uso) => {
                const cupomId = uso.cupom_id;
                if (!acc[cupomId]) {
                    acc[cupomId] = {
                        cupom: uso.cupom,
                        total_usos: 0,
                        total_vendas: 0,
                        total_comissoes: 0
                    };
                }
                acc[cupomId].total_usos += 1;
                acc[cupomId].total_vendas += uso.valor_compra || 0;
                acc[cupomId].total_comissoes += uso.valor_comissao || 0;
                return acc;
            }, {});
            const resultado = Object.values(relatorio || {});
            return { data: resultado, error: null };
        }
        catch (error) {
            console.error('Erro interno no relatório:', error);
            return { data: null, error: 'Erro interno do servidor' };
        }
    }
}
