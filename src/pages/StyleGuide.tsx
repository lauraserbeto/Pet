import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "../components/ui/card";
import { Avatar } from "../components/ui/avatar";

export function StyleGuide() {
  return (
    <div className="container mx-auto py-12 px-4 space-y-16">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold font-[family-name:var(--font-display)]">Pet+ Design System</h1>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Um guia de referência para os componentes e tokens de design utilizados na plataforma Pet+.
        </p>
      </div>

      {/* Colors Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Cores</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Primary (Brand)</h3>
            <div className="h-20 w-full bg-[var(--color-primary-500)] rounded-lg shadow-sm flex items-end p-2 text-white text-xs">500 (Base)</div>
            <div className="h-10 w-full bg-[var(--color-primary-100)] rounded-lg shadow-sm"></div>
            <div className="h-10 w-full bg-[var(--color-primary-700)] rounded-lg shadow-sm"></div>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Secondary (Trust)</h3>
            <div className="h-20 w-full bg-[var(--color-secondary-500)] rounded-lg shadow-sm flex items-end p-2 text-white text-xs">500 (Base)</div>
            <div className="h-10 w-full bg-[var(--color-secondary-100)] rounded-lg shadow-sm"></div>
            <div className="h-10 w-full bg-[var(--color-secondary-700)] rounded-lg shadow-sm"></div>
          </div>
           <div className="space-y-2">
            <h3 className="font-semibold text-sm">Neutrals</h3>
            <div className="h-20 w-full bg-slate-900 rounded-lg shadow-sm flex items-end p-2 text-white text-xs">900</div>
            <div className="h-10 w-full bg-slate-500 rounded-lg shadow-sm"></div>
            <div className="h-10 w-full bg-slate-100 rounded-lg shadow-sm"></div>
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Tipografia</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-wider">Display Font (Nunito)</h3>
            <div className="space-y-4 font-[family-name:var(--font-display)]">
              <h1 className="text-4xl font-extrabold">Heading 1 - The quick brown fox</h1>
              <h2 className="text-3xl font-bold">Heading 2 - The quick brown fox</h2>
              <h3 className="text-2xl font-bold">Heading 3 - The quick brown fox</h3>
            </div>
          </div>
           <div>
            <h3 className="text-sm text-slate-500 mb-4 uppercase tracking-wider">Body Font (Inter)</h3>
            <div className="space-y-4 font-[family-name:var(--font-body)]">
              <p className="text-base">Body Base - Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
              <p className="text-sm text-slate-500">Body Small (Muted) - Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Buttons */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Botões</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link Button</Button>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Inputs */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Inputs & Forms</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Input label="Email Address" placeholder="name@example.com" />
          <Input label="Password" type="password" placeholder="••••••••" />
          <Input label="Com Erro" placeholder="Invalid input" error="Campo obrigatório" />
        </div>
      </section>

       {/* Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Badges</h2>
        <div className="flex flex-wrap gap-4">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="destructive">Destructive</Badge>
        </div>
      </section>

       {/* Cards */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold border-b pb-2">Cards</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Card Simples</CardTitle>
              <CardDescription>Uma descrição breve do conteúdo.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Conteúdo principal do card vai aqui.</p>
            </CardContent>
            <CardFooter>
              <Button size="sm">Ação</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

    </div>
  );
}
