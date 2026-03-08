import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { Eye, CheckCircle2, XCircle, Clock, Image as ImageIcon } from 'lucide-react';

interface SitterEvaluation {
    id: string;
    user_id: string;
    status: string;
    experience_details: any;
    environment_photos: any;
    quiz_answers: any;
    feedback?: string;
    created_at: string;
    users?: {
        full_name: string;
        email: string;
    };
}

export const SitterEvaluations = () => {
    const [evaluations, setEvaluations] = useState<SitterEvaluation[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [selectedEval, setSelectedEval] = useState<SitterEvaluation | null>(null);
    const [isRejecting, setIsRejecting] = useState(false);
    const [rejectFeedback, setRejectFeedback] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        fetchPendingEvaluations();
    }, []);

    const fetchPendingEvaluations = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('sitter_evaluations')
                .select(`
                    id, 
                    user_id, 
                    status, 
                    experience_details,
                    environment_photos,
                    quiz_answers,
                    created_at,
                    users:user_id (full_name, email)
                `)
                .eq('status', 'PENDENTE')
                .order('created_at', { ascending: false });

            if (error) throw error;
            
            // Map correctly if users comes as an array or object
            const formattedData = data?.map(d => ({
                ...d,
                users: Array.isArray(d.users) ? d.users[0] : d.users 
            })) as SitterEvaluation[];

            setEvaluations(formattedData || []);
        } catch (error) {
            console.error('Error fetching evaluations:', error);
            toast.error('Erro ao buscar avaliações.');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async () => {
        if (!selectedEval) return;
        try {
            setIsProcessing(true);

            // Update evaluation status
            const { error: evalError } = await supabase
                .from('sitter_evaluations')
                .update({ status: 'APROVADO' })
                .eq('id', selectedEval.id);

            if (evalError) throw evalError;

            // Update user onboarding step
            const { error: userError } = await supabase
                .from('users')
                .update({ onboarding_step: 'COMPLETED' })
                .eq('id', selectedEval.user_id);

            if (userError) throw userError;

            toast.success('Pet Sitter aprovado com sucesso!');
            closeModal();
            fetchPendingEvaluations();
        } catch (error) {
            console.error('Error approving sitter:', error);
            toast.error('Ocorreu um erro ao aprovar.');
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

            // Update evaluation status
            const { error: evalError } = await supabase
                .from('sitter_evaluations')
                .update({ 
                    status: 'REJEITADO', 
                    experience_details: selectedEval.experience_details,
                    environment_photos: selectedEval.environment_photos,
                    quiz_answers: selectedEval.quiz_answers,
                    feedback: rejectFeedback 
                })
                .eq('id', selectedEval.id);

            if (evalError) throw evalError;

            // Update user onboarding step
            const { error: userError } = await supabase
                .from('users')
                .update({ onboarding_step: 'REJECTED' })
                .eq('id', selectedEval.user_id);

            if (userError) throw userError;

            toast.success('Pet Sitter rejeitado. Feedback salvo.');
            closeModal();
            fetchPendingEvaluations();
        } catch (error) {
            console.error('Error rejecting sitter:', error);
            toast.error('Ocorreu um erro ao rejeitar.');
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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Avaliações de Pet Sitters</h1>
                    <p className="text-gray-500">Analise os currículos e ambientes dos candidatos.</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="p-8 flex justify-center text-primary">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : evaluations.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                        <Clock className="h-12 w-12 text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">Nenhuma avaliação pendente</h3>
                        <p className="text-gray-500 mt-1">Todas as solicitações de Pet Sitters foram analisadas.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="bg-gray-50 text-xs text-gray-700 uppercase">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Candidato</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900">Data da Solicitação</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-center">Status</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 text-right">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {evaluations.map((evalItem) => (
                                    <tr key={evalItem.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{evalItem.users?.full_name || 'Usuário'}</div>
                                            <div className="text-xs text-gray-500">{evalItem.users?.email}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                            {formatDate(evalItem.created_at)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                Em Análise
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <button 
                                                onClick={() => setSelectedEval(evalItem)}
                                                className="inline-flex items-center justify-center p-2 rounded-lg text-primary hover:bg-blue-50 transition-colors"
                                                title="Analisar"
                                            >
                                                <Eye className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de Avaliação */}
            {selectedEval && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                        
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 font-cabinet">
                                    Avaliação: {selectedEval.users?.full_name}
                                </h3>
                                <p className="text-sm text-gray-500">{selectedEval.users?.email}</p>
                            </div>
                            <button 
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Body - Scrollable */}
                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                            <div className="space-y-8">
                                
                                {/* 1. Currículo Pet */}
                                <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
                                        Currículo Pet
                                    </h4>
                                    <div className="space-y-4 text-sm text-gray-700">
                                        {(() => {
                                            const resumeStr = typeof selectedEval.experience_details === 'string' 
                                                ? selectedEval.experience_details 
                                                : '{}';
                                            let resume: any = {};
                                            try { resume = JSON.parse(resumeStr); } catch (e) {}
                                            return (
                                                <>
                                                    <div>
                                                        <strong className="block text-gray-900 mb-1">Experiência geral com animais:</strong>
                                                        <p className="bg-gray-50 p-3 rounded-lg text-gray-600">
                                                            {resume.experience || 'Não informado'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <strong className="block text-gray-900 mb-1">Administração de Remédios:</strong>
                                                        <p className="bg-gray-50 p-3 rounded-lg text-gray-600">
                                                            {resume.medicines || 'Não informado'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <strong className="block text-gray-900 mb-1">Experiência com filhotes/idosos:</strong>
                                                        <p className="bg-gray-50 p-3 rounded-lg text-gray-600">
                                                            {resume.elderly || 'Não informado'}
                                                        </p>
                                                    </div>
                                                </>
                                            );
                                        })()}
                                    </div>
                                </section>

                                {/* 2. Fotos do Ambiente */}
                                <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
                                        Fotos do Ambiente
                                    </h4>
                                    <div className="flex gap-4 overflow-x-auto pb-4">
                                        {selectedEval.environment_photos?.length > 0 ? (
                                            selectedEval.environment_photos.map((photoUrl: string, idx: number) => (
                                                <div key={idx} className="flex-shrink-0 w-32 h-32 rounded-lg border border-gray-200 overflow-hidden bg-gray-50 flex items-center justify-center relative group">
                                                    {/* Usaremos um ícone como placeholder pois a URL é simulada e vai quebrar */}
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-400">
                                                        <ImageIcon size={32} />
                                                        <span className="block text-[10px] mt-1 text-center truncate px-2 absolute bottom-2 w-full">{photoUrl.split('/').pop()}</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-gray-500">Nenhuma foto enviada.</p>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">*Previews simulados (URLs placeholder utilizadas)</p>
                                </section>

                                {/* 3. Respostas do Quiz */}
                                <section className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
                                        <span className="bg-blue-100 text-blue-600 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">3</span>
                                        Escola de Heróis (Quiz)
                                    </h4>
                                    <div className="space-y-4">
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-800 mb-2">1. Cachorro engasgado</p>
                                            <div className={`text-sm py-1.5 px-3 rounded-md line-clamp-2 ${
                                                selectedEval.quiz_answers?.q1 === 'B' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                Resposta selecionada: <strong>Opção {selectedEval.quiz_answers?.q1}</strong> {selectedEval.quiz_answers?.q1 === 'B' && '(Correta)'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-800 mb-2">2. Ansiedade de Separação</p>
                                            <div className={`text-sm py-1.5 px-3 rounded-md line-clamp-2 ${
                                                selectedEval.quiz_answers?.q2 === 'C' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                Resposta selecionada: <strong>Opção {selectedEval.quiz_answers?.q2}</strong> {selectedEval.quiz_answers?.q2 === 'C' && '(Correta)'}
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 border border-gray-100 p-4 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-800 mb-2">3. Briga entre cães</p>
                                            <div className={`text-sm py-1.5 px-3 rounded-md line-clamp-2 ${
                                                selectedEval.quiz_answers?.q3 === 'B' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                            }`}>
                                                Resposta selecionada: <strong>Opção {selectedEval.quiz_answers?.q3}</strong> {selectedEval.quiz_answers?.q3 === 'B' && '(Correta)'}
                                            </div>
                                        </div>
                                    </div>
                                </section>

                                {/* Campo Motivo de Rejeição */}
                                {isRejecting && (
                                    <section className="bg-red-50 p-6 rounded-xl border border-red-100 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <h4 className="text-base font-bold text-red-800 mb-2">Motivo da Recusa (Obrigatório)</h4>
                                        <textarea
                                            className="w-full rounded-lg border-red-200 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 p-3 text-sm text-gray-700 shadow-sm"
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
                        <div className="px-6 py-4 bg-white border-t border-gray-100 flex justify-end gap-3 rounded-b-2xl">
                            {isProcessing ? (
                                <div className="flex items-center text-primary font-medium px-4">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent mr-2"></div>
                                    Processando...
                                </div>
                            ) : (
                                <>
                                    {!isRejecting ? (
                                        <>
                                            <button 
                                                onClick={() => setIsRejecting(true)}
                                                className="px-5 py-2.5 rounded-xl font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors shadow-sm"
                                            >
                                                Recusar
                                            </button>
                                            <button 
                                                onClick={handleApprove}
                                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
                                            >
                                                <CheckCircle2 className="w-4 h-4" />
                                                Aprovar Candidato
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button 
                                                onClick={() => { setIsRejecting(false); setRejectFeedback(''); }}
                                                className="px-5 py-2.5 rounded-xl font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                                            >
                                                Cancelar
                                            </button>
                                            <button 
                                                onClick={handleReject}
                                                disabled={!rejectFeedback.trim()}
                                                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-white shadow-sm transition-colors ${
                                                    rejectFeedback.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-300 cursor-not-allowed'
                                                }`}
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Confirmar Recusa
                                            </button>
                                        </>
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
