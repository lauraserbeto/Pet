import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { PawPrint, ArrowLeft, Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (authData.user) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("role_id")
          .eq("id", authData.user.id)
          .single();

        if (userError) throw userError;

        toast.success("Login realizado com sucesso!", {
          description: "Redirecionando...",
        });

        if ([2, 3, 4].includes(userData.role_id)) {
          const { data: providerData, error: providerError } = await supabase
            .from("providers")
            .select("status")
            .eq("user_id", authData.user.id)
            .single();

          if (providerError) throw providerError;

          if (providerData?.status === "PENDENTE" || providerData?.status === "REJEITADO") {
            toast.error("Acesso bloqueado", {
                description: "Sua conta está em análise pelo administrador. Aguarde a aprovação."
            });
            await supabase.auth.signOut();
            return;
          }
        }

        if ([1, 2, 3, 4].includes(userData.role_id)) {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMsg = err.message === "Invalid login credentials"
        ? "E-mail ou senha incorretos."
        : "Ocorreu um erro ao tentar entrar. Verifique seus dados.";
      
      setError(errorMsg);
      toast.error("Erro ao entrar", {
        description: errorMsg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-[family-name:var(--font-body)]">
      {/* Left Side — Hero Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-primary-700)] z-10 opacity-85" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1583949275413-7fdd2956d79f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjdXRlJTIwcHVwcHklMjBnb2xkZW4lMjByZXRyaWV2ZXIlMjBzbWlsaW5nfGVufDF8fHx8MTc3MTk1MDk3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Pet feliz"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between p-12 text-white h-full">
          <Link to="/" className="flex items-center gap-3">
            <div className="bg-white/20 backdrop-blur-sm p-2 rounded-xl">
              <PawPrint className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
              Pet<span className="text-white/80">+</span>
            </span>
          </Link>

          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] leading-tight">
                Tudo que seu pet
                <br />
                precisa em um
                <br />
                só lugar.
              </h2>
              <p className="mt-4 text-white/80 max-w-sm">
                Conectamos tutores apaixonados aos melhores serviços pet da
                região. Hotéis, pet sitters e muito mais.
              </p>
            </motion.div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center"
                  >
                    <PawPrint className="h-4 w-4 text-white/70" />
                  </div>
                ))}
              </div>
              <div>
                <p className="font-semibold">+2.500 tutores</p>
                <p className="text-sm text-white/70">já confiam no Pet+</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-white/50">
            © 2026 Pet+. Todos os direitos reservados.
          </p>
        </div>
      </div>

      {/* Right Side — Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Mobile Logo */}
          <div className="flex flex-col items-center lg:hidden mb-4">
            <Link
              to="/"
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="bg-[var(--color-primary-500)] p-2 rounded-xl shadow-lg shadow-orange-200">
                <PawPrint className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-display)]">
                Pet
                <span className="text-[var(--color-primary-500)]">+</span>
              </span>
            </Link>
          </div>

          <Card className="w-full border-slate-200 shadow-xl shadow-slate-200/50">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-extrabold text-center font-[family-name:var(--font-display)]">
                Bem-vindo de volta
              </CardTitle>
              <CardDescription className="text-center">
                Digite seu e-mail e senha para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Senha</Label>
                    <Link
                      to="/forgot-password"
                      className="text-sm font-medium text-[var(--color-primary-600)] hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="remember" />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                  >
                    Lembrar de mim
                  </label>
                </div>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>


            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <div className="text-center text-sm text-slate-600">
                Não tem uma conta?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-[var(--color-primary-600)] hover:underline"
                >
                  Cadastre-se grátis
                </Link>
              </div>
              <Link
                to="/"
                className="flex items-center justify-center text-sm text-slate-500 hover:text-slate-900 group"
              >
                <ArrowLeft className="mr-1 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                Voltar para a página inicial
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}