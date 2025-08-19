import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../hooks/useAuthContext';
import { clientesService } from '../services/clientesService';
import { imageApiService } from '../services/imageApiService';
import Button from '../components/Button';
const MinhasImagensPage = () => {
    const navigate = useNavigate();
    const { user, isLoading: userLoading } = useAuthContext();
    const [imagens, setImagens] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filtroEstilo, setFiltroEstilo] = useState('');
    const [filtroCliente, setFiltroCliente] = useState('');
    const [imagemSelecionada, setImagemSelecionada] = useState(null);
    const [modalAberto, setModalAberto] = useState(false);
    const estilos = [
        'Volume Fio a Fio D',
        'Volume Brasileiro D',
        'Volume Egípcio 3D D',
        'Volume Russo D',
        'Boneca',
        'Fox Eyes'
    ];
    useEffect(() => {
        if (!userLoading && user?.id) {
            carregarDados();
        }
        else if (!userLoading && !user?.id) {
            setLoading(false);
            setImagens([]);
            setClientes([]);
        }
    }, [user, userLoading]);
    useEffect(() => {
        const handleFocus = () => {
            if (user?.id && !loading) {
                carregarDados();
            }
        };
        const handleStorageChange = (e) => {
            if ((e.key?.includes('ciliosclick_clientes') || e.key?.includes('ciliosclick_imagens')) && user?.id && !loading) {
                carregarDados();
            }
        };
        window.addEventListener('focus', handleFocus);
        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, [user?.id, loading]);
    useEffect(() => {
        if (!user?.id)
            return;
        const interval = setInterval(() => {
            if (!document.hidden && !loading) {
                carregarDados();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [user?.id, loading]);
    const carregarDados = async () => {
        try {
            setLoading(true);
            if (!user?.id) {
                setImagens([]);
                setClientes([]);
                return;
            }
            const [imagensData, clientesData] = await Promise.all([
                imageApiService.listar(),
                clientesService.listar(user.id)
            ]);
            setImagens(imagensData);
            setClientes(clientesData);
            console.log('📊 Dados carregados:', {
                totalImagens: imagensData.length,
                totalClientes: clientesData.length,
                processadas: imagensData.filter(img => img.tipo === 'depois').length,
                tiposUnicos: new Set(imagensData.map(img => img.tipo)).size
            });
        }
        catch (error) {
            console.error('Erro ao carregar dados:', error);
            setImagens([]);
            setClientes([]);
        }
        finally {
            setLoading(false);
        }
    };
    const excluirImagem = async (id) => {
        if (!confirm('Tem certeza que deseja excluir esta imagem?'))
            return;
        try {
            const sucesso = await imageApiService.excluir(id);
            if (sucesso) {
                setImagens(prev => prev.filter(img => img.id !== id));
                setModalAberto(false);
                carregarDados();
            }
            else {
                alert('Imagem não encontrada');
            }
        }
        catch (error) {
            console.error('Erro ao excluir imagem:', error);
            alert('Erro ao excluir imagem');
        }
    };
    const imagensFiltradas = imagens.filter(img => {
        const matchEstilo = !filtroEstilo || img.tipo === filtroEstilo;
        const matchCliente = !filtroCliente || img.cliente_id?.toLowerCase().includes(filtroCliente.toLowerCase());
        return matchEstilo && matchCliente;
    });
    const formatarData = (data) => {
        return new Date(data).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    if (loading || userLoading) {
        return (<div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">
            {userLoading ? 'Carregando usuário...' : 'Carregando suas imagens...'}
          </p>
        </div>
      </div>);
    }
    return (<div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="mb-4">
              <Button onClick={() => navigate('/dashboard')} variant="secondary">
                ← Voltar ao Dashboard
              </Button>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              Minhas Criações
            </h1>
            <p className="text-gray-600 mt-2">✨ Gerencie suas imagens processadas</p>
          </div>
          <Button onClick={() => navigate('/aplicar-cilios')} variant="primary" className="shadow-elegant hover:scale-105 transition-transform">
            ✨ Nova Visualização
          </Button>
        </div>

        
        {imagens.length > 0 && (<div className="card-elegant p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              🎨 Filtros
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  💄 Filtrar por Estilo
                </label>
                <select value={filtroEstilo} onChange={(e) => setFiltroEstilo(e.target.value)} className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all">
                  <option value="">Todos os estilos</option>
                  {estilos.map((estilo) => (<option key={estilo} value={estilo}>
                      {estilo}
                    </option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  👤 Filtrar por Cliente
                </label>
                <input type="text" value={filtroCliente} onChange={(e) => setFiltroCliente(e.target.value)} placeholder="Nome da cliente..." className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"/>
              </div>
            </div>
            {(filtroEstilo || filtroCliente) && (<div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  💫 Mostrando {imagensFiltradas.length} de {imagens.length} imagens
                </p>
                <button onClick={() => {
                    setFiltroEstilo('');
                    setFiltroCliente('');
                }} className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                  Limpar filtros
                </button>
              </div>)}
          </div>)}

        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-primary-600 group-hover:scale-110 transition-transform">
              {imagens.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">📷 Total de Imagens</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-green-600 group-hover:scale-110 transition-transform">
              {imagens.filter(img => img.tipo === 'depois').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">✅ Processadas</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-secondary-600 group-hover:scale-110 transition-transform">
              {new Set(imagens.map(img => img.tipo)).size}
            </div>
            <div className="text-sm text-gray-600 mt-1">🎨 Estilos Únicos</div>
          </div>
          <div className="card-interactive text-center group">
            <div className="text-3xl font-bold text-purple-600 group-hover:scale-110 transition-transform">
              {clientes.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">👤 Clientes</div>
          </div>
        </div>

        
        {imagens.length === 0 ? (<div className="card-elegant p-12 text-center">
            <div className="text-6xl mb-6">🖼️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma imagem encontrada
            </h3>
            <p className="text-gray-600 mb-8">
              ✨ Comece criando sua primeira visualização de cílios
            </p>
            <Button onClick={() => navigate('/aplicar-cilios')} variant="primary" className="shadow-elegant hover:scale-105 transition-transform">
              ✨ Criar Nova Visualização
            </Button>
          </div>) : imagensFiltradas.length === 0 ? (<div className="card-elegant p-12 text-center">
            <div className="text-6xl mb-6">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Nenhuma imagem encontrada com os filtros aplicados
            </h3>
            <p className="text-gray-600 mb-8">
              Tente ajustar os filtros ou limpar para ver todas as imagens
            </p>
            <button onClick={() => {
                setFiltroEstilo('');
                setFiltroCliente('');
            }} className="text-primary-600 hover:text-primary-800 font-medium">
              Limpar Filtros
            </button>
          </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {imagensFiltradas.map((imagem) => (<div key={imagem.id} className="card-interactive group cursor-pointer" onClick={() => {
                    setImagemSelecionada(imagem);
                    setModalAberto(true);
                }}>
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl relative overflow-hidden mb-4">
                  <img src={imagem.url} alt={imagem.nome} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"/>
                  {imagem.tipo && (<div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-xl text-xs font-medium shadow-lg">
                      {imagem.tipo}
                    </div>)}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                    {imagem.nome}
                  </h3>
                  {imagem.descricao && (<p className="text-sm text-primary-600 flex items-center">
                      <span className="mr-1">💄</span>
                      {imagem.descricao}
                    </p>)}
                  {imagem.cliente_id && (<p className="text-sm text-gray-600 flex items-center">
                      <span className="text-secondary-500 mr-1">👤</span>
                      {imagem.cliente_id}
                    </p>)}
                  <p className="text-xs text-gray-500 flex items-center">
                    <span className="mr-1">📅</span>
                    {new Date(imagem.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>))}
          </div>)}

        
        {modalAberto && imagemSelecionada && (<div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-elegant max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                  🖼️ Detalhes da Imagem
                </h2>
                <button onClick={() => setModalAberto(false)} className="text-gray-400 hover:text-gray-600 text-2xl hover:scale-110 transition-all">
                  ×
                </button>
              </div>

              <div className="space-y-6">
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden">
                  <img src={imagemSelecionada.url} alt={imagemSelecionada.nome} className="w-full h-full object-contain"/>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">📁 Nome do Arquivo</label>
                      <p className="text-gray-900">{imagemSelecionada.nome}</p>
                    </div>
                    {imagemSelecionada.tipo && (<div>
                        <label className="text-sm font-medium text-gray-700">💄 Tipo</label>
                        <p className="text-primary-600 font-medium">{imagemSelecionada.tipo}</p>
                      </div>)}
                    {imagemSelecionada.cliente_id && (<div>
                        <label className="text-sm font-medium text-gray-700">👤 Cliente</label>
                        <p className="text-gray-900">{imagemSelecionada.cliente_id}</p>
                      </div>)}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-700">📅 Data de Criação</label>
                      <p className="text-gray-900">{formatarData(imagemSelecionada.created_at)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">🔄 Status</label>
                      <p className={`font-medium ${imagemSelecionada.tipo === 'depois' ? 'text-green-600' : 'text-orange-600'}`}>
                        {imagemSelecionada.tipo === 'depois' ? '✅ Processada' : '⏳ Original'}
                      </p>
                    </div>
                  </div>
                </div>

                {imagemSelecionada.descricao && (<div>
                    <label className="text-sm font-medium text-gray-700">📝 Descrição</label>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-xl mt-1">
                      {imagemSelecionada.descricao}
                    </p>
                  </div>)}

                <div className="flex gap-4 pt-4">
                  <Button onClick={() => setModalAberto(false)} variant="secondary" className="flex-1">
                    Fechar
                  </Button>
                  <Button onClick={() => excluirImagem(imagemSelecionada.id)} variant="secondary" className="text-red-600 hover:text-red-700">
                    🗑️ Excluir
                  </Button>
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>);
};
export default MinhasImagensPage;
