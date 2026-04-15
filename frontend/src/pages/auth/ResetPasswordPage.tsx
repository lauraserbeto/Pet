import { Link, useNavigate, useSearchParams } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { PawPrint, ArrowLeft, Eye, EyeOff, Lock, CheckCircle2, AlertCircle, X, Check } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { authService } from "@/lib/services/authService";
import logo from "../../assets/pet+/logo2-branco.png";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const passwordChecks: PasswordCheck[] = [
  { label: "Mínimo 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Uma letra maiúscula",  test: (pw) => /[A-Z]/.test(pw) },
  { label: "Um número",            test: (pw) => /\d/.test(pw) },
];

type Status = "idle" | "loading" | "success" | "error";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword]               = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirm, setShowConfirm]         = useState(false);
  const [status, setStatus]                   = useState<Status>("idle");
  const [errorMsg, setErrorMsg]               = useState("");

  const strength = useMemo(
    () => passwordChecks.filter((c) => c.test(password)).length,
    [password]
  );

  const strengthColor =
    strength === 0 ? "bg-slate-200"
    : strength === 1 ? "bg-red-400"
    : strength === 2 ? "bg-yellow-400"
    : "bg-emerald-400";

  const strengthLabel =
    strength === 0 ? "" : strength === 1 ? "Fraca" : strength === 2 ? "Média" : "Forte";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Link inválido. Solicite um novo link de recuperação.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("As senhas não coincidem.");
      return;
    }
    if (strength < 3) {
      setErrorMsg("Sua senha não atende aos requisitos mínimos.");
      return;
    }

    setStatus("loading");
    try {
      await authService.resetPassword(token, password);
      setStatus("success");
      toast.success("Senha redefinida com sucesso!");
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Erro ao redefinir a senha.");
      toast.error("Falha ao redefinir", { description: err.message });
    }
  };

  return (
    <div className="h-screen overflow-hidden flex font-[family-name:var(--font-body)]">

      {/* ── Painel esquerdo — Branding ── */}
      <div className="hidden lg:flex lg:w-[45%] relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-700)]/90 via-[var(--color-primary-600)]/80 to-[var(--color-primary-800)]/95 z-10" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1080&w=900&q=85"
          alt="Pet confortável"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="relative z-20 flex flex-col justify-between p-12 text-white h-full">
          <Link to="/" className="flex flex-shrink-0 items-center gap-2">
            <ImageWithFallback src={logo} alt="Pet+ Logo" className="h-32 w-auto" />
          </Link>
          <div className="space-y-4">
            <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] leading-tight drop-shadow-md">
              Quase lá!
              <br />
              Crie sua
              <br />
              nova senha.
            </h2>
            <p className="text-white/85 text-base max-w-xs leading-relaxed">
              Escolha uma senha forte para proteger sua conta Pet+. O link tem validade de 1 hora.
            </p>
          </div>
          <p className="text-xs text-white/40">© 2026 Pet+. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
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
                Nova senha
              </CardTitle>
              <CardDescription className="text-center text-sm">
                Defina uma nova senha para sua conta
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-6 text-center"
                  >
                    <div className="bg-emerald-50 rounded-full p-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Senha atualizada!</p>
                      <p className="text-sm text-slate-500 mt-1">
                        Você será redirecionado para o login em instantes.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-[var(--color-primary-600)] hover:underline"
                    >
                      Ir para o login agora
                    </Link>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                  >
                    {/* Token ausente */}
                    {!token && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm p-3 rounded-lg">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        Link inválido ou expirado. Solicite um novo.
                      </div>
                    )}

                    {/* Nova senha */}
                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Nova Senha
                      </Label>
                      <div className="relative overflow-visible">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Crie sua nova senha"
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

                    {/* Força da senha */}
                    {password.length > 0 && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full rounded-full ${strengthColor}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${(strength / 3) * 100}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                          <span className={`text-xs font-medium ${strength === 3 ? "text-emerald-600" : strength === 2 ? "text-yellow-600" : "text-red-500"}`}>
                            {strengthLabel}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {passwordChecks.map((check) => {
                            const ok = check.test(password);
                            return (
                              <div key={check.label} className="flex items-center gap-2">
                                {ok
                                  ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                                  : <X className="h-3 w-3 text-slate-300 shrink-0" />
                                }
                                <span className={`text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
                                  {check.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}

                    {/* Confirmar senha */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        Confirmar Senha
                      </Label>
                      <div className="relative overflow-visible">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <Input
                          id="confirmPassword"
                          type={showConfirm ? "text" : "password"}
                          placeholder="Repita a nova senha"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`pl-9 pr-10 h-10 ${
                            confirmPassword.length > 0 && password !== confirmPassword
                              ? "border-red-300"
                              : confirmPassword.length > 0 && password === confirmPassword
                              ? "border-emerald-300"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm(!showConfirm)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
                        >
                          {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {confirmPassword.length > 0 && password !== confirmPassword && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500">
                          As senhas não coincidem
                        </motion.p>
                      )}
                    </div>

                    {/* Erro geral */}
                    {status === "error" && errorMsg && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {errorMsg}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] h-10 font-semibold"
                      disabled={status === "loading" || !token}
                    >
                      {status === "loading" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Salvando...
                        </div>
                      ) : "Salvar nova senha"}
                    </Button>
                  </motion.form>
                )}
              </AnimatePresence>
            </CardContent>

            <CardFooter className="flex flex-col gap-2 pt-2 pb-5">
              <Link
                to="/login"
                className="flex items-center justify-center text-sm text-slate-400 hover:text-slate-700 group transition-colors"
              >
                <ArrowLeft className="mr-1 h-3 w-3 group-hover:-translate-x-1 transition-transform" />
                Voltar para o login
              </Link>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
