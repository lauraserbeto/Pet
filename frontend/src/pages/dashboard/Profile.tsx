import React, { useEffect, useState, useRef } from "react";
import { providerService } from "../../lib/services/providerService";
import { useCepLookup } from "../../lib/hooks/useCepLookup";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { toast } from "sonner";
import { 
  Loader2, 
  UploadCloud, 
  Image as ImageIcon, 
  Search, 
  Plus, 
  Trash2, 
  User, 
  MapPin, 
  Settings2, 
  Images,
  Phone,
  FileText,
  Clock,
  CircleDollarSign,
  ShieldCheck,
  Save,
  X
} from "lucide-react";

interface ProfileFormState {
  full_name: string;
  email: string;
  role_id?: number;
  business_name: string;
  document: string;
  phone: string;
  description: string;
  zip_code: string;
  address_line: string;
  city: string;
  state: string;
  avatar_url?: string;
  operating_hours?: string;
  allowed_animals: string[];
  amenities: string[];
  gallery_images: string[];
  daily_rate?: string | number;
  rules_policies?: string;
  highlights: string[];
  hourly_rate?: string | number;
  sitter_roles: string[];
}

const HOTEL_AMENITIES = ['Wi fi', 'Área Verde', 'Supervisão 24h', 'Piscina', 'Webcam', 'DayCare'];
const HOTEL_ANIMALS = ['Sem restrição', 'Cachorro', 'Gato'];
const SITTER_HIGHLIGHTS = ['Certificado profissional', 'Envia fotos e vídeos', 'Aceita todos os portes', 'Disponível finais de semana'];
const SITTER_ROLES = ['Pet Sitter', 'Dog Walker', 'Médico Veterinário'];

export function Profile() {
  const [formData, setFormData] = useState<ProfileFormState>({
    full_name: "",
    email: "",
    business_name: "",
    document: "",
    phone: "",
    description: "",
    zip_code: "",
    address_line: "",
    city: "",
    state: "",
    avatar_url: "",
    operating_hours: "",
    allowed_animals: [],
    amenities: [],
    gallery_images: [],
    daily_rate: "",
    rules_policies: "",
    highlights: [],
    hourly_rate: "",
    sitter_roles: [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { isFetchingCep, lookupCep } = useCepLookup();

  // Role IDs
  const isLoja = formData.role_id === 2;
  const isHotel = formData.role_id === 3;
  const isSitter = formData.role_id === 4;

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const providerData = await providerService.fetchMe();
        if (providerData) {
           setFormData({
             full_name: providerData.user?.full_name || "",
             email: providerData.user?.email || "",
             role_id: providerData.user?.role_id,
             business_name: providerData.business_name || "",
             document: providerData.document || "",
             phone: providerData.phone || "",
             description: providerData.description || "",
             zip_code: providerData.zip_code || "",
             address_line: providerData.address_line || "",
             city: providerData.city || "",
             state: providerData.state || "",
             avatar_url: providerData.user?.avatar_url || "",
             operating_hours: providerData.operating_hours || "",
             allowed_animals: providerData.allowed_animals || [],
             amenities: providerData.amenities || [],
             gallery_images: providerData.gallery_images || [],
             daily_rate: providerData.daily_rate || "",
             rules_policies: providerData.rules_policies || "",
             highlights: providerData.highlights || [],
             hourly_rate: providerData.hourly_rate || "",
             sitter_roles: providerData.sitter_roles || [],
           });
        }
      } catch (error) {
        toast.error("Erro ao carregar os dados do perfil.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d)/, '$1.$2');
      value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      value = value.replace(/^(\d{2})(\d)/, '$1.$2');
      value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
      value = value.replace(/\.(\d{3})(\d)/, '.$1/$2');
      value = value.replace(/(\d{4})(\d)/, '$1-$2');
    }
    setFormData(prev => ({ ...prev, document: value.slice(0, 18) }));
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const masked = raw.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
    setFormData(prev => ({ ...prev, zip_code: masked }));

    const cleanDigits = masked.replace(/\D/g, "");
    if (cleanDigits.length === 8) {
      const cepData = await lookupCep(cleanDigits);
      if (cepData) {
        setFormData(prev => ({
          ...prev,
          address_line: cepData.address_line,
          city: cepData.city,
          state: cepData.state,
        }));
        toast.success("Endereço preenchido!");
      }
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, avatar_url: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ 
          ...prev, 
          gallery_images: [...prev.gallery_images, reader.result as string] 
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const toggleArrayCheckbox = (field: 'allowed_animals' | 'amenities' | 'highlights' | 'sitter_roles', item: string) => {
    setFormData(prev => {
      const current = prev[field] as string[];
      if (current.includes(item)) {
        return { ...prev, [field]: current.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...current, item] };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await providerService.updateMe(formData);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-zinc-500 font-[family-name:var(--font-sans)]">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          <p>Carregando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 relative font-[family-name:var(--font-sans)]">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] tracking-tight">
          Configurações de Perfil
        </h2>
        <p className="text-slate-500 mt-2 text-lg">
          Gerencie como sua marca e serviços são exibidos para os clientes.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="geral" className="space-y-8">
          <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12 w-full flex justify-start gap-2 overflow-x-auto no-scrollbar">
            <TabsTrigger value="geral" className="rounded-lg px-6 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <User size={16} /> Geral
            </TabsTrigger>
            <TabsTrigger value="localizacao" className="rounded-lg px-6 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <MapPin size={16} /> Localização
            </TabsTrigger>
            <TabsTrigger value="operacao" className="rounded-lg px-6 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Settings2 size={16} /> Operação
            </TabsTrigger>
            {isHotel && (
              <TabsTrigger value="galeria" className="rounded-lg px-6 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm">
                <Images size={16} /> Galeria
              </TabsTrigger>
            )}
          </TabsList>

          {/* ABA 1: GERAL */}
          <TabsContent value="geral" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden overflow-visible">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2"><User className="text-sky-500" size={20} /> Identidade do Parceiro</CardTitle>
                <CardDescription>Gerencie suas informações básicas de identificação e logo.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                {/* Logo Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-8 pb-4">
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    className="relative group cursor-pointer"
                  >
                    <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center transition-all group-hover:border-sky-200 group-hover:scale-[1.02]">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      )}
                      <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <UploadCloud className="text-white mb-1" size={24} />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Alterar</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-slate-800 mb-1">Logotipo Público</h4>
                    <p className="text-sm text-slate-500 mb-4 max-w-sm">
                      Recomendamos uma imagem quadrada de pelo menos 400x400px. Formatos suportados: JPG, PNG, WEBP.
                    </p>
                    <Button type="button" variant="outline" size="sm" onClick={() => avatarInputRef.current?.click()} className="rounded-full border-slate-200 hover:bg-slate-50 font-semibold px-6">
                      Escolher Imagem
                    </Button>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-semibold text-slate-700 ml-1">Nome do Responsável</Label>
                    <Input id="full_name" name="full_name" value={formData.full_name} onChange={handleChange} required className="h-12 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-semibold text-slate-400 ml-1">E-mail (Login)</Label>
                    <Input id="email" name="email" value={formData.email} disabled readOnly className="h-12 rounded-xl bg-slate-100/50 text-slate-400 cursor-not-allowed border-slate-200 select-none" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="business_name" className="text-sm font-semibold text-slate-700 ml-1">Nome do Negócio / Vitrine</Label>
                    <Input id="business_name" name="business_name" value={formData.business_name} onChange={handleChange} required className="h-12 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="document" className="text-sm font-semibold text-slate-700 ml-1">Documento de Identidade (CPF/CNPJ)</Label>
                    <Input id="document" name="document" value={formData.document} onChange={handleDocumentChange} placeholder="000.000.000-00" className="h-12 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="phone" className="text-sm font-semibold text-slate-700 ml-1">Telefone Principal</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} required className="h-12 rounded-xl pl-11 bg-slate-50/30 focus-visible:bg-white transition-colors" placeholder="(00) 00000-0000" />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2 pt-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5"><FileText size={14} /> Descrição da Bio / Sobre</Label>
                    <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={5} placeholder="Fale um pouco sobre você ou seu negócio para atrair mais clientes..." className="resize-none rounded-2xl bg-slate-50/30 focus-visible:bg-white transition-colors min-h-[140px] p-4 text-slate-700 leading-relaxed" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 2: LOCALIZAÇÃO */}
          <TabsContent value="localizacao" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2"><MapPin className="text-red-500" size={20} /> Endereço & Abrangência</CardTitle>
                <CardDescription>Onde os clientes podem encontrar seu serviço ou onde você atua.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="zip_code" className="text-sm font-semibold text-slate-700 ml-1">CEP</Label>
                    <div className="relative">
                      <Input
                        id="zip_code" name="zip_code" value={formData.zip_code} onChange={handleCepChange}
                        required maxLength={9} className="h-12 rounded-xl bg-slate-50/30 pr-10" placeholder="00000-000"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isFetchingCep ? <Loader2 className="h-4 w-4 animate-spin text-sky-500" /> : <Search className="h-4 w-4 text-slate-300" />}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <Label htmlFor="address_line" className="text-sm font-semibold text-slate-700 ml-1">Logradouro / Endereço Completo</Label>
                    <Input id="address_line" name="address_line" value={formData.address_line} onChange={handleChange} required className="h-12 rounded-xl bg-slate-50/30" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="city" className="text-sm font-semibold text-slate-700 ml-1">Cidade</Label>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} required className="h-12 rounded-xl bg-slate-50/30" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="state" className="text-sm font-semibold text-slate-700 ml-1">Estado (UF)</Label>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} required className="h-12 rounded-xl bg-slate-50/30 uppercase" />
                  </div>
                </div>
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-3 mt-4">
                  <div className="p-2 bg-sky-500 text-white rounded-lg"><MapPin size={18} /></div>
                  <div>
                    <h5 className="text-sm font-bold text-sky-900">Visibilidade Local</h5>
                    <p className="text-xs text-sky-700 mt-0.5 leading-relaxed">
                      Seu endereço é utilizado para calcular a distância dos clientes e exibir seu perfil no mapa de buscas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 3: OPERAÇÃO & SERVIÇOS */}
          <TabsContent value="operacao" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2"><Settings2 className="text-indigo-500" size={20} /> Detalhes de Atendimento</CardTitle>
                <CardDescription>Configure como e quando você atende, além das suas políticas.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-10">
                {/* Horários / Preços */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(isHotel || isLoja) && (
                    <div className="space-y-2">
                      <Label htmlFor="operating_hours" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5"><Clock size={14} /> Horário de Funcionamento</Label>
                      <Input id="operating_hours" name="operating_hours" value={formData.operating_hours} onChange={handleChange} placeholder="Seg-Sex: 08:00 às 18:00" className="h-12 rounded-xl bg-slate-50/30" />
                    </div>
                  )}
                  {isHotel && (
                    <div className="space-y-2">
                      <Label htmlFor="daily_rate" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5"><CircleDollarSign size={14} /> Valor da Diária (R$)</Label>
                      <Input id="daily_rate" name="daily_rate" value={formData.daily_rate} onChange={handleChange} type="number" step="0.01" className="h-12 rounded-xl bg-slate-50/30" placeholder="0,00" />
                    </div>
                  )}
                  {isSitter && (
                    <div className="space-y-2">
                      <Label htmlFor="hourly_rate" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5"><CircleDollarSign size={14} /> Valor por Hora (R$)</Label>
                      <Input id="hourly_rate" name="hourly_rate" value={formData.hourly_rate} onChange={handleChange} type="number" step="0.01" className="h-12 rounded-xl bg-slate-50/30" placeholder="0,00" />
                    </div>
                  )}
                </div>

                {/* Categorias / Roles */}
                {isSitter && (
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px]">Serviços Oferecidos</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SITTER_ROLES.map(role => (
                        <div key={role} className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${formData.sitter_roles.includes(role) ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                          <Checkbox id={`role-${role}`} checked={formData.sitter_roles.includes(role)} onCheckedChange={() => toggleArrayCheckbox('sitter_roles', role)} className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                          <label htmlFor={`role-${role}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">{role}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Animals */}
                {isHotel && (
                  <div className="space-y-4">
                    <Label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px]">Animais que aceitamos</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {HOTEL_ANIMALS.map(anim => (
                        <div key={anim} className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${formData.allowed_animals.includes(anim) ? 'bg-indigo-50/50 border-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                          <Checkbox id={`anim-${anim}`} checked={formData.allowed_animals.includes(anim)} onCheckedChange={() => toggleArrayCheckbox('allowed_animals', anim)} className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" />
                          <label htmlFor={`anim-${anim}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">{anim}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities / Highlights */}
                <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-800 uppercase tracking-widest text-[10px]">{isHotel ? "Diferenciais e Comodidades" : "Meus Destaques Profissionais"}</Label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {(isHotel ? HOTEL_AMENITIES : SITTER_HIGHLIGHTS).map(item => (
                      <div key={item} className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all ${ (isHotel ? formData.amenities.includes(item) : formData.highlights.includes(item)) ? 'bg-sky-50/50 border-sky-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}>
                        <Checkbox 
                          id={`item-${item}`} 
                          checked={isHotel ? formData.amenities.includes(item) : formData.highlights.includes(item)} 
                          onCheckedChange={() => toggleArrayCheckbox(isHotel ? 'amenities' : 'highlights', item)} 
                          className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                        />
                        <label htmlFor={`item-${item}`} className="text-sm font-semibold text-slate-700 cursor-pointer select-none">{item}</label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Policies */}
                {isHotel && (
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="rules_policies" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5"><ShieldCheck size={14} /> Regras e Políticas (Opcional)</Label>
                    <Textarea 
                      id="rules_policies" name="rules_policies" value={formData.rules_policies} onChange={handleChange}
                      rows={4} className="resize-none rounded-2xl bg-slate-50/30 focus-visible:bg-white transition-colors min-h-[120px] p-4 text-slate-700" 
                      placeholder="Ex: É necessário carteira de vacinação em dia, check-in até as 18h..." 
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA 4: GALERIA (HOTEL) */}
          {isHotel && (
            <TabsContent value="galeria" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
              <Card className="border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="border-b border-slate-100 pb-6">
                  <CardTitle className="text-xl flex items-center gap-2"><Images className="text-pink-500" size={20} /> Galeria de Fotos</CardTitle>
                  <CardDescription>Mostre o seu espaço e encante os clientes visualmente.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.gallery_images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-slate-100">
                        <img src={img} alt={`Gallery ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button 
                          type="button" 
                          onClick={(e) => removeGalleryImage(i, e)} 
                          className="absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm scale-90 group-hover:scale-100 shadow-red-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    <div 
                      onClick={() => galleryInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 transition-all aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-sky-600 group"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-sky-100 transition-colors">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Adicionar</span>
                      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                    </div>
                  </div>
                  <div className="mt-8 p-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                    <p className="text-sm text-slate-500">
                      Você pode adicionar até 12 fotos de alta qualidade do seu estabelecimento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* STICKY ACTION BAR */}
        <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-40 transition-all animate-in slide-in-from-bottom-full duration-500">
          <div className="max-w-5xl mx-auto flex items-center justify-between sm:px-4">
             <div className="hidden md:block">
               <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Atenção</p>
               <p className="text-sm text-slate-600 font-medium italic">Não esqueça de salvar suas alterações antes de sair.</p>
             </div>
             <div className="flex items-center gap-4 w-full md:w-auto">
               <Button type="button" variant="ghost" className="hidden sm:flex rounded-xl font-bold text-slate-400 hover:text-slate-600 h-12 px-6" onClick={() => window.location.reload()}>
                 <X size={18} className="mr-2" /> Descartar
               </Button>
               <Button type="submit" disabled={isSaving} className="flex-1 md:flex-none min-w-[200px] h-12 rounded-xl bg-sky-600 hover:bg-sky-700 shadow-lg shadow-sky-100 font-bold text-base transition-all active:scale-[0.98]">
                 {isSaving ? (
                   <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Salvando...</>
                 ) : (
                   <><Save size={18} className="mr-2" /> Salvar Alterações</>
                 )}
               </Button>
             </div>
          </div>
        </div>
      </form>
    </div>
  );
}
