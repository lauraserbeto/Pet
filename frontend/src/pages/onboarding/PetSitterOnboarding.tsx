import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { authService } from "../../lib/services/authService";
import { userService } from "../../lib/services/userService";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../../components/ui/button";
import { EVALUATION_MAX_PHOTOS, acceptAttribute, validateImageFile } from "../../lib/utils/imageUpload";
import { toast } from 'sonner';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "../../components/ui/select";
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
    const { setUser } = useAuth();
    const [status, setStatus] = useState<'LOADING' | 'FORM' | 'IN_REVIEW' | 'COMPLETED' | 'REJECTED' | 'UNAVAILABLE' | 'ERROR'>('LOADING');
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
            authService.logout();
        } catch (error) {
            console.error('Logout error:', error);
            toast.error('Erro ao sair da conta.');
        }
    };

    useEffect(() => {
        checkUserStatus();
    }, []);

    const checkUserStatus = async () => {
        setStatus('LOADING');
        try {
            const userStr = localStorage.getItem('petplus_user');
            if (!userStr) {
                navigate('/login');
                return;
            }

            const data = await userService.getMe();
            setUser(data);

            if (data.onboarding_step === 'IN_REVIEW') {
                setStatus('IN_REVIEW');
            } else if (data.onboarding_step === 'COMPLETED') {
                if (data.provider_status === 'APROVADO') navigate('/dashboard', { replace: true });
                else setStatus('UNAVAILABLE');
            } else {
                setStatus('FORM');
            }
        } catch {
            toast.error('Erro ao verificar status.');
            setStatus('ERROR');
        }
    };

    // Tipo, tamanho e quantidade conferidos na escolha (E-03): a API aceita até
    // 6 fotos JPEG, PNG ou WebP de no máximo 2 MB cada.
    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        e.target.value = '';
        if (!selected.length) return;

        const freeSlots = EVALUATION_MAX_PHOTOS - photos.length;
        if (selected.length > freeSlots) {
            toast.error(`Envie no máximo ${EVALUATION_MAX_PHOTOS} fotos do ambiente.`);
        }

        const newFiles: File[] = [];
        for (const file of selected.slice(0, Math.max(freeSlots, 0))) {
            const error = validateImageFile(file);
            if (error) toast.error(error);
            else newFiles.push(file);
        }
        if (!newFiles.length) return;

        setPhotos(prev => [...prev, ...newFiles]);

        // Create previews
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    };

    const removePhoto = (index: number) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
        setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
    };

    const fileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            setSubmitText('Processando arquivos...');
            
            const userStr = localStorage.getItem('petplus_user');
            if (!userStr) throw new Error('Usuário não autenticado');

            const uploadedUrls: string[] = [];
            for (let i = 0; i < photos.length; i++) {
                const base64Str = await fileToBase64(photos[i]);
                uploadedUrls.push(base64Str);
            }

            setSubmitText('Salvando dados...');

            await userService.submitSitterEvaluation({
                experience_details: resumeData,
                environment_photos: uploadedUrls,
                quiz_answers: quizData
            });

            toast.success('Currículo enviado com sucesso! Estamos analisando.');
            setStatus('IN_REVIEW');

        } catch (error: any) {
            // Candidatura única (E-11 / DEC-D): reflete o estado real em vez de só avisar.
            if (error?.code === 'EVALUATION_ALREADY_PENDING') {
                toast.info(error.message);
                setStatus('IN_REVIEW');
            } else if (error?.code === 'EVALUATION_ALREADY_APPROVED') {
                toast.info(error.message);
                navigate('/dashboard');
            } else {
                toast.error(error?.message || 'Erro ao enviar avaliação. Tente novamente mais tarde.');
            }
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
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary-100)] border-t-[var(--color-primary-600)]"></div>
            </div>
        );
    }

    if (status === 'UNAVAILABLE' || status === 'ERROR') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div role="alert" className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center space-y-4">
                    <h1 className="text-2xl font-bold">{status === 'ERROR' ? 'Não foi possível consultar seu cadastro' : 'Painel ainda indisponível'}</h1>
                    <p>{status === 'ERROR' ? 'Tente consultar novamente antes de continuar.' : 'A situação do cadastro ainda não permite liberar o painel. Se o problema persistir, entre em contato com a equipe Pet+.'}</p>
                    <Button onClick={() => void checkUserStatus()}>Consultar novamente</Button>
                    <Button variant="outline" onClick={() => navigate('/')}>Voltar ao início</Button>
                </div>
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
                        Você poderá acompanhar o resultado pela plataforma.
                    </p>
                    <button 
                        onClick={() => navigate('/')}
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
                    className="flex items-center text-sm font-medium text-gray-600 hover:text-[var(--color-primary-700)] transition-colors"
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
                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200" role="progressbar" aria-label="Etapa da candidatura" aria-valuemin={1} aria-valuemax={3} aria-valuenow={currentStep}>
                            <div style={{ width: `${(currentStep / 3) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"></div>
                        </div>
                        <div className="flex justify-between text-xs font-medium text-gray-600 px-1">
                            <span className={currentStep >= 1 ? 'text-[var(--color-primary-700)]' : 'text-gray-600'}>Currículo</span>
                            <span className={currentStep >= 2 ? 'text-[var(--color-primary-700)]' : 'text-gray-600'}>Ambiente</span>
                            <span className={currentStep >= 3 ? 'text-[var(--color-primary-700)]' : 'text-gray-600'}>Escola</span>
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
                                <label htmlFor="resume-experience" className="block text-sm font-medium text-gray-700">1. Descreva sua experiência com animais (cães ou gatos)</label>
                                <textarea
                                    id="resume-experience"
                                    rows={4}
                                    value={resumeData.experience}
                                    onChange={e => setResumeData({...resumeData, experience: e.target.value})}
                                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                    placeholder="Já tive x cachorros, cuido de animais desde criança..."
                                />
                            </div>

                            <div>
                                <label htmlFor="resume-medicines" className="block text-sm font-medium text-gray-700">2. Você sabe administrar remédios via oral ou injetável?</label>
                                <textarea
                                    id="resume-medicines"
                                    rows={3}
                                    value={resumeData.medicines}
                                    onChange={e => setResumeData({...resumeData, medicines: e.target.value})}
                                    className="mt-1 block w-full rounded-xl border-gray-300 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-3 border"
                                    placeholder="Via oral sim. Injetável apenas com receita e orientação..."
                                />
                            </div>

                            <div>
                                <label htmlFor="resume-elderly" className="block text-sm font-medium text-gray-700">3. Tem experiência com cães idosos ou filhotes muito novos?</label>
                                <textarea
                                    id="resume-elderly"
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
                                        JPEG, PNG ou WebP, até 2 MB cada (máx. {EVALUATION_MAX_PHOTOS} fotos)
                                    </span>
                                    <input 
                                        type="file" 
                                        multiple 
                                        accept={acceptAttribute()} 
                                        aria-label="Adicionar fotos do ambiente"
                                        className="hidden" 
                                        onChange={handlePhotoUpload}
                                    />
                                </label>
                            </div>

                            {photoPreviews.length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                    {photoPreviews.map((src, index) => (
                                        <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-square">
                                            <img src={src} alt={`Foto ${index + 1} do ambiente`} className="object-cover w-full h-full" />
                                            <button 
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                aria-label={`Remover foto ${index + 1}`}
                                                // Visível também com foco do teclado, não só no hover (E-34).
                                                className="absolute top-2 right-2 p-1 bg-white/90 rounded-full text-red-700 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity hover:bg-red-50"
                                            >
                                                <X size={16} aria-hidden="true" />
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
                                    <label htmlFor="quiz-q1" className="block text-sm font-bold text-gray-800 mb-3">
                                        1. O que você faria se o cachorro hospede engasgasse com um osso de brinquedo?
                                    </label>
                                    <Select
                                        value={quizData.q1 || undefined}
                                        onValueChange={(value) => setQuizData({...quizData, q1: value})}
                                    >
                                        <SelectTrigger id="quiz-q1" className="w-full">
                                            <SelectValue placeholder="Selecione uma resposta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Daria tapas muito fortes nas costas e gritaria</SelectItem>
                                            <SelectItem value="B">Realizaria a Manobra de Heimlich canina imediatamente e buscaria um veterinário se não saísse</SelectItem>
                                            <SelectItem value="C">Ofereceria água em copo para ele beber</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <label htmlFor="quiz-q2" className="block text-sm font-bold text-gray-800 mb-3">
                                        2. Como lidar com um cão sofrendo forte Ansiedade de Separação?
                                    </label>
                                    <Select
                                        value={quizData.q2 || undefined}
                                        onValueChange={(value) => setQuizData({...quizData, q2: value})}
                                    >
                                        <SelectTrigger id="quiz-q2" className="w-full">
                                            <SelectValue placeholder="Selecione uma resposta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Abraçá-lo e chorar junto para ele sentir empatia</SelectItem>
                                            <SelectItem value="B">Prendê-lo em um quarto pequeno até ele cansar de latir</SelectItem>
                                            <SelectItem value="C">Ignorar excesso de choro, propor atividades mentais e criar uma rotina segura e calma</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50">
                                    <label htmlFor="quiz-q3" className="block text-sm font-bold text-gray-800 mb-3">
                                        3. Em caso de briga feia entre dois cães na sua casa, qual a ação correta?
                                    </label>
                                    <Select
                                        value={quizData.q3 || undefined}
                                        onValueChange={(value) => setQuizData({...quizData, q3: value})}
                                    >
                                        <SelectTrigger id="quiz-q3" className="w-full">
                                            <SelectValue placeholder="Selecione uma resposta" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="A">Entrar no meio e separá-los usando as mãos nuas pelo colarinho</SelectItem>
                                            <SelectItem value="B">Fazer um barulho muito alto, jogar água ou colocar uma barreira física entre eles</SelectItem>
                                            <SelectItem value="C">Deixar eles resolverem a hierarquia naturalmente</SelectItem>
                                        </SelectContent>
                                    </Select>
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
                                className="flex items-center px-6 py-2.5 bg-[var(--color-primary-700)] text-white text-sm font-semibold rounded-xl hover:bg-[var(--color-primary-800)] transition-all shadow-sm active:scale-95"
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
                                    : 'bg-[var(--color-primary-700)] hover:bg-[var(--color-primary-800)]'
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
