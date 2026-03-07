import React, { useState } from 'react';
import { Settings as SettingsIcon, DollarSign, ShieldAlert, Save, Percent, LogOut } from 'lucide-react';
import { toast } from 'sonner';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Switch } from "../../components/ui/switch";
import { Button } from "../../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";

export function Settings() {
  const [activeTab, setActiveTab] = useState('geral');

  // Estados da Aba 1: Geral
  const [platformName, setPlatformName] = useState('Pet Platform MVP');
  const [supportEmail, setSupportEmail] = useState('suporte@pet.com.br');
  const [autoApprove, setAutoApprove] = useState(false);

  // Estados da Aba 2: Taxas
  const [hotelFee, setHotelFee] = useState('15');
  const [sitterFee, setSitterFee] = useState('15');
  const [sellerFee, setSellerFee] = useState('10');

  // Estados da Aba 3: Segurança
  const [require2FA, setRequire2FA] = useState(true);

  // Handlers para os botões de Salvar
  const handleSaveGeral = () => {
    toast.success('Configurações gerais salvas com sucesso!');
  };

  const handleSaveTaxas = () => {
    toast.success('Regras de taxa salvas com sucesso!');
  };

  const handleForceLogout = () => {
    // Alerta / UI Mock para logout forçado global
    toast.success('Logout forçado disparado para todos os usuários ativos.');
  };

  const handleSaveSecurity = () => {
    toast.success('Configurações de segurança atualizadas!');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2 mb-6">
        <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)] flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-[var(--color-primary-500)]" />
          Configurações da Plataforma
        </h2>
        <p className="text-slate-500">
          Gerencie as configurações globais, regras financeiras e políticas de segurança.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-8 flex flex-wrap gap-2 sm:gap-0 bg-slate-100/50 p-1 rounded-lg">
          <TabsTrigger 
            value="geral" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--color-primary-500)] data-[state=active]:shadow-sm transition-all"
          >
            <SettingsIcon className="w-4 h-4" /> Geral
          </TabsTrigger>
          <TabsTrigger 
            value="taxas" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[var(--color-primary-500)] data-[state=active]:shadow-sm transition-all"
          >
            <DollarSign className="w-4 h-4" /> Taxas da Plataforma
          </TabsTrigger>
          <TabsTrigger 
            value="seguranca" 
            className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-red-600 data-[state=active]:shadow-sm transition-all"
          >
            <ShieldAlert className="w-4 h-4" /> Segurança
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Geral */}
        <TabsContent value="geral" className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-300">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Configurações do Sistema</CardTitle>
              <CardDescription>Informações básicas e regras de aprovação geral.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Nome da Plataforma</Label>
                  <Input 
                    id="platformName" 
                    value={platformName} 
                    onChange={(e) => setPlatformName(e.target.value)}
                    className="focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] transition-shadow"
                    placeholder="Ex: Pet Platform"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">E-mail de Suporte</Label>
                  <Input 
                    id="supportEmail" 
                    type="email"
                    value={supportEmail} 
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] transition-shadow"
                    placeholder="suporte@seu-dominio.com"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg bg-white shadow-sm gap-4 mt-6 hover:border-[var(--color-primary-500)]/30 transition-colors">
                <div className="space-y-1 whitespace-normal">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer" onClick={() => setAutoApprove(!autoApprove)}>
                    Aprovação Automática de Parceiros
                  </Label>
                  <p className="text-sm text-slate-500">
                    Se ativado, novos parceiros (hotéis, pet sitters, lojistas) poderão usar a plataforma imediatamente após o cadastro, sem análise prévia.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch 
                    checked={autoApprove} 
                    onCheckedChange={setAutoApprove}
                    className="data-[state=checked]:bg-[var(--color-primary-500)]"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <Button onClick={handleSaveGeral} className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white shadow-sm gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Configurações
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 2: Taxas da Plataforma */}
        <TabsContent value="taxas" className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-300">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg">Regras de Comissionamento</CardTitle>
              <CardDescription>Defina a porcentagem de comissão retida pela plataforma para os diferentes tipos de serviço.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hotelFee">Comissão sobre Hotéis</Label>
                  <div className="relative group">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[var(--color-primary-500)] transition-colors" />
                    <Input 
                      id="hotelFee" 
                      type="number"
                      value={hotelFee}
                      onChange={(e) => setHotelFee(e.target.value)}
                      className="pl-9 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] transition-shadow"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sitterFee">Comissão sobre Pet Sitters</Label>
                  <div className="relative group">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[var(--color-primary-500)] transition-colors" />
                    <Input 
                      id="sitterFee" 
                      type="number"
                      value={sitterFee}
                      onChange={(e) => setSitterFee(e.target.value)}
                      className="pl-9 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] transition-shadow"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellerFee">Comissão sobre Vendas (Lojistas)</Label>
                  <div className="relative group">
                    <Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-[var(--color-primary-500)] transition-colors" />
                    <Input 
                      id="sellerFee" 
                      type="number"
                      value={sellerFee}
                      onChange={(e) => setSellerFee(e.target.value)}
                      className="pl-9 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] transition-shadow"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <Button onClick={handleSaveTaxas} className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white shadow-sm gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Regras de Taxa
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Tab 3: Segurança */}
        <TabsContent value="seguranca" className="space-y-6">
          <Card className="border-slate-200 shadow-sm bg-white overflow-hidden transition-all duration-300">
            <CardHeader className="bg-red-50/30 border-b border-red-100">
              <CardTitle className="text-red-600 flex items-center gap-2 text-lg">
                <ShieldAlert className="w-5 h-5" /> Ações Críticas e Segurança
              </CardTitle>
              <CardDescription>Gerencie a segurança global das contas administrativas da plataforma.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-200 rounded-lg bg-white shadow-sm gap-4 hover:border-slate-300 transition-colors">
                <div className="space-y-1 whitespace-normal">
                  <Label className="text-base font-semibold text-slate-800 cursor-pointer" onClick={() => setRequire2FA(!require2FA)}>
                    Exigir Autenticação em Duas Etapas (2FA)
                  </Label>
                  <p className="text-sm text-slate-500">
                    Ao ativar, todos os usuários com perfil de Administrador serão obrigados a configurar o 2FA no próximo login para acessar a área administrativa.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Switch 
                    checked={require2FA} 
                    onCheckedChange={setRequire2FA}
                    className="data-[state=checked]:bg-[var(--color-primary-500)]"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 border border-red-200 rounded-lg bg-red-50/50 gap-4 mt-6">
                <div className="space-y-1 whitespace-normal">
                  <Label className="text-base font-semibold text-red-700">
                    Modo de Emergência: Forçar Logout Global
                  </Label>
                  <p className="text-sm text-red-600/80">
                    Desconecte imediatamente todos os usuários ativos na plataforma. Eles precisarão fazer login novamente. Pode demorar alguns minutos.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button onClick={handleForceLogout} variant="destructive" className="bg-red-600 hover:bg-red-700 text-white shadow-sm gap-2 whitespace-nowrap">
                    <LogOut className="w-4 h-4" /> Forçar Logout de Todos
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t border-slate-100 bg-slate-50/50 px-6 py-4">
              <Button onClick={handleSaveSecurity} className="bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white shadow-sm gap-2 transition-all">
                <Save className="w-4 h-4" /> Salvar Configurações de Segurança
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
