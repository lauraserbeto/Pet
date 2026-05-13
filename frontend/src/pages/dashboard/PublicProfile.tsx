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
  X,
} from "lucide-react";
import { HamsterLoader } from "../../components/ui/HamsterLoader";

interface OperatingHour {
  open: boolean;
  start: string;
  end: string;
}

interface OperatingHours {
  [key: string]: OperatingHour;
}

interface PublicProfileFormState {
  business_name: string;
  phone: string;
  description: string;
  zip_code: string;
  address_line: string;
  city: string;
  state: string;
  avatar_url?: string;
  operating_hours: OperatingHours | string;
  allowed_animals: string[];
  amenities: string[];
  gallery_images: string[];
  daily_rate: string;
  rules_policies: string[];
  highlights: string[];
  hourly_rate: string;
  sitter_roles: string[];
  role_id?: number;
}

const HOTEL_AMENITIES = ["Wi fi", "Área Verde", "Supervisão 24h", "Piscina", "Webcam", "DayCare"];
const HOTEL_ANIMALS = ["Sem restrição", "Cachorro", "Gato"];
const SITTER_HIGHLIGHTS = ["Certificado profissional", "Envia fotos e vídeos", "Aceita todos os portes", "Disponível finais de semana"];
const SITTER_ROLES = ["Pet Sitter", "Dog Walker", "Médico Veterinário"];

const DAYS_OF_WEEK = [
  { id: "mon", label: "Segunda-feira" },
  { id: "tue", label: "Terça-feira" },
  { id: "wed", label: "Quarta-feira" },
  { id: "thu", label: "Quinta-feira" },
  { id: "fri", label: "Sexta-feira" },
  { id: "sat", label: "Sábado" },
  { id: "sun", label: "Domingo" },
];

const INITIAL_HOURS: OperatingHours = DAYS_OF_WEEK.reduce((acc, day) => ({
  ...acc,
  [day.id]: { open: true, start: "08:00", end: "18:00" }
}), {});

const REQUIRED_FIELDS: Record<string, string[]> = {
  common: ['avatar_url', 'business_name', 'phone', 'description', 'zip_code', 'address_line', 'city', 'state'],
  hotel: ['daily_rate', 'allowed_animals', 'operating_hours'],
  sitter: ['hourly_rate', 'sitter_roles'],
  loja: ['operating_hours']
};

const FIELD_LABELS: Record<string, string> = {
  avatar_url: 'Logo/Avatar',
  business_name: 'Nome do Negócio',
  phone: 'Telefone Comercial',
  description: 'Sobre (Descrição)',
  zip_code: 'CEP',
  address_line: 'Endereço',
  city: 'Cidade',
  state: 'Estado',
  daily_rate: 'Diária Base',
  allowed_animals: 'Animais Permitidos',
  hourly_rate: 'Valor por Hora',
  sitter_roles: 'Especialidades',
  operating_hours: 'Horário de Funcionamento'
};

// --- Utils ---
const maskPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) {
    return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  } else if (v.length > 2) {
    return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  } else if (v.length > 0) {
    return v.replace(/(\d{0,2})/, "($1");
  }
  return v;
};

const maskCurrency = (v: string | number) => {
  let value = typeof v === 'number' ? v.toFixed(2).replace('.', '') : v.replace(/\D/g, "");
  if (!value) return "R$ 0,00";
  let floatValue = parseInt(value) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(floatValue);
};

const parseCurrency = (v: string) => {
  return parseFloat(v.replace(/[^\d]/g, "")) / 100 || 0;
};


export function PublicProfile() {
  const [formData, setFormData] = useState<PublicProfileFormState>({
    business_name: "",
    phone: "",
    description: "",
    zip_code: "",
    address_line: "",
    city: "",
    state: "",
    avatar_url: "",
    allowed_animals: [],
    amenities: [],
    gallery_images: [],
    daily_rate: "R$ 0,00",
    rules_policies: [],
    highlights: [],
    hourly_rate: "R$ 0,00",
    sitter_roles: [],
    operating_hours: INITIAL_HOURS,
  });

  const [newRule, setNewRule] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const { isFetchingCep, lookupCep } = useCepLookup();

  const isLoja = formData.role_id === 2;
  const isHotel = formData.role_id === 3;
  const isSitter = formData.role_id === 4;

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const d = await providerService.fetchMe();
        if (d) {
          setFormData({
            role_id: d.user?.role_id,
            business_name: d.business_name || "",
            phone: d.phone || "",
            description: d.description || "",
            zip_code: d.zip_code || "",
            address_line: d.address_line || "",
            city: d.city || "",
            state: d.state || "",
            avatar_url: d.user?.avatar_url || "",
            operating_hours: d.operating_hours ? (typeof d.operating_hours === 'string' ? JSON.parse(d.operating_hours) : d.operating_hours) : INITIAL_HOURS,
            allowed_animals: d.allowed_animals || [],
            amenities: d.amenities || [],
            gallery_images: d.gallery_images || [],
            daily_rate: maskCurrency(d.daily_rate || 0),
            rules_policies: d.rules_policies ? (typeof d.rules_policies === 'string' ? JSON.parse(d.rules_policies) : d.rules_policies) : [],
            highlights: d.highlights || [],
            hourly_rate: maskCurrency(d.hourly_rate || 0),
            sitter_roles: d.sitter_roles || [],
          });
        }
      } catch {
        toast.error("Erro ao carregar perfil público.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: maskPhone(value) }));
    } else if (name === 'daily_rate' || name === 'hourly_rate') {
      setFormData((prev) => ({ ...prev, [name]: maskCurrency(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const masked = e.target.value.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 9);
    setFormData((prev) => ({ ...prev, zip_code: masked }));
    const digits = masked.replace(/\D/g, "");
    if (digits.length === 8) {
      const cepData = await lookupCep(digits);
      if (cepData) {
        setFormData((prev) => ({
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
    reader.onloadend = () => setFormData((prev) => ({ ...prev, avatar_url: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        setFormData((prev) => ({
          ...prev,
          gallery_images: [...prev.gallery_images, reader.result as string],
        }));
      reader.readAsDataURL(file);
    });
  };

  const removeGalleryImage = (index: number, ev: React.MouseEvent) => {
    ev.stopPropagation();
    setFormData((prev) => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index),
    }));
  };

  const toggleArrayCheckbox = (
    field: "allowed_animals" | "amenities" | "highlights" | "sitter_roles",
    item: string
  ) => {
    setFormData((prev) => {
      let current = prev[field] as string[];
      
      // Mutual Exclusivity Logic for Animals
      if (field === 'allowed_animals') {
        if (item === "Sem restrição") {
          current = current.includes(item) ? [] : [item];
        } else {
          current = current.filter(i => i !== "Sem restrição");
          current = current.includes(item) ? current.filter(i => i !== item) : [...current, item];
        }
      } else {
        current = current.includes(item) ? current.filter((i) => i !== item) : [...current, item];
      }

      return {
        ...prev,
        [field]: current,
      };
    });
  };

  const handleAddRule = () => {
    if (!newRule.trim()) return;
    setFormData(prev => ({
      ...prev,
      rules_policies: [...(prev.rules_policies || []), newRule.trim()]
    }));
    setNewRule("");
  };

  const removeRule = (index: number) => {
    setFormData(prev => ({
      ...prev,
      rules_policies: (prev.rules_policies as string[]).filter((_, i) => i !== index)
    }));
  };

  const updateHours = (dayId: string, updates: Partial<OperatingHour>) => {
    setFormData(prev => ({
      ...prev,
      operating_hours: {
        ...(prev.operating_hours as OperatingHours),
        [dayId]: { ...(prev.operating_hours as OperatingHours)[dayId], ...updates }
      }
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const errors: string[] = [];
    const fieldsToCheck = [...REQUIRED_FIELDS.common];
    if (isHotel) fieldsToCheck.push(...REQUIRED_FIELDS.hotel);
    if (isSitter) fieldsToCheck.push(...REQUIRED_FIELDS.sitter);
    if (isLoja || isHotel) fieldsToCheck.push('operating_hours');

    fieldsToCheck.forEach(field => {
      const val = (formData as any)[field];
      const isEmpty = !val || (Array.isArray(val) && val.length === 0);
      if (isEmpty) {
        errors.push(FIELD_LABELS[field] || field);
      }
    });

    if (errors.length > 0) {
      toast.error(`Ops! Campos obrigatórios pendentes: ${errors.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      const { role_id, daily_rate, hourly_rate, operating_hours, rules_policies, ...rest } = formData;
      const payload = {
        ...rest,
        daily_rate: parseCurrency(daily_rate as string),
        hourly_rate: parseCurrency(hourly_rate as string),
        operating_hours: operating_hours,  
        rules_policies: rules_policies,
      };
      await providerService.updatePublicProfile(payload);
      toast.success("Perfil público atualizado com sucesso!");
    } catch {
      toast.error("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };
  
  const RequiredLabel = ({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) => (
    <Label htmlFor={htmlFor} className="text-sm font-semibold text-slate-700 ml-1">
      {children} <span className="text-red-500">*</span>
    </Label>
  );

  const CheckboxRow = ({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: () => void }) => (
    <div 
      onClick={onChange}
      className={`flex items-center space-x-3 p-4 rounded-2xl border transition-all cursor-pointer ${checked ? "bg-indigo-50 border-indigo-200 shadow-sm" : "bg-white border-slate-100 hover:border-slate-200"}`}
    >
      <Checkbox 
        id={id} 
        checked={checked} 
        onCheckedChange={onChange} 
        className="data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500" 
        onClick={(e) => e.stopPropagation()}
      />
      <span className="text-sm font-semibold text-slate-700 select-none">{label}</span>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[400px] items-center justify-center">
        <HamsterLoader size="sm" message="Carregando perfil público..." />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-24 font-[family-name:var(--font-sans)]">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] tracking-tight">
          Meu Perfil Público
        </h2>
        <p className="text-slate-500 mt-2 text-base">
          Configure como sua marca e serviços são exibidos para os clientes na vitrine Pet+.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="geral" className="space-y-8">
          {/* Tab Nav */}
          <TabsList className="bg-slate-100/50 p-1 rounded-xl h-12 w-full flex justify-start gap-2 overflow-x-auto">
            <TabsTrigger value="geral" className="rounded-lg px-5 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
              <User size={15} /> Geral
            </TabsTrigger>
            <TabsTrigger value="localizacao" className="rounded-lg px-5 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
              <MapPin size={15} /> Localização
            </TabsTrigger>
            <TabsTrigger value="operacao" className="rounded-lg px-5 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
              <Settings2 size={15} /> Operação
            </TabsTrigger>
            {isHotel && (
              <TabsTrigger value="galeria" className="rounded-lg px-5 flex gap-2 items-center data-[state=active]:bg-white data-[state=active]:shadow-sm text-sm">
                <Images size={15} /> Galeria
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── ABA GERAL ── */}
          <TabsContent value="geral" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <User className="text-[var(--color-primary-500)]" size={20} /> Identidade da Vitrine
                </CardTitle>
                <CardDescription>Logo, nome do negócio, contato e bio que os clientes veem.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-8">
                {/* Logo */}
                <div className="flex flex-col sm:flex-row items-center gap-8 pb-2">
                  <div onClick={() => avatarInputRef.current?.click()} className="relative group cursor-pointer">
                    <div className="w-32 h-32 rounded-full border-4 border-slate-100 overflow-hidden bg-slate-50 flex items-center justify-center transition-all group-hover:border-[var(--color-primary-300)] group-hover:scale-[1.02]">
                      {formData.avatar_url ? (
                        <img src={formData.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                      )}
                      <div className="absolute inset-0 rounded-full bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <UploadCloud className="text-white mb-1" size={22} />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Alterar</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="font-bold text-slate-800 mb-1">Logotipo Público</h4>
                    <p className="text-sm text-slate-500 mb-4 max-w-sm">
                      Imagem quadrada de pelo menos 400×400 px. Formatos: JPG, PNG, WEBP.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => avatarInputRef.current?.click()}
                      className="rounded-full border-slate-200 hover:bg-slate-50 font-semibold px-6"
                    >
                      Escolher Imagem
                    </Button>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>

                {/* Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="business_name">Nome do Negócio / Vitrine</RequiredLabel>
                    <Input
                      id="business_name" name="business_name" value={formData.business_name}
                      onChange={handleChange}
                      placeholder="Ex: Pet Shop Dog Feliz ou Hotel Fazenda Pet"
                      className="h-12 rounded-xl bg-slate-50/30 focus-visible:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="phone">Telefone Comercial</RequiredLabel>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="phone" name="phone" value={formData.phone}
                        onChange={handleChange} placeholder="(00) 00000-0000"
                        className="h-12 rounded-xl pl-11 bg-slate-50/30 focus-visible:bg-white transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="description">Descrição / Bio Pública</RequiredLabel>
                    <Textarea
                      id="description" name="description" value={formData.description}
                      onChange={handleChange} rows={5}
                      placeholder="Apresente seu negócio de forma atraente aos clientes..."
                      className="resize-none rounded-2xl bg-slate-50/30 focus-visible:bg-white transition-colors min-h-[140px] p-4 text-slate-700 leading-relaxed"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA LOCALIZAÇÃO ── */}
          <TabsContent value="localizacao" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <MapPin className="text-red-500" size={20} /> Endereço & Abrangência
                </CardTitle>
                <CardDescription>Localização exibida no mapa da plataforma e usada para calcular distância.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="space-y-2 md:col-span-1">
                    <RequiredLabel htmlFor="zip_code">CEP</RequiredLabel>
                    <div className="relative">
                      <Input
                        id="zip_code" name="zip_code" value={formData.zip_code}
                        onChange={handleCepChange} maxLength={9} placeholder="00000-000"
                        className="h-12 rounded-xl bg-slate-50/30 pr-10"
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isFetchingCep ? (
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-primary-500)]" />
                        ) : (
                          <Search className="h-4 w-4 text-slate-300" />
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 md:col-span-3">
                    <RequiredLabel htmlFor="address_line">Logradouro</RequiredLabel>
                    <Input id="address_line" name="address_line" value={formData.address_line} onChange={handleChange} placeholder="Ex: Rua das Flores, 123 - Bairro" className="h-12 rounded-xl bg-slate-50/30" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="city">Cidade</RequiredLabel>
                    <Input id="city" name="city" value={formData.city} onChange={handleChange} placeholder="Ex: São Paulo" className="h-12 rounded-xl bg-slate-50/30" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <RequiredLabel htmlFor="state">Estado (UF)</RequiredLabel>
                    <Input id="state" name="state" value={formData.state} onChange={handleChange} maxLength={2} placeholder="SP" className="h-12 rounded-xl bg-slate-50/30 uppercase" />
                  </div>
                </div>
                <div className="p-4 bg-sky-50 rounded-2xl border border-sky-100 flex items-start gap-3">
                  <div className="p-2 bg-sky-500 text-white rounded-lg shrink-0"><MapPin size={16} /></div>
                  <p className="text-xs text-sky-700 leading-relaxed mt-0.5">
                    Seu endereço é usado para calcular distância e exibir seu perfil nas buscas da plataforma.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA OPERAÇÃO ── */}
          <TabsContent value="operacao" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
            <Card className="border-slate-200 shadow-sm rounded-2xl">
              <CardHeader className="border-b border-slate-100 pb-6">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Settings2 className="text-indigo-500" size={20} /> Detalhes de Atendimento
                </CardTitle>
                <CardDescription>Horários, preços e diferenciais exibidos no seu perfil público.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-10">

                {/* Horários / Preços */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {(isHotel || isLoja) && (
                    <div className="space-y-4 md:col-span-2">
                      <RequiredLabel htmlFor="operating_hours">Horário de Funcionamento</RequiredLabel>
                      <div className="grid grid-cols-1 gap-2 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        {DAYS_OF_WEEK.map((day) => {
                          const config = (formData.operating_hours as OperatingHours)[day.id];
                          return (
                            <div key={day.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-white rounded-xl border border-slate-100 gap-4">
                              <div className="flex items-center gap-3 min-w-[140px]">
                                <Checkbox 
                                  id={`open-${day.id}`} 
                                  checked={config.open} 
                                  onCheckedChange={(checked) => updateHours(day.id, { open: !!checked })}
                                />
                                <Label htmlFor={`open-${day.id}`} className="font-semibold text-slate-700 cursor-pointer">{day.label}</Label>
                              </div>
                              <div className={`flex items-center gap-2 transition-opacity ${config.open ? "opacity-100" : "opacity-30 pointer-events-none"}`}>
                                <Input 
                                  type="time" 
                                  value={config.start} 
                                  onChange={(e) => updateHours(day.id, { start: e.target.value })}
                                  className="w-28 h-9 rounded-lg"
                                />
                                <span className="text-slate-400">às</span>
                                <Input 
                                  type="time" 
                                  value={config.end} 
                                  onChange={(e) => updateHours(day.id, { end: e.target.value })}
                                  className="w-28 h-9 rounded-lg"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {isHotel && (
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="daily_rate">Diária Base (R$)</RequiredLabel>
                      <div className="relative">
                        <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          id="daily_rate" 
                          name="daily_rate" 
                          value={formData.daily_rate} 
                          onChange={handleChange} 
                          className="h-12 rounded-xl pl-11 bg-slate-50/30" 
                          placeholder="R$ 0,00" 
                        />
                      </div>
                    </div>
                  )}
                  {isSitter && (
                    <div className="space-y-2">
                      <RequiredLabel htmlFor="hourly_rate">Valor por Hora (R$)</RequiredLabel>
                      <div className="relative">
                        <CircleDollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input 
                          id="hourly_rate" 
                          name="hourly_rate" 
                          value={formData.hourly_rate} 
                          onChange={handleChange} 
                          className="h-12 rounded-xl pl-11 bg-slate-50/30" 
                          placeholder="R$ 0,00" 
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Sitter Roles */}
                {isSitter && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Especialidades oferecidas</Label>
                      <span className="text-red-500 text-xs">*</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {SITTER_ROLES.map((role) => (
                        <CheckboxRow 
                          key={role} 
                          id={`role-${role}`} 
                          label={role} 
                          checked={formData.sitter_roles.includes(role)} 
                          onChange={() => toggleArrayCheckbox("sitter_roles", role)} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Animals */}
                {isHotel && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                       <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Animais Aceitos</Label>
                       <span className="text-red-500 text-xs">*</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {HOTEL_ANIMALS.map((anim) => (
                        <CheckboxRow 
                          key={anim} 
                          id={`anim-${anim}`} 
                          label={anim} 
                          checked={formData.allowed_animals.includes(anim)} 
                          onChange={() => toggleArrayCheckbox("allowed_animals", anim)} 
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Amenities / Highlights */}
                {(isHotel || isSitter) && (
                  <div className="space-y-4">
                    <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
                      {isHotel ? "Comodidades & Diferenciais" : "Destaques do Perfil"}
                    </Label>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                      {(isHotel ? HOTEL_AMENITIES : SITTER_HIGHLIGHTS).map((item) => {
                        const checked = isHotel ? formData.amenities.includes(item) : formData.highlights.includes(item);
                        return (
                          <CheckboxRow 
                            key={item} 
                            id={`item-${item}`} 
                            label={item} 
                            checked={checked} 
                            onChange={() => toggleArrayCheckbox(isHotel ? "amenities" : "highlights", item)} 
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Policies */}
                {isHotel && (
                  <div className="space-y-4 pt-2">
                    <Label htmlFor="rule-input" className="text-sm font-semibold text-slate-700 ml-1 flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Regras e Políticas do Estabelecimento
                    </Label>
                    
                    <div className="flex gap-2">
                      <Input 
                        id="rule-input" 
                        value={newRule} 
                        onChange={(e) => setNewRule(e.target.value)}
                        placeholder="Ex: Check-in a partir das 08h"
                        className="h-11 rounded-xl bg-slate-50/30"
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRule())}
                      />
                      <Button type="button" onClick={handleAddRule} className="rounded-xl h-11 px-4 bg-indigo-500 hover:bg-indigo-600">
                        <Plus size={20} />
                      </Button>
                    </div>

                    <div className="space-y-2 mt-4">
                      {formData.rules_policies.map((policy, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
                          <span className="text-sm text-slate-700 font-medium">{policy}</span>
                          <button 
                            type="button" 
                            onClick={() => removeRule(i)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                      {formData.rules_policies.length === 0 && (
                        <p className="text-xs text-slate-400 italic p-2">Nenhuma regra adicionada ainda.</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ABA GALERIA (Hotel only) ── */}
          {isHotel && (
            <TabsContent value="galeria" className="animate-in fade-in slide-in-from-bottom-2 space-y-6">
              <Card className="border-slate-200 shadow-sm rounded-2xl">
                <CardHeader className="border-b border-slate-100 pb-6">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Images className="text-pink-500" size={20} /> Galeria de Fotos
                  </CardTitle>
                  <CardDescription>Mostre o seu espaço e encante os clientes visualmente.</CardDescription>
                </CardHeader>
                <CardContent className="pt-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.gallery_images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group shadow-sm border border-slate-100">
                        <img src={img} alt={`Foto ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button
                          type="button"
                          onClick={(e) => removeGalleryImage(i, e)}
                          className="absolute top-2 right-2 h-8 w-8 bg-white/90 backdrop-blur-sm border border-slate-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all shadow-sm scale-90 group-hover:scale-100"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                    <div
                      onClick={() => galleryInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-[var(--color-primary-400)] hover:bg-[var(--color-primary-50)]/30 transition-all aspect-square rounded-2xl flex flex-col items-center justify-center cursor-pointer text-slate-400 hover:text-[var(--color-primary-600)] group"
                    >
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-2 group-hover:bg-[var(--color-primary-100)] transition-colors">
                        <Plus size={22} />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider">Adicionar</span>
                      <input type="file" ref={galleryInputRef} className="hidden" accept="image/*" multiple onChange={handleGalleryChange} />
                    </div>
                  </div>
                  <div className="mt-6 p-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                    <p className="text-sm text-slate-500">Adicione até 12 fotos de alta qualidade para impressionar os clientes.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* ── STICKY SAVE BAR ── */}
        <div className="fixed bottom-0 left-0 right-0 sm:left-64 bg-white/85 backdrop-blur-md border-t border-slate-200 px-4 py-3 z-40">
          <div className="max-w-5xl mx-auto flex items-center justify-between sm:px-2">
            <p className="hidden md:block text-sm text-slate-500 italic">
              Salve as alterações para atualizar sua vitrine pública.
            </p>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button
                type="button"
                variant="ghost"
                className="hidden sm:flex rounded-xl font-semibold text-slate-400 hover:text-slate-600 h-11 px-5"
                onClick={() => window.location.reload()}
              >
                <X size={16} className="mr-1.5" /> Descartar
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex-1 md:flex-none min-w-[180px] h-11 rounded-xl bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] shadow-md font-bold transition-all active:scale-[0.98]"
              >
                {isSaving ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Salvando...</>
                ) : (
                  <><Save size={16} className="mr-2" /> Salvar Perfil</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
