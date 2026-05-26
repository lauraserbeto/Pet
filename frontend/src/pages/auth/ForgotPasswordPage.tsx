import { Link, useNavigate } from "react-router";
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
import { PawPrint, ArrowLeft, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { authService } from "@/lib/services/authService";
import logo from "../../assets/pet+/logo-horizontal.png";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

type Status = "idle" | "loading" | "success" | "error";

export function ForgotPasswordPage() {
  const [email, setEmail]   = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const data = await authService.forgotPassword(email.trim().toLowerCase());
      setStatus("success");
      setMessage(data.message || "Se esse e-mail estiver cadastrado, você receberá as instruções.");
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "Erro ao processar a solicitação.");
      toast.error("Erro", { description: err.message });
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
              Sem problema,
              <br />
              esquece
              <br />
              acontece.
            </h2>
            <p className="text-white/85 text-base max-w-xs leading-relaxed">
              Informe seu e-mail e enviaremos um link seguro para você criar uma nova senha.
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
                Recuperar senha
              </CardTitle>
              <CardDescription className="text-center text-sm">
                Enviaremos um link para o seu e-mail
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-2">
              <AnimatePresence mode="wait">
                {status === "success" ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-4 py-4 text-center"
                  >
                    <div className="bg-emerald-50 rounded-full p-3">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Verifique seu e-mail</p>
                      <p className="text-sm text-slate-500 mt-1">{message}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        Durante o desenvolvimento, o link é exibido no console do servidor.
                      </p>
                    </div>
                    <Link
                      to="/login"
                      className="text-sm font-semibold text-[var(--color-primary-600)] hover:underline"
                    >
                      Voltar para o login
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
                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                        E-mail cadastrado
                      </Label>
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

                    {status === "error" && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        {message}
                      </motion.div>
                    )}

                    <Button
                      type="submit"
                      className="w-full bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] h-10 font-semibold"
                      disabled={status === "loading"}
                    >
                      {status === "loading" ? (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Enviando...
                        </div>
                      ) : "Enviar link de recuperação"}
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
