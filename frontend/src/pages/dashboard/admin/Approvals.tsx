import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import { Button } from "../../../components/ui/button";
import { CheckCircle, XCircle, Store, Bed, MapPin, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "../../../components/ui/card";

interface PendingPartner {
  id: string; // provider id
  user_id: string;
  business_name: string;
  document: string;
  status: string;
  full_name?: string;
  email?: string;
  role_id?: number;
}

export function Approvals() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  
  const [partners, setPartners] = useState<PendingPartner[]>([]);
  const [loadingData, setLoadingData] = useState(true);

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

  // Fetch pending partners
  useEffect(() => {
    if (!isAdmin) return;

    async function fetchPending() {
      try {
        setLoadingData(true);
        // Step 1: fetch pending providers
        const { data: providers, error: provError } = await supabase
          .from('providers')
          .select('*')
          .eq('status', 'PENDENTE');

        if (provError) throw provError;
        if (!providers || providers.length === 0) {
          setPartners([]);
          return;
        }

        // Step 2: fetch user data manually to avoid fk join issues
        const userIds = providers.map(p => p.user_id);
        const { data: users, error: userError } = await supabase
          .from('users')
          .select('id, full_name, email, role_id')
          .in('id', userIds);
          
        if (userError) throw userError;

        const merged: PendingPartner[] = providers.map(p => {
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
        toast.error("Erro ao carregar parceiros pendentes.");
      } finally {
        setLoadingData(false);
      }
    }

    fetchPending();
  }, [isAdmin]);

  const handleApprove = async (providerId: string) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ status: 'APROVADO' })
        .eq('id', providerId);

      if (error) throw error;

      toast.success("Parceiro aprovado com sucesso!");
      setPartners(prev => prev.filter(p => p.id !== providerId));
    } catch (err) {
      console.error("Error approving:", err);
      toast.error("Ocorreu um erro ao aprovar o parceiro.");
    }
  };

  const handleReject = async (providerId: string) => {
    try {
      // Assuming REJEITADO is the rejected status
      const { error } = await supabase
        .from('providers')
        .update({ status: 'REJEITADO' })
        .eq('id', providerId);

      if (error) throw error;

      toast.success("Parceiro rejeitado.");
      setPartners(prev => prev.filter(p => p.id !== providerId));
    } catch (err) {
      console.error("Error rejecting:", err);
      toast.error("Ocorreu um erro ao rejeitar o parceiro.");
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

  if (loadingContext) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
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
    <div className="space-y-6 pb-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Aprovação de Parceiros</h2>
        <p className="text-slate-500 mt-1">Gerencie os lojistas, hotéis e pet sitters que estão aguardando aprovação para entrar na plataforma.</p>
      </div>

      {loadingData ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : partners.length === 0 ? (
        <Card className="border-dashed shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500 mb-4" opacity={0.5} />
            <h3 className="text-lg font-bold text-slate-900 mb-1">Tudo em dia!</h3>
            <p className="text-slate-500">Não há nenhum parceiro aguardando aprovação no momento.</p>
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
                {partners.map((partner) => (
                  <tr key={partner.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{partner.full_name}</span>
                        <span className="text-sm text-slate-500">{partner.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800">{partner.business_name}</span>
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
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          onClick={() => handleReject(partner.id)}
                          variant="outline" 
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-200"
                        >
                          <XCircle className="h-4 w-4 mr-1.5" />
                          Rejeitar
                        </Button>
                        <Button 
                          onClick={() => handleApprove(partner.id)}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1.5" />
                          Aprovar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
