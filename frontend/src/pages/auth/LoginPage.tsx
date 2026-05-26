import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
import {
  PawPrint,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  Star,
  ShieldCheck,
  Clock,
  Bone,
  Heart,
  Sparkles,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

import iconTransparente from "../../assets/pet+/logo-horizontal.png";
import heroCarePets from "../../assets/imgs/hero_care_pets.png";

import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
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
      // login() do AuthContext faz POST /auth/login, grava token e sincroniza
      // o estado React — evita a dessincronização que forçava F5 para
      // ProtectedRoute reconhecer a sessão.
      const user = await login({ email, password });

      // Lembrar de mim: salva ou remove o e-mail
      if (rememberMe) {
        localStorage.setItem("petplus_remember_email", email);
      } else {
        localStorage.removeItem("petplus_remember_email");
      }

      toast.success("Login realizado com sucesso!", {
        description: "Redirecionando...",
      });

      const userRoleId = user.role_id;
      const onboardingStep = user.onboarding_step;
      const providerStatus = user.provider_status;

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center font-[family-name:var(--font-body)]">

      {/* ── Animated Background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FFF8EB] via-[#FFF1D6] to-[#FFE8C2]" />
      
      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 20% 80%, rgba(245,139,5,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 80% 20%, rgba(54,153,210,0.08) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(245,139,5,0.06) 0%, transparent 60%)
          `
        }}
      />

      {/* Dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#d4a373_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-[0.08] pointer-events-none" />

      {/* ── Floating Organic Blobs ── */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0], x: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute -top-24 -left-24 w-[400px] h-[400px] bg-[var(--color-primary-200)]/30 blur-3xl pointer-events-none"
        style={{ borderRadius: "60% 40% 50% 50% / 40% 60% 40% 60%" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -6, 0], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-[var(--color-secondary-200)]/20 blur-3xl pointer-events-none"
        style={{ borderRadius: "40% 60% 30% 70% / 50% 40% 60% 50%" }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute top-1/3 -right-16 w-[250px] h-[250px] bg-[var(--color-primary-300)]/15 blur-2xl pointer-events-none"
        style={{ borderRadius: "50% 50% 40% 60% / 60% 40% 50% 50%" }}
      />

      {/* ── Floating Decorative Icons ── */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [15, 22, 15] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-[8%] left-[8%] text-[var(--color-primary-300)]/40 pointer-events-none hidden md:block"
      >
        <PawPrint className="h-10 w-10" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [-10, -5, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-[15%] right-[12%] text-[var(--color-primary-400)]/25 pointer-events-none hidden md:block"
      >
        <PawPrint className="h-8 w-8" />
      </motion.div>
      <motion.div
        animate={{ rotate: [-25, -18, -25] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute bottom-[18%] left-[6%] text-[var(--color-primary-300)]/30 pointer-events-none hidden md:block"
      >
        <Bone className="h-14 w-14" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute bottom-[12%] right-[8%] text-rose-300/30 pointer-events-none hidden md:block"
      >
        <Heart className="h-8 w-8" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
        className="absolute top-[60%] left-[3%] text-amber-300/25 pointer-events-none hidden lg:block"
      >
        <Star className="h-7 w-7" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 6, 0], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
        className="absolute top-[5%] right-[35%] text-[var(--color-primary-200)]/35 pointer-events-none hidden lg:block"
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>

      {/* ── Hero pet image (desktop only, bottom-left) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        className="absolute bottom-0 left-0 w-[320px] h-[320px] xl:w-[420px] xl:h-[420px] pointer-events-none hidden lg:block"
      >
        <div className="relative w-full h-full">
          {/* Yellow blob behind pet */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [0, 3, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute bottom-4 left-4 w-[85%] h-[85%] bg-[var(--color-primary-200)]/40"
            style={{ borderRadius: "60% 40% 55% 45% / 45% 55% 45% 55%" }}
          />
          <img
            src={heroCarePets}
            alt="Pet feliz"
            className="relative w-full h-full object-contain z-10"
            style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.1))" }}
          />
        </div>
      </motion.div>

      {/* ── Main Content ── */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-md px-4 sm:px-6 py-8">

        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-6"
        >
          <Link to="/" className="flex items-center gap-3 group">
            <ImageWithFallback
              src={iconTransparente}
              alt="Pet+ Icon"
              className="h-24 transition-transform group-hover:scale-105"
            />
          </Link>
        </motion.div>

        {/* ── Glassmorphism Card ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full"
        >
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(245,139,5,0.08),0_2px_12px_rgba(0,0,0,0.04)] p-6 sm:p-8">
            
            {/* Subtle glow accent */}
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary-400)] to-transparent rounded-full" />

            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Acesse sua conta Pet+ e cuide do seu melhor amigo
              </p>
            </div>

            <form onSubmit={handleSignIn} className="space-y-4">
              {/* E-mail */}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail</Label>
                <div className="relative overflow-visible">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-white/80 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[var(--color-primary-300)] focus:border-[var(--color-primary-400)] transition-all"
                  />
                </div>
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</Label>
                  <Link
                    to="/recuperar-senha"
                    className="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:underline transition-colors"
                  >
                    Esqueceu a senha?
                  </Link>
                </div>
                <div className="relative overflow-visible">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 bg-white/80 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[var(--color-primary-300)] focus:border-[var(--color-primary-400)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Lembrar */}
              <div className="flex items-center space-x-2">
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
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50/80 backdrop-blur-sm border border-red-200 text-red-600 text-sm p-3 rounded-xl"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary-700)] h-11 font-bold rounded-xl shadow-lg shadow-orange-200/50 transition-all hover:shadow-xl hover:shadow-orange-200/60 hover:scale-[1.01] active:scale-[0.99] text-base"
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-200/80" />
              <span className="text-xs text-slate-400 font-medium">ou</span>
              <div className="flex-1 h-px bg-slate-200/80" />
            </div>

            {/* Footer links */}
            <div className="space-y-3">
              <div className="text-center text-sm text-slate-600">
                Novo por aqui?{" "}
                <Link to="/register" className="font-bold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:underline transition-colors">
                  Crie sua conta grátis
                </Link>
              </div>
              <Link
                to="/"
                className="flex items-center justify-center text-sm text-slate-400 hover:text-slate-700 group transition-colors"
              >
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Voltar para o início
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Copyright */}
        <p className="text-[10px] text-slate-400/60 mt-4">
          © 2026 Pet+. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}