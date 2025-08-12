import { supabase } from '../lib/supabase'

export interface Cupom {
  id: string
  codigo: string
  parceira_nome: string
  parceira_email: string
  percentual_comissao: number
  ativo: boolean
  created_at: string
  updated_at: string
}

export interface UsoCupom {
  id: string
  cupom_id: string
  email_cliente: string
  valor_venda: number | null
  comissao_calculada: number | null
  data_uso: string
  origem: string
  observacoes: string | null
  created_at: string
  cupom?: Cupom
}

export interface CupomFormData {
  codigo: string
  parceira_nome: string
  parceira_email: string
  percentual_comissao?: number
}

export interface UsoCupomFormData {
  cupom_id: string
  email_cliente: string
  valor_venda?: number
  origem?: string
  observacoes?: string
}

/**
 * Serviço para gerenciar cupons
 */
export class CuponsService {
  
  /**
   * Listar todos os cupons
   */
  static async listarCupons(): Promise<{ data: Cupom[] | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Erro ao listar cupons:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro interno ao listar cupons:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Criar novo cupom
   */
  static async criarCupom(cupomData: CupomFormData): Promise<{ data: Cupom | null; error: string | null }> {
    try {
      // Verificar se o código já existe
      const { data: existente } = await supabase
        .from('cupons')
        .select('codigo')
        .eq('codigo', cupomData.codigo.toUpperCase())
        .single()

      if (existente) {
        return { data: null, error: 'Código de cupom já existe' }
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
        .single()

      if (error) {
        console.error('Erro ao criar cupom:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro interno ao criar cupom:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Atualizar cupom
   */
  static async atualizarCupom(id: string, cupomData: Partial<CupomFormData>): Promise<{ data: Cupom | null; error: string | null }> {
    try {
      const updateData: any = {}
      
      if (cupomData.codigo) {
        // Verificar se o novo código já existe em outro cupom
        const { data: existente } = await supabase
          .from('cupons')
          .select('id')
          .eq('codigo', cupomData.codigo.toUpperCase())
          .neq('id', id)
          .single()

        if (existente) {
          return { data: null, error: 'Código de cupom já existe' }
        }
        updateData.codigo = cupomData.codigo.toUpperCase()
      }

      if (cupomData.parceira_nome) updateData.parceira_nome = cupomData.parceira_nome
      if (cupomData.parceira_email) updateData.parceira_email = cupomData.parceira_email.toLowerCase()
      if (cupomData.percentual_comissao !== undefined) updateData.percentual_comissao = cupomData.percentual_comissao

      const { data, error } = await supabase
        .from('cupons')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao atualizar cupom:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro interno ao atualizar cupom:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Ativar/Desativar cupom
   */
  static async toggleAtivoCupom(id: string): Promise<{ data: Cupom | null; error: string | null }> {
    try {
      // Buscar estado atual
      const { data: cupomAtual } = await supabase
        .from('cupons')
        .select('ativo')
        .eq('id', id)
        .single()

      if (!cupomAtual) {
        return { data: null, error: 'Cupom não encontrado' }
      }

      const { data, error } = await supabase
        .from('cupons')
        .update({ ativo: !cupomAtual.ativo })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Erro ao alterar status do cupom:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro interno ao alterar status:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Excluir cupom
   */
  static async excluirCupom(id: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase
        .from('cupons')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Erro ao excluir cupom:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Erro interno ao excluir cupom:', error)
      return { error: 'Erro interno do servidor' }
    }
  }

  /**
   * Buscar cupom por código
   */
  static async buscarCupomPorCodigo(codigo: string): Promise<{ data: Cupom | null; error: string | null }> {
    try {
      const { data, error } = await supabase
        .from('cupons')
        .select('*')
        .eq('codigo', codigo.toUpperCase())
        .eq('ativo', true)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = not found
        console.error('Erro ao buscar cupom:', error)
        return { data: null, error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      console.error('Erro interno ao buscar cupom:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Registrar uso de cupom
   */
  static async registrarUsoCupom(usoData: UsoCupomFormData): Promise<{ data: UsoCupom | null; error: string | null }> {
    try {
      // Buscar dados do cupom para calcular comissão
      const { data: cupom } = await supabase
        .from('cupons')
        .select('id, percentual_comissao')
        .eq('id', usoData.cupom_id)
        .single()

      if (!cupom) {
        return { data: null, error: 'Cupom não encontrado' }
      }

      // Buscar user_id pelo email
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('email', usoData.email_cliente.toLowerCase())
        .single()

      if (!user) {
        return { data: null, error: 'Usuário não encontrado' }
      }

      const valorCompra = usoData.valor_venda || 0
      const valorComissao = valorCompra * (cupom.percentual_comissao / 100)

      // Inserir na tabela com os novos campos do schema
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
        .single()

      if (error) {
        console.error('Erro ao registrar uso do cupom:', error)
        return { data: null, error: error.message }
      }

      // Mapear resultado para interface legacy
      const usoMapeado: UsoCupom = {
        id: usoResult.id,
        cupom_id: usoResult.cupom_id,
        email_cliente: usoData.email_cliente.toLowerCase(),
        valor_venda: usoResult.valor_compra,
        comissao_calculada: usoResult.valor_comissao,
        data_uso: usoResult.created_at,
        origem: usoResult.origem,
        observacoes: usoResult.hotmart_transaction_id,
        created_at: usoResult.created_at
      }

      return { data: usoMapeado, error: null }
    } catch (error) {
      console.error('Erro interno ao registrar uso:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Listar usos de cupons com filtros
   */
  static async listarUsosCupons(filtros?: {
    cupom_id?: string
    origem?: string
    data_inicio?: string
    data_fim?: string
  }): Promise<{ data: UsoCupom[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('usos_cupons')
        .select(`
          *,
          cupom:cupons(*),
          user:users(email)
        `)
        .order('created_at', { ascending: false })

      if (filtros?.cupom_id) {
        query = query.eq('cupom_id', filtros.cupom_id)
      }

      if (filtros?.origem) {
        query = query.eq('origem', filtros.origem)
      }

      if (filtros?.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio)
      }

      if (filtros?.data_fim) {
        query = query.lte('created_at', filtros.data_fim)
      }

      const { data: rawData, error } = await query

      if (error) {
        console.error('Erro ao listar usos de cupons:', error)
        return { data: null, error: error.message }
      }

      // Mapear dados para interface legacy
      const usosMapeados: UsoCupom[] = rawData?.map((uso: any) => ({
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
      })) || []

      return { data: usosMapeados, error: null }
    } catch (error) {
      console.error('Erro interno ao listar usos:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }

  /**
   * Relatório de comissões por cupom
   */
  static async relatorioComissoes(filtros?: {
    data_inicio?: string
    data_fim?: string
  }): Promise<{ data: any[] | null; error: string | null }> {
    try {
      let query = supabase
        .from('usos_cupons')
        .select(`
          cupom_id,
          cupom:cupons(codigo, parceira_nome, parceira_email, percentual_comissao),
          valor_compra,
          valor_comissao
        `)

      if (filtros?.data_inicio) {
        query = query.gte('created_at', filtros.data_inicio)
      }

      if (filtros?.data_fim) {
        query = query.lte('created_at', filtros.data_fim)
      }

      const { data, error } = await query

      if (error) {
        console.error('Erro ao gerar relatório:', error)
        return { data: null, error: error.message }
      }

      // Agrupar dados por cupom
      const relatorio = data?.reduce((acc: any, uso: any) => {
        const cupomId = uso.cupom_id
        
        if (!acc[cupomId]) {
          acc[cupomId] = {
            cupom: uso.cupom,
            total_usos: 0,
            total_vendas: 0,
            total_comissoes: 0
          }
        }

        acc[cupomId].total_usos += 1
        acc[cupomId].total_vendas += uso.valor_compra || 0
        acc[cupomId].total_comissoes += uso.valor_comissao || 0

        return acc
      }, {})

      const resultado = Object.values(relatorio || {})

      return { data: resultado, error: null }
    } catch (error) {
      console.error('Erro interno no relatório:', error)
      return { data: null, error: 'Erro interno do servidor' }
    }
  }
}