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
import { PawPrint, ArrowLeft, Eye, EyeOff, Mail, Lock, Star, ShieldCheck, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

import logo from "../../assets/pet+/logo2-branco.png";

import { authService } from "@/lib/services/authService";

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading]       = useState(false);
  const [email, setEmail]               = useState("");
  const [password, setPassword]         = useState("");
  const [rememberMe, setRememberMe]     = useState(false);
  const [error, setError]               = useState<string | null>(null);

  // Pré-preenche o e-mail se o usuário marcou "Lembrar de mim" antes
  useEffect(() => {
    const saved = localStorage.getItem("petplus_remember_email");
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await authService.login({ email, password });

      // Lembrar de mim: salva ou remove o e-mail
      if (rememberMe) {
        localStorage.setItem("petplus_remember_email", email);
      } else {
        localStorage.removeItem("petplus_remember_email");
      }

      toast.success("Login realizado com sucesso!", {
        description: "Redirecionando...",
      });

      const userRoleId = data.user.role_id;
      const onboardingStep = data.user.onboarding_step;
      const providerStatus = data.user.provider_status;

      if (userRoleId === 4 && onboardingStep !== "COMPLETED") {
        navigate("/onboarding/sitter");
      } else if ([2, 3].includes(userRoleId) && providerStatus === "PENDENTE") {
        toast.info("Conta em análise", {
          description: "Aguarde a aprovação do administrador para acessar o painel."
        });
        navigate("/");
      } else if ([1, 2, 3, 4].includes(userRoleId)) {
        navigate("/dashboard");
      } else {
        navigate("/");
      }

    } catch (err: any) {
      console.error("Login error:", err);
      
      if (err.status === 403 || err.message?.includes('análise')) {
        toast.info("Conta em análise", {
            description: "Sua conta está sendo avaliada pelo nosso time. Você receberá um e-mail em breve!",
            duration: 6000
        });
      } else {
        setError(err.message);
        toast.error("Erro ao entrar", {
            description: err.message,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // h-screen + overflow-hidden: tudo cabe na viewport sem scroll
    <div className="h-screen overflow-hidden flex font-[family-name:var(--font-body)]">

      {/* ── Painel esquerdo — Branding (apenas desktop) ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-shrink-0">
        {/* Overlay gradiente sobre a foto */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-700)]/90 via-[var(--color-primary-600)]/80 to-[var(--color-primary-800)]/95 z-10" />

        {/* Foto: cão em hospitalidade pet profissional */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1080&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8ZG9nJTIwaG90ZWwlMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzE3MDAwMDAwfDA&ixlib=rb-4.1.0&q=85&w=900"
          alt="Cão confortável em hotel pet profissional"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="relative z-20 flex flex-col justify-between p-12 text-white h-full">
          {/* Logo */}
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <ImageWithFallback src={logo} alt="Pet+ Logo" className="h-32 w-auto" />
          </Link>

          {/* Headline */}
          <div className="space-y-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 text-xs font-semibold mb-4 shadow">
                <Star className="h-3.5 w-3.5 text-yellow-300 fill-yellow-300" />
                Plataforma em lançamento — acesso antecipado
              </div>
              <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] leading-tight drop-shadow-md">
                Tudo que seu pet
                <br />
                precisa, em um
                <br />
                só lugar.
              </h2>
              <p className="mt-4 text-white/85 text-base max-w-xs leading-relaxed">
                Conectamos tutores a pet sitters, hotéis e cuidadores de confiança
                na sua região.
              </p>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="grid grid-cols-3 gap-3"
            >
              {[
                { icon: ShieldCheck, label: "Cadastro",   value: "Grátis" },
                { icon: Star,        label: "Acesso",     value: "Beta"   },
                { icon: Clock,       label: "Suporte",    value: "Online" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl p-3 text-center shadow"
                >
                  <stat.icon className="h-4 w-4 text-white/70 mx-auto mb-1" />
                  <p className="text-base font-extrabold font-[family-name:var(--font-display)] leading-none">{stat.value}</p>
                  <p className="text-[10px] text-white/60 mt-0.5 uppercase tracking-wide">{stat.label}</p>
                </div>
              ))}
            </motion.div>

            {/* Social proof avatars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2.5">
                {["bg-orange-300","bg-amber-400","bg-rose-300","bg-sky-300"].map((color, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-full ${color} border-2 border-white/40 flex items-center justify-center text-white text-xs font-bold shadow`}
                  >
                    {["A","M","R","J"][i]}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold drop-shadow">Primeiros usuários</p>
                <p className="text-xs text-white/65">fazem parte do acesso antecipado</p>
              </div>
            </motion.div>
          </div>

          <p className="text-xs text-white/40">© 2026 Pet+. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-8 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-sm space-y-5"
        >
          {/* Logo mobile */}
          <div className="flex flex-col items-center lg:hidden">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="bg-[var(--color-primary-500)] p-2 rounded-xl shadow-lg shadow-orange-200">
                <PawPrint className="h-7 w-7 text-white" />
              </div>
              <span className="text-2xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-display)]">
                Pet<span className="text-[var(--color-primary-500)]">+</span>
              </span>
            </Link>
          </div>

          <Card className="w-full border-slate-200 shadow-xl shadow-slate-200/60">
            <CardHeader className="space-y-0.5 pb-4 pt-6">
              <CardTitle className="text-xl font-extrabold text-center font-[family-name:var(--font-display)]">
                Bem-vindo de volta 
              </CardTitle>
              <CardDescription className="text-center text-sm">
                Acesse sua conta Pet+
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <form onSubmit={handleSignIn} className="space-y-3">
                {/* E-mail */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail</Label>
                  <div className="relative overflow-visible">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</Label>
                    <Link
                      to="/recuperar-senha"
                      className="text-xs font-medium text-[var(--color-primary-600)] hover:underline"
                    >
                      Esqueceu a senha?
                    </Link>
                  </div>
                  <div className="relative overflow-visible">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-9 pr-10 h-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Lembrar */}
                <div className="flex items-center space-x-2 pt-0.5">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(c) => setRememberMe(c === true)}
                  />
                  <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer select-none">
                    Lembrar de mim
                  </label>
                </div>

                {/* Erro */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg animate-in fade-in slide-in-from-top-1">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] h-10 font-semibold mt-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : "Entrar"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2 pb-5">
              <div className="text-center text-sm text-slate-600">
                Novo por aqui?{" "}
                <Link to="/register" className="font-semibold text-[var(--color-primary-600)] hover:underline">
                  Crie sua conta grátis
                </Link>
              </div>
              <Link
                to="/"
                className="flex items-center justify-center text-sm text-slate-400 hover:text-slate-700 group transition-colors"
              >
                <ArrowLeft className="mr-1 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                Voltar para o início
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}