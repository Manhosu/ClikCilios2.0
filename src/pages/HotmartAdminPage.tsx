import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import Button from '../components/Button';
import Input from '../components/Input';
import Badge from '../components/Badge';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Activity, 
  RefreshCw, 
  Plus, 
  CheckCircle,
  Clock,
  Ban,
  Play
} from 'lucide-react';
import { hotmartPreUsersService, type Estatisticas, type PreUser, type UserAssignment } from '../services/hotmartPreUsersService';
import { toast } from 'sonner';

const HotmartAdminPage: React.FC = () => {
  const [estatisticas, setEstatisticas] = useState<Estatisticas>({
    usuarios_disponiveis: 0,
    usuarios_ocupados: 0,
    usuarios_suspensos: 0,
    total_usuarios: 0,
    total_atribuicoes: 0,
    atribuicoes_ativas: 0,
    atribuicoes_canceladas: 0
  });
  
  const [preUsers, setPreUsers] = useState<PreUser[]>([]);
  const [userAssignments, setUserAssignments] = useState<UserAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantidadeUsuarios, setQuantidadeUsuarios] = useState(50);
  const [criandoUsuarios, setCriandoUsuarios] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'assignments'>('stats');

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [stats, users, assignments] = await Promise.all([
        hotmartPreUsersService.getEstatisticas(),
        hotmartPreUsersService.getPreUsers(100, 0),
        hotmartPreUsersService.getUserAssignments(50, 0)
      ]);
      
      setEstatisticas(stats);
      setPreUsers(users);
      setUserAssignments(assignments);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    } finally {
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
      const resultado = await hotmartPreUsersService.criarUsuariosPreCriados(quantidadeUsuarios);
      
      toast.success(`${resultado.sucesso} usuários criados com sucesso!`);
      if (resultado.erro > 0) {
        toast.warning(`${resultado.erro} usuários falharam na criação`);
      }
      
      await carregarDados();
    } catch (error) {
      console.error('Erro ao criar usuários:', error);
      toast.error('Erro ao criar usuários pré-criados');
    } finally {
      setCriandoUsuarios(false);
    }
  };

  const suspenderUsuario = async (userId: string) => {
    try {
      await hotmartPreUsersService.suspendPreUser(userId);
      toast.success('Usuário suspenso com sucesso');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao suspender usuário:', error);
      toast.error('Erro ao suspender usuário');
    }
  };

  const reativarUsuario = async (userId: string) => {
    try {
      await hotmartPreUsersService.reactivatePreUser(userId);
      toast.success('Usuário reativado com sucesso');
      await carregarDados();
    } catch (error) {
      console.error('Erro ao reativar usuário:', error);
      toast.error('Erro ao reativar usuário');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Disponível</Badge>;
      case 'occupied':
        return <Badge variant="info"><Clock className="w-3 h-3 mr-1" />Ocupado</Badge>;
      case 'suspended':
        return <Badge variant="danger"><Ban className="w-3 h-3 mr-1" />Suspenso</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAssignmentStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success"><Play className="w-3 h-3 mr-1" />Ativo</Badge>;
      case 'cancelled':
        return <Badge variant="danger"><Ban className="w-3 h-3 mr-1" />Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  useEffect(() => {
    carregarDados();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Administração Hotmart</h1>
          <Button onClick={carregarDados} disabled={loading} variant="secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
        
        {/* Navegação por abas */}
        <div className="flex space-x-1 mb-6">
          <Button 
            variant={activeTab === 'stats' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('stats')}
          >
            Estatísticas
          </Button>
          <Button 
            variant={activeTab === 'users' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('users')}
          >
            Usuários Pré-criados
          </Button>
          <Button 
            variant={activeTab === 'assignments' ? 'primary' : 'secondary'}
            onClick={() => setActiveTab('assignments')}
          >
            Atribuições
          </Button>
        </div>

        {/* Aba de Estatísticas */}
        {activeTab === 'stats' && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Disponíveis</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_disponiveis}</div>
                  <p className="text-xs text-muted-foreground">Prontos para alocação</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Ocupados</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_ocupados}</div>
                  <p className="text-xs text-muted-foreground">Atualmente em uso</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usuários Suspensos</CardTitle>
                  <UserX className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.usuarios_suspensos}</div>
                  <p className="text-xs text-muted-foreground">Temporariamente bloqueados</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Atribuições</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{estatisticas.total_atribuicoes}</div>
                  <p className="text-xs text-muted-foreground">Histórico completo</p>
                </CardContent>
              </Card>
            </div>

            {/* Seção de Criação de Usuários */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Criar Usuários Pré-criados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <label className="text-sm font-medium mb-2 block">Quantidade de usuários</label>
                    <Input
                      type="number"
                      value={quantidadeUsuarios}
                      onChange={(e) => setQuantidadeUsuarios(parseInt(e.target.value) || 0)}
                      min={1}
                      max={500}
                      placeholder="Ex: 50"
                    />
                  </div>
                  <Button 
                    onClick={criarUsuarios} 
                    disabled={criandoUsuarios || quantidadeUsuarios <= 0}
                    className="mt-6"
                  >
                    {criandoUsuarios ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Criar Usuários
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Os usuários serão criados com formato: user0001, user0002, etc.
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* Aba de Usuários Pré-criados */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>Usuários Pré-criados ({preUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Email</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Criado em</th>
                      <th className="text-left p-2">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">{user.username}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2">{getStatusBadge(user.status)}</td>
                        <td className="p-2">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                        <td className="p-2">
                          <div className="flex space-x-2">
                            {user.status === 'available' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => suspenderUsuario(user.id)}
                              >
                                <Ban className="h-3 w-3 mr-1" />
                                Suspender
                              </Button>
                            )}
                            {user.status === 'suspended' && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => reativarUsuario(user.id)}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Reativar
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Aba de Atribuições */}
        {activeTab === 'assignments' && (
          <Card>
            <CardHeader>
              <CardTitle>Atribuições de Usuários ({userAssignments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Username</th>
                      <th className="text-left p-2">Comprador</th>
                      <th className="text-left p-2">Email do Comprador</th>
                      <th className="text-left p-2">Evento</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Atribuído em</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userAssignments.map((assignment) => (
                      <tr key={assignment.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-mono">
                          {assignment.pre_user?.username || 'N/A'}
                        </td>
                        <td className="p-2">{assignment.buyer_name}</td>
                        <td className="p-2">{assignment.buyer_email}</td>
                        <td className="p-2">
                          <Badge variant="secondary">{assignment.event}</Badge>
                        </td>
                        <td className="p-2">{getAssignmentStatusBadge(assignment.status)}</td>
                        <td className="p-2">
                          {new Date(assignment.assigned_at).toLocaleDateString('pt-BR')} às{' '}
                          {new Date(assignment.assigned_at).toLocaleTimeString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HotmartAdminPage;