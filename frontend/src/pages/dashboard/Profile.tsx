import React, { useEffect, useState, useRef } from "react";
import { providerService } from "../../lib/services/providerService";
import { useCepLookup } from "../../lib/hooks/useCepLookup";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { Loader2, UploadCloud, Image as ImageIcon, Search } from "lucide-react";

interface ProfileFormState {
  full_name: string;
  email: string;
  business_name: string;
  document: string;
  phone: string;
  description: string;
  zip_code: string;
  address_line: string;
  city: string;
  state: string;
  avatar_url?: string;
}

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
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isFetchingCep, lookupCep } = useCepLookup();

  const handleDropzoneClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        avatar_url: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const providerData = await providerService.fetchMe();
        
        if (providerData) {
           setFormData({
             full_name: providerData.user?.full_name || "",
             email: providerData.user?.email || "",
             business_name: providerData.business_name || "",
             document: providerData.document || "",
             phone: providerData.phone || "",
             description: providerData.description || "",
             zip_code: providerData.zip_code || "",
             address_line: providerData.address_line || "",
             city: providerData.city || "",
             state: providerData.state || "",
             avatar_url: providerData.user?.avatar_url || "",
           });
        }
      } catch (error) {
        console.error("Erro geral na busca de perfil:", error);
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

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Aplica máscara 00000-000
    const masked = raw
      .replace(/\D/g, "")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .slice(0, 9);

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
        toast.success("Endereço preenchido automaticamente!");
      } else {
        // Limpa campos de endereço se CEP inválido
        setFormData(prev => ({
          ...prev,
          address_line: "",
          city: "",
          state: "",
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await providerService.updateMe(formData);
      toast.success("Perfil atualizado com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar o perfil. Tente novamente.");
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
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 border-b pb-2 border-slate-100 font-[family-name:var(--font-display)]">
          Meu Perfil
        </h2>
        <p className="text-slate-500 pt-2 font-[family-name:var(--font-sans)]">
          Gerencie suas informações pessoais e os dados públicos da sua vitrine.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 font-[family-name:var(--font-sans)]">
        
        {/* Seção 1: Informações da Conta */}
        <Card className="bg-white border-zinc-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-zinc-100">
            <CardTitle className="text-lg text-slate-900">Informações da Conta</CardTitle>
            <CardDescription className="text-slate-500">
              Dados básicos do responsável pela conta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-sm font-medium text-slate-700">
                  Nome do Responsável
                </Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Seu nome completo"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-mail
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  readOnly
                  className="bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 2: Perfil Público do Negócio */}
        <Card className="bg-white border-zinc-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-zinc-100">
            <CardTitle className="text-lg text-slate-900">Perfil Público do Negócio</CardTitle>
            <CardDescription className="text-slate-500">
              Esta é a sua vitrine. Esses dados ficarão visíveis para os clientes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-2">
              <Label>Logo do Negócio</Label>
              <div 
                onClick={handleDropzoneClick}
                className="border-2 border-dashed border-slate-200 hover:border-sky-500 hover:bg-slate-50 transition-colors rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer group max-w-sm"
              >
                {formData.avatar_url ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden group-hover:opacity-90 transition-opacity">
                     <img src={formData.avatar_url} alt="Logo Preview" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <UploadCloud className="w-6 h-6 text-white" />
                     </div>
                  </div>
                ) : (
                  <>
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <ImageIcon className="text-slate-400 h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-700">Adicionar Logo</p>
                    <p className="text-xs text-slate-500 mt-1">PNG ou JPG (Max. 2MB)</p>
                  </>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="business_name" className="text-sm font-medium text-slate-700">
                  Nome do Negócio
                </Label>
                <Input
                  id="business_name"
                  name="business_name"
                  value={formData.business_name}
                  onChange={handleChange}
                  placeholder="Ex: PetShop Cão Feliz"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="document" className="text-sm font-medium text-slate-700">
                  Documento (CNPJ/CPF)
                </Label>
                <Input
                  id="document"
                  name="document"
                  value={formData.document}
                  onChange={handleChange}
                  placeholder="00.000.000/0000-00 ou 000.000.000-00"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                  Telefone Comercial
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(11) 99999-9999"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Sobre o Negócio
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Conte um pouco sobre os seus serviços e diferenciais..."
                  rows={4}
                  className="resize-none bg-white border-slate-200 text-slate-900 min-h-[100px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção 3: Localização */}
        <Card className="bg-white border-zinc-200 shadow-sm rounded-xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-zinc-100">
            <CardTitle className="text-lg text-slate-900">Localização</CardTitle>
            <CardDescription className="text-slate-500">
              Onde o seu negócio está localizado.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6 mb-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CEP com busca automática */}
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-sm font-medium text-slate-700">
                  CEP
                </Label>
                <div className="relative">
                  <Input
                    id="zip_code"
                    name="zip_code"
                    value={formData.zip_code}
                    onChange={handleCepChange}
                    placeholder="00000-000"
                    required
                    maxLength={9}
                    className="bg-white border-slate-200 text-slate-900 h-11 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {isFetchingCep ? (
                      <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </div>
                </div>
                {isFetchingCep && (
                  <p className="text-xs text-sky-600 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando endereço...
                  </p>
                )}
              </div>

              {/* Endereço - preenchido pelo ViaCEP, editável */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address_line" className="text-sm font-medium text-slate-700">
                  Endereço
                </Label>
                <Input
                  id="address_line"
                  name="address_line"
                  value={formData.address_line}
                  onChange={handleChange}
                  placeholder="Rua, Número, Complemento, Bairro"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>

              {/* Cidade - preenchida pelo ViaCEP, editável */}
              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-slate-700">
                  Cidade
                </Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="Nome da cidade"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>

              {/* Estado - preenchido pelo ViaCEP, editável */}
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-slate-700">
                  Estado (UF)
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Ex: SP"
                  maxLength={2}
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-zinc-100 bg-slate-50/80 px-6 py-5">
            <Button type="submit" disabled={isSaving} className="min-w-[160px] h-11">
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
