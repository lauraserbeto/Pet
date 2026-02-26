import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../components/ui/card";
import { Label } from "../../components/ui/label";
import { Switch } from "../../components/ui/switch";
import { Avatar } from "../../components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Camera } from "lucide-react";

export function Settings() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Configurações</h2>
        <p className="text-slate-500">Gerencie os detalhes da sua conta e preferências da loja.</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="profile">Perfil da Loja</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="services">Serviços</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>Essas informações serão visíveis para seus clientes.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                 <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 border-4 border-white shadow-lg" fallback="LO" />
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <Camera className="text-white h-6 w-6" />
                    </div>
                 </div>
                 <div>
                    <h3 className="font-medium text-slate-900">Logo da Loja</h3>
                    <p className="text-sm text-slate-500 mb-2">JPG, GIF ou PNG. Máximo de 2MB.</p>
                    <Button size="sm" variant="outline">Alterar Foto</Button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <Label htmlFor="storeName">Nome da Loja</Label>
                    <Input id="storeName" defaultValue="Loja Oficial Pet+" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="category">Categoria Principal</Label>
                    <Input id="category" defaultValue="Pet Shop & Veterinário" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="email">Email de Contato</Label>
                    <Input id="email" defaultValue="contato@lojaoficial.com.br" />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                    <Input id="phone" defaultValue="(11) 99999-9999" />
                 </div>
                 <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="address">Endereço Completo</Label>
                    <Input id="address" defaultValue="Rua das Flores, 123, Centro, São Paulo - SP" />
                 </div>
                 <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="bio">Descrição (Bio)</Label>
                    <textarea 
                      className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-500)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      id="bio" 
                      defaultValue="Especialistas em cuidar do seu melhor amigo com carinho e dedicação."
                    />
                 </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end border-t bg-slate-50 px-6 py-4">
               <Button>Salvar Alterações</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
           <Card>
              <CardHeader>
                 <CardTitle>Preferências de Notificação</CardTitle>
                 <CardDescription>Escolha como e quando você quer ser notificado.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label className="text-base">Novos Agendamentos</Label>
                       <p className="text-sm text-slate-500">Receba um alerta quando um cliente agendar um serviço.</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label className="text-base">Cancelamentos</Label>
                       <p className="text-sm text-slate-500">Seja avisado se um cliente cancelar.</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label className="text-base">Estoque Baixo</Label>
                       <p className="text-sm text-slate-500">Alertas quando produtos estiverem acabando.</p>
                    </div>
                    <Switch defaultChecked />
                 </div>
                 <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                       <Label className="text-base">Marketing e Dicas</Label>
                       <p className="text-sm text-slate-500">Receba dicas para vender mais no Pet+.</p>
                    </div>
                    <Switch />
                 </div>
              </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
