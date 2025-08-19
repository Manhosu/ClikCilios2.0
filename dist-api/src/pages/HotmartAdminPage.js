import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { Users, UserCheck, UserX, Activity, RefreshCw, Plus, CheckCircle, Clock, Ban, Play } from 'lucide-react';
import { hotmartUsersService } from '../services/hotmartUsersService';
import { toast } from 'sonner';
const HotmartAdminPage = () => {
    const [estatisticas, setEstatisticas] = useState({
        usuarios_disponiveis: 0,
        usuarios_ocupados: 0,
        usuarios_suspensos: 0,
        usuarios_admin: 0,
        total_usuarios: 0,
        total_geral: 0,
        usuarios_com_hotmart: 0
    });
    const [hotmartUsers, setHotmartUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quantidadeUsuarios, setQuantidadeUsuarios] = useState(50);
    const [criandoUsuarios, setCriandoUsuarios] = useState(false);
    const [activeTab, setActiveTab] = useState('stats');
    const carregarDados = async () => {
        try {
            setLoading(true);
            const [statsData, usersData] = await Promise.all([
                hotmartUsersService.getEstatisticas(),
                hotmartUsersService.getHotmartUsers()
            ]);
            setEstatisticas(statsData);
            setHotmartUsers(usersData);
        }
        catch (error) {
            console.error('Erro ao carregar dados:', error);
            toast.error('Erro ao carregar dados do painel');
        }
        finally {
            setLoading(false);
        }
    };
    const criarUsuarios = async () => {
        if (quantidadeUsuarios <= 0 || quantidadeUsuarios > 500) {
            toast.error('Quantidade deve ser entre 1 e 500 usuários');
            return;
        }
        try {
            setCriandoUsuarios(true);
            const resultado = await hotmartUsersService.criarUsuariosHotmart(quantidadeUsuarios);
            toast.success(`${resultado.sucesso} usuários criados com sucesso!`);
            if (resultado.erro > 0) {
                toast.warning(`${resultado.erro} usuários falharam na criação`);
            }
            await carregarDados();
        }
        catch (error) {
            console.error('Erro ao criar usuários:', error);
            toast.error('Erro ao criar usuários pré-criados');
        }
        finally {
            setCriandoUsuarios(false);
        }
    };
    const suspenderUsuario = async (userId) => {
        try {
            await hotmartUsersService.suspendUser(userId);
            toast.success('Usuário suspenso com sucesso');
            await carregarDados();
        }
        catch (error) {
            console.error('Erro ao suspender usuário:', error);
            toast.error('Erro ao suspender usuário');
        }
    };
    const reativarUsuario = async (userId) => {
        try {
            await hotmartUsersService.reactivateUser(userId);
            toast.success('Usuário reativado com sucesso');
            await carregarDados();
        }
        catch (error) {
            console.error('Erro ao reativar usuário:', error);
            toast.error('Erro ao reativar usuário');
        }
    };
    const getStatusBadge = (status) => {
        switch (status) {
            case 'available':
                return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1"/>Disponível</Badge>;
            case 'occupied':
                return <Badge variant="info"><Clock className="w-3 h-3 mr-1"/>Ocupado</Badge>;
            case 'suspended':
                return <Badge variant="danger"><Ban className="w-3 h-3 mr-1"/>Suspenso</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };
    useEffect(() => {
        carregarDados();
    }, []);
    return (<div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administração Hotmart</h1>
          <Button onClick={carregarDados} disabled={loading} variant="secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`}/>
            Atualizar
          </Button>
        </div>
        
        
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
          <button onClick={() => setActiveTab('stats')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'stats'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
            📊 Estatísticas
          </button>
          <button onClick={() => setActiveTab('users')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'users'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
            👥 Usuários
          </button>
          <button onClick={() => setActiveTab('create')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === 'create'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'}`}>
            ➕ Criar Usuários
          </button>
        </div>

        
        {activeTab === 'stats' && (<>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Disponíveis</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_disponiveis}</div>
                  <p className="text-xs text-muted-foreground">Prontos para alocação</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ocupados</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_ocupados}</div>
                  <p className="text-xs text-muted-foreground">Atualmente em uso</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Suspensos</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_suspensos}</div>
                  <p className="text-xs text-muted-foreground">Temporariamente bloqueados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground"/>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.total_usuarios}</div>
                  <p className="text-xs text-muted-foreground">Sistema completo</p>
                </CardContent>
              </Card>
            </div>

            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2"/>
                  Criar Usuários Pré-criados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Quantidade de usuários</label>
                    <Input type="number" value={quantidadeUsuarios} onChange={(e) => setQuantidadeUsuarios(parseInt(e.target.value) || 0)} min={1} max={500} placeholder="Ex: 50"/>
                  </div>
                  <Button onClick={criarUsuarios} disabled={criandoUsuarios || quantidadeUsuarios <= 0} className="mt-6">
                    {criandoUsuarios ? (<RefreshCw className="h-4 w-4 mr-2 animate-spin"/>) : (<Plus className="h-4 w-4 mr-2"/>)}
                    Criar Usuários
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Os usuários serão criados com formato: user0001, user0002, etc.
                </p>
              </CardContent>
            </Card>
          </>)}

        
        {activeTab === 'users' && (<Card>
            <CardHeader>
              <CardTitle>Usuários Hotmart ({hotmartUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Comprador</th>
                      <th className="text-left p-2">Criado em</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotmartUsers.map((user) => (<tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{getStatusBadge(user.status)}</td>
                        <td className="p-2">
                          {user.hotmart_buyer_email ? (<div>
                              <div className="font-medium">{user.hotmart_buyer_name}</div>
                              <div className="text-sm text-gray-500">{user.hotmart_buyer_email}</div>
                            </div>) : (<span className="text-gray-400">-</span>)}
                        </td>
                        <td className="p-2">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            {user.status === 'available' && (<Button size="sm" variant="secondary" onClick={() => suspenderUsuario(user.id)}>
                                <Ban className="h-3 w-3 mr-1"/>
                                Suspender
                              </Button>)}
                            {user.status === 'suspended' && (<Button size="sm" variant="secondary" onClick={() => reativarUsuario(user.id)}>
                                <Play className="h-3 w-3 mr-1"/>
                                Reativar
                              </Button>)}
                          </div>
                        </td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>)}

        
        {activeTab === 'create' && (<Card>
            <CardHeader>
              <CardTitle>Criar Usuários em Lote</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Quantidade de usuários a criar:
                  </label>
                  <Input type="number" min="1" max="500" value={quantidadeUsuarios} onChange={(e) => setQuantidadeUsuarios(Number(e.target.value))} className="w-32"/>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Preview dos usuários:</h4>
                  <div className="text-sm text-blue-700">
                    <p>• Usernames: user0001, user0002, ..., user{String(quantidadeUsuarios).padStart(4, '0')}</p>
                    <p>• Emails: user0001@ciliosclick.com, user0002@ciliosclick.com, ...</p>
                    <p>• Senhas: Geradas automaticamente (letras + números)</p>
                    <p>• Status: Todos criados como 'available'</p>
                  </div>
                </div>
                
                <Button onClick={criarUsuarios} disabled={criandoUsuarios || quantidadeUsuarios < 1} className="w-full">
                  {criandoUsuarios ? (<>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin"/>
                      Criando usuários...
                    </>) : (<>
                      <Plus className="h-4 w-4 mr-2"/>
                      Criar {quantidadeUsuarios} usuários
                    </>)}
                </Button>
              </div>
            </CardContent>
          </Card>)}
      </div>
    </div>);
};
export default HotmartAdminPage;
