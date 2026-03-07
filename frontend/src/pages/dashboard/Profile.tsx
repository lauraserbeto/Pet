import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        if (!session) {
          setIsLoading(false);
          return;
        }

        const userId = session.user.id;

        const [usersResponse, providersResponse] = await Promise.all([
          supabase.from("users").select("full_name, email").eq("id", userId).single(),
          supabase.from("providers").select("business_name, document, phone, description, zip_code, address_line, city, state").eq("user_id", userId).single()
        ]);

        if (usersResponse.error) {
          console.error("Erro ao buscar dados do usuário:", usersResponse.error);
        }
        
        if (providersResponse.error && providersResponse.error.code !== "PGRST116") {
           console.error("Erro ao buscar dados do provedor:", providersResponse.error);
        }

        setFormData({
          full_name: usersResponse.data?.full_name || "",
          email: usersResponse.data?.email || session.user.email || "",
          business_name: providersResponse.data?.business_name || "",
          document: providersResponse.data?.document || "",
          phone: providersResponse.data?.phone || "",
          description: providersResponse.data?.description || "",
          zip_code: providersResponse.data?.zip_code || "",
          address_line: providersResponse.data?.address_line || "",
          city: providersResponse.data?.city || "",
          state: providersResponse.data?.state || "",
        });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Usuário não autenticado");

      const userId = session.user.id;

      // UPDATE na tabela users
      const userUpdatePromise = supabase
        .from("users")
        .update({ full_name: formData.full_name })
        .eq("id", userId);

      // UPDATE na tabela providers
      const providerUpdatePromise = supabase
        .from("providers")
        .update({
          business_name: formData.business_name,
          document: formData.document,
          phone: formData.phone,
          description: formData.description,
          zip_code: formData.zip_code,
          address_line: formData.address_line,
          city: formData.city,
          state: formData.state,
        })
        .eq("user_id", userId);

      const [userRes, providerRes] = await Promise.all([
        userUpdatePromise,
        providerUpdatePromise,
      ]);

      if (userRes.error) throw userRes.error;
      if (providerRes.error) throw providerRes.error;

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
              <div className="space-y-2">
                <Label htmlFor="zip_code" className="text-sm font-medium text-slate-700">
                  CEP
                </Label>
                <Input
                  id="zip_code"
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleChange}
                  placeholder="00000-000"
                  required
                  className="bg-white border-slate-200 text-slate-900 h-11"
                />
              </div>
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
              <div className="space-y-2">
                <Label htmlFor="state" className="text-sm font-medium text-slate-700">
                  Estado
                </Label>
                <Input
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="Sigla (Ex: SP)"
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
