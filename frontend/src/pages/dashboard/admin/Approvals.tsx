import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { CheckCircle, XCircle, Store, Bed, MapPin, User, AlertTriangle, Search, Loader2, Ban, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../../../components/ui/card";

interface Partner {
  id: string; // provider id
  user_id: string;
  business_name: string;
  document: string;
  status: string;
  rejection_reason?: string;
  full_name?: string;
  email?: string;
  role_id?: number;
}

type TabType = 'PENDENTE' | 'APROVADO' | 'REJEITADO';

export function Approvals() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [activeTab, setActiveTab] = useState<TabType>('PENDENTE');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Verification step
  useEffect(() => {
    async function verifyAccess() {
      try {
        setLoadingContext(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setIsAdmin(false);
          return;
        }

        const { data: user } = await supabase
          .from('users')
          .select('role_id')
          .eq('id', session.user.id)
          .single();

        if (user && user.role_id === 1) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (err) {
        console.error("Error verifying access:", err);
        setIsAdmin(false);
      } finally {
        setLoadingContext(false);
      }
    }

    verifyAccess();
  }, []);

  // Fetch partners
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchPartners() {
      try {
        setLoadingData(true);
        const { data: providers, error: provError } = await supabase
          .from('providers')
          .select('*');

        if (provError) throw provError;
        if (!providers || providers.length === 0) {
          setPartners([]);
          return;
        }

        const userIds = providers.map(p => p.user_id);
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, full_name, email, role_id')
          .in('id', userIds);
          
        if (userError) throw userError;

        const merged: Partner[] = providers.map(p => {
          const userObj = users?.find(u => u.id === p.user_id);
          return {
            ...p,
            full_name: userObj?.full_name || 'Desconhecido',
            email: userObj?.email || 'Sem email',
            role_id: userObj?.role_id
          };
        });

        setPartners(merged);

      } catch (err) {
        console.error('Error fetching partners:', err);
        toast.error("Erro ao carregar parceiros.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchPartners();
  }, [isAdmin]);

  const handleApprove = async (providerId: string) => {
    try {
      setProcessingId(providerId);
      const { error } = await supabase
        .from('providers')
        .update({ status: 'APROVADO', rejection_reason: null })
        .eq('id', providerId);

      if (error) throw error;

      toast.success("Parceiro aprovado com sucesso!");
      setPartners(prev => prev.map(p => p.id === providerId ? { ...p, status: 'APROVADO', rejection_reason: undefined } : p));
    } catch (err) {
      console.error("Error approving:", err);
      toast.error("Ocorreu um erro ao aprovar o parceiro.");
    } finally {
      setProcessingId(null);
    }
  };

  const openRejectModal = (providerId: string) => {
    setRejectingId(providerId);
    setRejectionReason('');
    setIsModalOpen(true);
  };

  const closeRejectModal = () => {
    setIsModalOpen(false);
    setRejectingId(null);
    setRejectionReason('');
  };

  const confirmRejection = async () => {
    if (!rejectingId) return;
    try {
      setProcessingId(rejectingId);
      const { error } = await supabase
        .from('providers')
        .update({ status: 'REJEITADO', rejection_reason: rejectionReason || null })
        .eq('id', rejectingId);

      if (error) throw error;

      toast.success(activeTab === 'APROVADO' ? "Parceiro desativado com sucesso." : "Parceiro recusado com sucesso.");
      setPartners(prev => prev.map(p => p.id === rejectingId ? { ...p, status: 'REJEITADO', rejection_reason: rejectionReason } : p));
      closeRejectModal();
    } catch (err) {
      console.error("Error rejecting:", err);
      toast.error("Ocorreu um erro ao rejeitar o parceiro.");
    } finally {
      setProcessingId(null);
    }
  };

  const getRoleIcon = (roleId?: number) => {
    if (roleId === 2) return <Store className="h-4 w-4 mr-1 text-blue-500" />;
    if (roleId === 3) return <Bed className="h-4 w-4 mr-1 text-purple-500" />;
    if (roleId === 4) return <MapPin className="h-4 w-4 mr-1 text-[#F58B05]" />;
    return <User className="h-4 w-4 mr-1 text-slate-500" />;
  };

  const getRoleName = (roleId?: number) => {
    if (roleId === 2) return "Lojista";
    if (roleId === 3) return "Hotel";
    if (roleId === 4) return "Pet Sitter";
    return "Desconhecido";
  };

  const filteredPartners = partners.filter(p => {
    if (p.status !== activeTab) return false;
    
    // Role filter
    if (roleFilter !== 'all') {
      if (roleFilter === '2' && p.role_id !== 2) return false;
      if (roleFilter === '3' && p.role_id !== 3) return false;
      if (roleFilter === '4' && p.role_id !== 4) return false;
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const inName = p.full_name?.toLowerCase().includes(query) || p.business_name?.toLowerCase().includes(query);
      const inDoc = p.document?.toLowerCase().includes(query);
      if (!inName && !inDoc) return false;
    }

    return true;
  });

  if (loadingContext) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 mb-4">
          <AlertTriangle size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Acesso Negado</h2>
        <p className="text-slate-500 max-w-md">
          Você não tem permissão para acessar esta página. Apenas administradores do sistema podem visualizar a área de aprovações.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 relative">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Aprovação de Parceiros</h2>
        <p className="text-slate-500 mt-1">Gerencie os lojistas, hotéis e pet sitters em diferentes status na plataforma.</p>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('PENDENTE')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'PENDENTE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          Novos
        </button>
        <button
          onClick={() => setActiveTab('APROVADO')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'APROVADO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          Aprovados
        </button>
        <button
          onClick={() => setActiveTab('REJEITADO')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'REJEITADO' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'}`}
        >
          Recusados
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Buscar por Nome ou Documento..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          />
        </div>
        <div className="w-full sm:w-48">
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
          >
            <option value="all">Todos os tipos</option>
            <option value="2">Lojista</option>
            <option value="3">Hotel</option>
            <option value="4">Pet Sitter</option>
          </select>
        </div>
      </div>

      {loadingData ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin h-8 w-8 text-primary-500" />
        </div>
      ) : filteredPartners.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-12 w-12 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhum registro encontrado</h3>
            <p className="text-slate-500">Não há parceiros nesta listagem com os filtros atuais.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Contato</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Negócio</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Documento</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600">Tipo</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPartners.map((partner) => {
                  const isProcessing = processingId === partner.id;

                  return (
                    <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-900">{partner.full_name}</span>
                          <span className="text-sm text-slate-500">{partner.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-800">{partner.business_name}</span>
                        {partner.rejection_reason && activeTab === 'REJEITADO' && (
                          <p className="text-xs text-red-500 mt-1 line-clamp-1" title={partner.rejection_reason}>
                            Motivo: {partner.rejection_reason}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-600 font-mono text-sm">{partner.document}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-sm font-medium text-slate-700 bg-slate-100 w-fit px-2.5 py-1 rounded-full">
                          {getRoleIcon(partner.role_id)}
                          {getRoleName(partner.role_id)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col sm:flex-row items-center justify-end gap-2">
                          {activeTab === 'PENDENTE' && (
                            <>
                              <Button 
                                onClick={() => openRejectModal(partner.id)}
                                variant="ghost" 
                                size="sm"
                                disabled={isProcessing}
                                className={`text-red-600 hover:text-red-700 hover:bg-red-50 ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {isProcessing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                                Recusar
                              </Button>
                              <Button 
                                onClick={() => handleApprove(partner.id)}
                                size="sm"
                                disabled={isProcessing}
                                className={`bg-emerald-600 hover:bg-emerald-700 text-white ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                              >
                                {isProcessing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                                Aprovar
                              </Button>
                            </>
                          )}
                          {activeTab === 'APROVADO' && (
                            <Button 
                              onClick={() => openRejectModal(partner.id)}
                              variant="outline" 
                              size="sm"
                              disabled={isProcessing}
                              className={`text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Ban className="h-4 w-4 mr-1.5" />}
                              Desativar
                            </Button>
                          )}
                          {activeTab === 'REJEITADO' && (
                            <Button 
                              onClick={() => handleApprove(partner.id)}
                              variant="outline"
                              size="sm"
                              disabled={isProcessing}
                              className={`text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 ${isProcessing ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-1.5" />}
                              Aprovar Novamente
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {activeTab === 'APROVADO' ? 'Desativar Parceiro' : 'Recusar Parceiro'}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {activeTab === 'APROVADO' 
                  ? 'Tem certeza que deseja desativar este parceiro? Ele perderá o acesso ativo.' 
                  : 'Tem certeza que deseja recusar esta solicitação de cadastro?'}
              </p>
            </div>
            
            <div className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Motivo da recusa/desativação (Opcional)
              </label>
              <textarea 
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Descreva o motivo para manter no histórico..."
                className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors resize-none"
              ></textarea>
            </div>
            
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <Button 
                variant="ghost" 
                onClick={closeRejectModal}
                disabled={processingId === rejectingId}
                className="text-slate-600 hover:text-slate-900"
              >
                Cancelar
              </Button>
              <Button 
                onClick={confirmRejection}
                disabled={processingId === rejectingId}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {processingId === rejectingId ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                ) : (
                  'Confirmar Ação'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

