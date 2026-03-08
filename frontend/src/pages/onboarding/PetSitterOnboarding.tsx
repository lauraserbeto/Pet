import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { 
    CheckCircle2, 
    ChevronRight, 
    ChevronLeft, 
    Camera, 
    UploadCloud, 
    ShieldCheck, 
    HeartHandshake,
    AlertCircle,
    X,
    LogOut,
    ArrowLeft
} from 'lucide-react';

export const PetSitterOnboarding = () => {
    const navigate = useNavigate();
    const [status, setStatus] = useState<'LOADING' | 'FORM' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED'>('LOADING');
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitText, setSubmitText] = useState('Enviar para Análise');
    
    // Form States
    const [resumeData, setResumeData] = useState({
        experience: '',
        medicines: '',
        elderly: ''
    });
    
    const [photos, setPhotos] = useState<File[]>([]);
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    
    const [quizData, setQuizData] = useState({
        q1: '',
        q2: '',
        q3: ''
    });

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Erro ao sair da conta.');
        }
    };

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate('/login');
                return;
            }

            const { data, error } = await supabase
                .from('users')
                .select('onboarding_step')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (data.onboarding_step === 'IN_REVIEW') {
                setStatus('IN_REVIEW');
            } else if (data.onboarding_step === 'COMPLETED') {
                navigate('/dashboard');
            } else {
                setStatus('FORM');
            }
        } catch (error) {
            console.error('Error fetching user status:', error);
            toast.error('Erro ao verificar status.');
        }
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setPhotos(prev => [...prev, ...newFiles]);
            
            // Create previews
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setSubmitText('Enviando arquivos...');
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Usuário não autenticado');

            // Upload real photos to Supabase Storage
            const uploadedUrls: string[] = [];
            for (let i = 0; i < photos.length; i++) {
                const file = photos[i];
                const fileExt = file.name.split('.').pop() || 'jpg';
                const fileName = `${user.id}-${Date.now()}-${i}.${fileExt}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('sitter_photos')
                    .upload(fileName, file);

                if (uploadError) {
                    console.error('Error uploading photo:', uploadError);
                    throw new Error('Falha ao enviar fotos. Tente novamente.');
                }

                const { data } = supabase.storage
                    .from('sitter_photos')
                    .getPublicUrl(fileName);
                
                uploadedUrls.push(data.publicUrl);
            }

            setSubmitText('Salvando dados...');

            // 1. Insert into sitter_evaluations
            const { error: evalError } = await supabase
                .from('sitter_evaluations')
                .insert({
                    user_id: user.id,
                    experience_details: JSON.stringify(resumeData),
                    environment_photos: uploadedUrls,
                    quiz_answers: quizData,
                    status: 'PENDENTE'
                });

            if (evalError) throw evalError;

            // 2. Update users table `onboarding_step`
            const { error: userError } = await supabase
                .from('users')
                .update({ onboarding_step: 'IN_REVIEW' })
                .eq('id', user.id);

            if (userError) throw userError;

            toast.success('Currículo enviado com sucesso! Estamos analisando.');
            setStatus('IN_REVIEW');

        } catch (error: any) {
            console.error('Submission error:', error);
            toast.error(error.message || 'Erro ao enviar avaliação. Tente novamente mais tarde.');
        } finally {
            setIsSubmitting(false);
            setSubmitText('Enviar para Análise');
        }
    };

    const nextStep = () => {
        // Basic validation before jumping step
        if (currentStep === 1) {
            if (!resumeData.experience || !resumeData.medicines || !resumeData.elderly) {
                toast.error('Por favor, preencha todos os campos do currículo.');
                return;
            }
        }
        if (currentStep === 2) {
            if (photos.length === 0) {
                toast.error('Envie pelo menos uma foto do seu ambiente.');
                return;
            }
        }
        setCurrentStep(prev => Math.min(prev + 1, 3));
    };

    const prevStep = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1));
    };

    // --- Renders ---

    if (status === 'LOADING') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (status === 'IN_REVIEW') {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
                    <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldCheck size={40} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Avaliação em Análise</h2>
                    <p className="text-gray-600 mb-6">
                        Recebemos suas informações e nossa equipe de especialistas já está analisando seu perfil. 
                        Isso pode levar até 48 horas úteis.
                    </p>
                    <button 
                        onClick={() => navigate('/login')}
                        className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
                    >
                        Voltar para o Início
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen overflow-hidden bg-slate-50 flex flex-col">
            
            {/* Embedded Header */}
            <div className="w-full bg-white px-6 py-4 flex justify-between items-center shadow-sm z-10 shrink-0">
                <button 
                    onClick={() => navigate('/')}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-orange-500 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Voltar para a Página Inicial
                </button>
                <button 
                    onClick={handleLogout}
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-red-500 transition-colors"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                </button>
            </div>

            <div className="flex-1 w-full flex flex-col items-center py-6 px-4 sm:px-6 lg:px-8">
                <div className="w-full max-w-3xl flex flex-col h-full">
                    
                    {/* Header & Progress */}
                    <div className="mb-3 text-center shrink-0">
                        <HeartHandshake className="mx-auto h-12 w-12 text-orange-500" />
                        <h2 className=" text-3xl font-extrabold text-gray-900">
                            Torne-se um Herói
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Complete as etapas abaixo para fazer parte da nossa rede de anfitriões.
                        </p>
                    </div>

                    <div className="mb-6 relative shrink-0">
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                            <div style={{ width: `${(currentStep / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-400 px-1">
                            <span className={currentStep >= 1 ? 'text-orange-500' : ''}>Currículo</span>
                            <span className={currentStep >= 2 ? 'text-orange-500' : ''}>Ambiente</span>
                            <span className={currentStep >= 3 ? 'text-orange-500' : ''}>Escola</span>
                        </div>
                    </div>

                    {/* Form Wrapper */}
                    <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-gray-100 sm:px-10 max-h-[70vh] overflow-y-auto">
                        
                        {/* STEP 1 */}
                    {currentStep === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">O Currículo Pet</h3>
                                <p className="mt-1 text-sm text-gray-500">Conte um pouco sobre a sua experiência para garantirmos a melhor segurança aos pets.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">1. Descreva sua experiência com animais (cães ou gatos)</label>
                                <textarea
                                    rows={4}
                                    value={resumeData.experience}
                                    onChange={e => setResumeData({...resumeData, experience: e.target.value})}
                                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                    placeholder="Já tive x cachorros, cuido de animais desde criança..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">2. Você sabe administrar remédios via oral ou injetável?</label>
                                <textarea
                                    rows={3}
                                    value={resumeData.medicines}
                                    onChange={e => setResumeData({...resumeData, medicines: e.target.value})}
                                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                    placeholder="Via oral sim. Injetável apenas com receita e orientação..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">3. Tem experiência com cães idosos ou filhotes muito novos?</label>
                                <textarea
                                    rows={3}
                                    value={resumeData.elderly}
                                    onChange={e => setResumeData({...resumeData, elderly: e.target.value})}
                                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                    placeholder="Sim, já cuidei de um cão de 15 anos..."
                                />
                            </div>
                        </div>
                    )}

                    {/* STEP 2 */}
                    {currentStep === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Fotos do Ambiente</h3>
                                <p className="mt-1 text-sm text-gray-500">Precisamos avaliar onde o pet irá dormir e passar o dia. Foque em segurança (telas, portões).</p>
                            </div>

                            <div className="mt-4">
                                <label className="relative flex flex-col items-center p-6 border-2 border-dashed rounded-2xl border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <UploadCloud className="w-10 h-10 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                    <span className="mt-2 text-sm font-medium text-gray-900">
                                        Clique para adicionar fotos
                                    </span>
                                    <span className="mt-1 text-xs text-gray-500">
                                        JPG, PNG, GIF up to 10MB
                                    </span>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        className="hidden" 
                                        onChange={handlePhotoUpload}
                                    />
                                </label>
                            </div>

                            {photoPreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                    {photoPreviews.map((src, index) => (
                                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                                            <img src={src} alt="Preview" className="object-cover w-full h-full" />
                                            <button 
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3 */}
                    {currentStep === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div>
                                <h3 className="text-lg font-medium leading-6 text-gray-900">Escola de Heróis</h3>
                                <p className="mt-1 text-sm text-gray-500">Responda esse pequeno quiz para testar seu conhecimento em situações emergenciais.</p>
                            </div>

                            <div className="space-y-5">
                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-800 mb-3">
                                        1. O que você faria se o cachorro hospede engasgasse com um osso de brinquedo?
                                    </label>
                                    <select 
                                        value={quizData.q1}
                                        onChange={(e) => setQuizData({...quizData, q1: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 p-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Selecione uma resposta</option>
                                        <option value="A">Daria tapas muito fortes nas costas e gritaria</option>
                                        <option value="B">Realizaria a Manobra de Heimlich canina imediatamente e buscaria um veterinário se não saísse</option>
                                        <option value="C">Ofereceria água em copo para ele beber</option>
                                    </select>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-800 mb-3">
                                        2. Como lidar com um cão sofrendo forte Ansiedade de Separação?
                                    </label>
                                    <select 
                                        value={quizData.q2}
                                        onChange={(e) => setQuizData({...quizData, q2: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 p-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Selecione uma resposta</option>
                                        <option value="A">Abraçá-lo e chorar junto para ele sentir empatia</option>
                                        <option value="B">Prendê-lo em um quarto pequeno até ele cansar de latir</option>
                                        <option value="C">Ignorar excesso de choro, propor atividades mentais e criar uma rotina segura e calma</option>
                                    </select>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <label className="block text-sm font-bold text-gray-800 mb-3">
                                        3. Em caso de briga feia entre dois cães na sua casa, qual a ação correta?
                                    </label>
                                    <select 
                                        value={quizData.q3}
                                        onChange={(e) => setQuizData({...quizData, q3: e.target.value})}
                                        className="w-full rounded-lg border-gray-300 p-2.5 text-sm shadow-sm focus:border-orange-500 focus:ring-orange-500"
                                    >
                                        <option value="">Selecione uma resposta</option>
                                        <option value="A">Entrar no meio e separá-los usando as mãos nuas pelo colarinho</option>
                                        <option value="B">Fazer um barulho muito alto, jogar água ou colocar uma barreira física entre eles</option>
                                        <option value="C">Deixar eles resolverem a hierarquia naturalmente</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between pt-6 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={prevStep}
                            disabled={currentStep === 1 || isSubmitting}
                            className={`flex items-center px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                                currentStep === 1 
                                ? 'text-gray-300 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Voltar
                        </button>

                        {currentStep < 3 ? (
                            <button
                                type="button"
                                onClick={nextStep}
                                className="flex items-center px-6 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition-all shadow-sm active:scale-95"
                            >
                                Avançar
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isSubmitting || !quizData.q1 || !quizData.q2 || !quizData.q3}
                                className={`flex items-center px-6 py-2.5 text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95 text-white ${
                                    isSubmitting || !quizData.q1 || !quizData.q2 || !quizData.q3
                                    ? 'bg-orange-300 cursor-not-allowed'
                                    : 'bg-orange-500 hover:bg-orange-600'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                                        {submitText}
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4 mr-2" />
                                        {submitText}
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                </div>
                </div>
            </div>
        </div>
    );
};
