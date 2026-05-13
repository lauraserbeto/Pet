import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Eye, CheckCircle2, XCircle, Clock, Image as ImageIcon, Search, Loader2 } from 'lucide-react';
import { HamsterLoader } from '../../components/ui/HamsterLoader';
import { userService } from '../../lib/services/userService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";

interface SitterEvaluation {
    id: string;
    user_id: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    experience_details: any;
    environment_photos: any;
    quiz_answers: any;
    feedback?: string;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

type TabType = 'PENDING' | 'APPROVED' | 'REJECTED';

export const SitterEvaluations = () => {
    const [evaluations, setEvaluations] = useState<SitterEvaluation[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('PENDING');
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [selectedEval, setSelectedEval] = useState<SitterEvaluation | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchEvaluations();
    }, [activeTab]);

    const fetchEvaluations = async () => {
        try {
            setLoading(true);
            const data = await userService.getEvaluations(activeTab);
            setEvaluations(data || []);
        } catch (error: any) {
            console.error('Error fetching evaluations:', error);
            toast.error(error.message || 'Erro ao buscar avaliações.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedEval) return;
        try {
            setIsProcessing(true);

            // Otimismo na UI
            const originalEval = selectedEval;
            setEvaluations(prev => prev.filter(e => e.id !== originalEval.id));

            await userService.reviewEvaluation(originalEval.id, 'APPROVED');

            toast.success('Pet Sitter aprovado com sucesso!');
            closeModal();
            // Recarregar para garantir sincronia se necessário, mas o filtro acima já limpou a lista da aba atual
        } catch (error: any) {
            console.error('Error approving sitter:', error);
            toast.error(error.message || 'Ocorreu um erro ao aprovar.');
            // Reverter otimismo
            fetchEvaluations();
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        if (!selectedEval || !rejectFeedback.trim()) {
            toast.error('Por favor, forneça um motivo para a recusa.');
            return;
        }

        try {
            setIsProcessing(true);

            // Otimismo na UI
            const originalEval = selectedEval;
            setEvaluations(prev => prev.filter(e => e.id !== originalEval.id));

            await userService.reviewEvaluation(originalEval.id, 'REJECTED', rejectFeedback);

            toast.success('Pet Sitter rejeitado. Feedback salvo.');
            closeModal();
        } catch (error: any) {
            console.error('Error rejecting sitter:', error);
            toast.error(error.message || 'Ocorreu um erro ao rejeitar.');
            // Reverter otimismo
            fetchEvaluations();
        } finally {
            setIsProcessing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const closeModal = () => {
        setSelectedEval(null);
        setIsRejecting(false);
        setRejectFeedback('');
    };

    const filteredEvaluations = evaluations.filter(e => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            e.user?.full_name.toLowerCase().includes(query) ||
            e.user?.email.toLowerCase().includes(query)
        );
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">Pendente</span>;
            case 'APPROVED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-200">Aprovado</span>;
            case 'REJECTED':
                return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">Recusado</span>;
            default:
                return null;
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Avaliações de Pet Sitters</h1>
                    <p className="text-slate-500 mt-1">Gerencie os candidatos a Pet Sitter em diferentes status na plataforma.</p>
                </div>
            </div>

            {/* Tabs Navigation */}
            <Tabs defaultValue="PENDING" value={activeTab} onValueChange={(v) => setActiveTab(v as TabType)} className="w-full">
                <TabsList className="bg-slate-100 mb-6">
                    <TabsTrigger value="PENDING" className="data-[state=active]:bg-white">Pendentes</TabsTrigger>
                    <TabsTrigger value="APPROVED" className="data-[state=active]:bg-white">Aprovados</TabsTrigger>
                    <TabsTrigger value="REJECTED" className="data-[state=active]:bg-white">Recusados</TabsTrigger>
                </TabsList>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6">
                    <div className="relative flex-1 w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar por nome ou e-mail..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors"
                        />
                    </div>
                </div>

                {loading ? (
                    <HamsterLoader size="sm" message="Carregando avaliações..." />
                ) : filteredEvaluations.length === 0 ? (
                    <Card className="border-dashed shadow-sm">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Clock className="h-12 w-12 text-slate-300 mb-4" />
                            <h3 className="text-lg font-bold text-slate-900 mb-1">Nenhuma avaliação encontrada</h3>
                            <p className="text-slate-500">Não há registros para este status com os filtros atuais.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 font-semibold text-sm text-slate-600">Candidato</th>
                                        <th className="px-6 py-4 font-semibold text-sm text-slate-600">Data da Solicitação</th>
                                        <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-center">Status</th>
                                        <th className="px-6 py-4 font-semibold text-sm text-slate-600 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredEvaluations.map((evalItem) => (
                                        <tr key={evalItem.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-900">{evalItem.user?.full_name || 'Usuário'}</span>
                                                    <span className="text-sm text-slate-500">{evalItem.user?.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-sm">
                                                {formatDate(evalItem.created_at)}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {getStatusBadge(evalItem.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button 
                                                    onClick={() => setSelectedEval(evalItem)}
                                                    variant="ghost" 
                                                    size="sm"
                                                    className="text-primary hover:text-primary-600 hover:bg-primary-50"
                                                >
                                                    <Eye className="w-4 h-4 mr-2" />
                                                    Analisar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </Tabs>

            {/* Modal de Avaliação */}
            {selectedEval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 font-cabinet">
                                    Avaliação: {selectedEval.user?.full_name}
                                </h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-slate-500">{selectedEval.user?.email}</span>
                                    {getStatusBadge(selectedEval.status)}
                                </div>
                            </div>
                            <button 
                                onClick={closeModal}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/30">
                            <div className="space-y-8">
                                
                                {/* 1. Currículo Pet */}
                                <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                        <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 font-bold">1</span>
                                        Currículo Pet
                                    </h4>
                                    <div className="space-y-4 text-sm text-slate-700">
                                        {(() => {
                                            const resumeStr = typeof selectedEval.experience_details === 'string' 
                                                ? selectedEval.experience_details 
                                                : '{}';
                                            let resume: any = {};
                                            try { resume = JSON.parse(resumeStr); } catch (e) {}
                                            return (
                                                <>
                                                    <div>
                                                        <strong className="block text-slate-900 mb-1 uppercase text-xs tracking-wider">Experiência geral com animais:</strong>
                                                        <p className="bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100">
                                                            {resume.experience || 'Não informado'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <strong className="block text-slate-900 mb-1 uppercase text-xs tracking-wider">Administração de Remédios:</strong>
                                                        <p className="bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100">
                                                            {resume.medicines || 'Não informado'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <strong className="block text-slate-900 mb-1 uppercase text-xs tracking-wider">Experiência com filhotes/idosos:</strong>
                                                        <p className="bg-slate-50 p-3 rounded-lg text-slate-600 border border-slate-100">
                                                            {resume.elderly || 'Não informado'}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </section>

                                {/* 2. Fotos do Ambiente */}
                                <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                        <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 font-bold">2</span>
                                        Fotos do Ambiente
                                    </h4>
                                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                                        {selectedEval.environment_photos?.length > 0 ? (
                                            selectedEval.environment_photos.map((photoUrl: string, idx: number) => (
                                                <div key={idx} className="flex-shrink-0 w-40 h-40 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center relative group shadow-sm">
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400">
                                                        <ImageIcon size={40} />
                                                        <span className="block text-[10px] mt-1 text-center truncate px-2 absolute bottom-2 w-full">{photoUrl.split('/').pop()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-slate-500 italic">Nenhuma foto enviada.</p>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-2">* Previews simulados (URLs de ambiente restrito)</p>
                                </section>

                                {/* 3. Respostas do Quiz */}
                                <section className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
                                        <span className="bg-primary-100 text-primary-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2 font-bold">3</span>
                                        Escola de Heróis (Quiz)
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">1. Cachorro engasgado</p>
                                            <div className={`text-sm py-2 px-3 rounded-lg font-medium ${
                                                selectedEval.quiz_answers?.q1 === 'B' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                                Opção {selectedEval.quiz_answers?.q1} {selectedEval.quiz_answers?.q1 === 'B' ? '(Correta)' : '(Incorreta)'}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">2. Ansiedade de Separação</p>
                                            <div className={`text-sm py-2 px-3 rounded-lg font-medium ${
                                                selectedEval.quiz_answers?.q2 === 'C' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                                Opção {selectedEval.quiz_answers?.q2} {selectedEval.quiz_answers?.q2 === 'C' ? '(Correta)' : '(Incorreta)'}
                                            </div>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                                            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">3. Briga entre cães</p>
                                            <div className={`text-sm py-2 px-3 rounded-lg font-medium ${
                                                selectedEval.quiz_answers?.q3 === 'B' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                                            }`}>
                                                Opção {selectedEval.quiz_answers?.q3} {selectedEval.quiz_answers?.q3 === 'B' ? '(Correta)' : '(Incorreta)'}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Feedback Histórico */}
                                {selectedEval.feedback && (
                                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-sm">
                                        <h4 className="text-base font-bold text-slate-800 mb-2">Feedback do Administrador</h4>
                                        <div className="p-4 bg-white rounded-lg border border-slate-200 text-sm text-slate-600 italic">
                                            "{selectedEval.feedback}"
                                        </div>
                                    </section>
                                )}

                                {/* Campo Motivo de Rejeição (Ao agir) */}
                                {isRejecting && (
                                    <section className="bg-red-50 p-6 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <h4 className="text-base font-bold text-red-800 mb-2">Motivo da Recusa (Obrigatório)</h4>
                                        <textarea
                                            className="w-full rounded-lg border-red-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 p-3 text-sm text-slate-700 shadow-sm bg-white"
                                            rows={3}
                                            placeholder="Detalhe o motivo para o candidato poder melhorar ou entender a decisão..."
                                            value={rejectFeedback}
                                            onChange={(e) => setRejectFeedback(e.target.value)}
                                        />
                                    </section>
                                )}

                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
                            {isProcessing ? (
                                <div className="flex items-center text-primary font-medium px-4">
                                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                    Processando...
                                </div>
                            ) : (
                                <>
                                    {selectedEval.status === 'PENDING' ? (
                                        <>
                                            {!isRejecting ? (
                                                <>
                                                    <Button 
                                                        variant="ghost"
                                                        onClick={() => setIsRejecting(true)}
                                                        className="text-red-600 bg-red-50 hover:bg-red-100"
                                                    >
                                                        Recusar Candidato
                                                    </Button>
                                                    <Button 
                                                        onClick={handleApprove}
                                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                                        Aprovar Candidato
                                                    </Button>
                                                </>
                                            ) : (
                                                <>
                                                    <Button 
                                                        variant="ghost"
                                                        onClick={() => { setIsRejecting(false); setRejectFeedback(''); }}
                                                    >
                                                        Cancelar
                                                    </Button>
                                                    <Button 
                                                        onClick={handleReject}
                                                        disabled={!rejectFeedback.trim()}
                                                        className="bg-red-600 hover:bg-red-700 text-white"
                                                    >
                                                        <XCircle className="w-4 h-4 mr-2" />
                                                        Confirmar Recusa
                                                    </Button>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <Button variant="outline" onClick={closeModal} className="text-slate-600">
                                            Fechar Detalhes
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};
