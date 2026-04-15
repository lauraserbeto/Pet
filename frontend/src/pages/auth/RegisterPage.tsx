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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  PawPrint,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Briefcase,
  Heart,
  Check,
  X,
  FileText,
  Users,
  Award,
  MapPin,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";
import logo from "../../assets/pet+/logo2-branco.png";

import { authService } from "@/lib/services/authService";

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const passwordChecks: PasswordCheck[] = [
  { label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Uma letra maiúscula",    test: (pw) => /[A-Z]/.test(pw) },
  { label: "Um número",              test: (pw) => /\d/.test(pw) },
];

// ── Máscaras ──
function maskCPF(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 11);
  return d.replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}
function maskCNPJ(value: string): string {
  const d = value.replace(/\D/g, "").slice(0, 14);
  return d.replace(/(\d{2})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1.$2")
          .replace(/(\d{3})(\d)/, "$1/$2")
          .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

// Lojista = 2, Hotel = 3 → CNPJ obrigatório
const CNPJ_ONLY_ROLES = ["2", "3"];

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword]           = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading]                 = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    type: "tutor" as "tutor" | "partner",
    partnerType: "",
    businessName: "",
    document: "",
    documentType: "CNPJ" as "CPF" | "CNPJ",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const isDocTypeLocked = CNPJ_ONLY_ROLES.includes(formData.partnerType);

  // Forçar CNPJ para Lojista / Hotel
  useEffect(() => {
    if (CNPJ_ONLY_ROLES.includes(formData.partnerType)) {
      setFormData((prev) => ({ ...prev, documentType: "CNPJ", document: "" }));
    }
  }, [formData.partnerType]);

  const maskedDocument = useMemo(() =>
    formData.documentType === "CPF"
      ? maskCPF(formData.document)
      : maskCNPJ(formData.document),
    [formData.document, formData.documentType]
  );

  const passwordStrength = useMemo(() => {
    return passwordChecks.filter((c) => c.test(formData.password)).length;
  }, [formData.password]);

  const strengthColor =
    passwordStrength === 0 ? "bg-slate-200"
    : passwordStrength === 1 ? "bg-red-400"
    : passwordStrength === 2 ? "bg-yellow-400"
    : "bg-emerald-400";

  const strengthLabel =
    passwordStrength === 0 ? ""
    : passwordStrength === 1 ? "Fraca"
    : passwordStrength === 2 ? "Média"
    : "Forte";

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const max = formData.documentType === "CPF" ? 11 : 14;
    setFormData({ ...formData, document: raw.slice(0, max) });
  };

  const handleDocumentTypeChange = (val: "CPF" | "CNPJ") => {
    setFormData({ ...formData, documentType: val, document: "" });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem", { description: "Verifique e tente novamente." });
      return;
    }
    if (passwordStrength < 3) {
      toast.error("Senha muito fraca", { description: "Atenda todos os requisitos." });
      return;
    }
    if (!acceptedTerms) {
      toast.error("Aceite os Termos de Uso para continuar.");
      return;
    }
    if (formData.type === "partner" && !formData.partnerType) {
      toast.error("Selecione o tipo de parceiro.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        email:         formData.email,
        password:      formData.password,
        full_name:     formData.name,
        role_id:       formData.type === "partner" ? parseInt(formData.partnerType) : 5,
        terms_accepted: true,
        ...(formData.type === "partner" && {
          business_name:  formData.businessName,
          document:       formData.document,
          document_type:  formData.documentType,
        }),
      };

      await authService.register(payload);

      toast.success(
        formData.type === "tutor" ? "Bem-vindo ao Pet+!" : "Cadastro realizado!",
        { description: formData.type === "tutor"
            ? "Conta criada. Faça login para continuar."
            : "Sua conta aguarda aprovação do administrador." }
      );
      navigate("/login");
    } catch (error: any) {
      toast.error("Erro ao criar conta", {
        description: error.message || "Verifique os dados e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const isPartner = formData.type === "partner";

  return (
    // h-screen + overflow-hidden: tudo cabe na viewport sem scroll
    <div className="h-screen overflow-hidden flex font-[family-name:var(--font-body)]">

      {/* ── Painel esquerdo — Branding ── */}
      <div className="hidden lg:flex lg:w-[42%] relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary-700)]/90 via-[var(--color-secondary-600)]/80 to-[var(--color-secondary-900)]/95 z-10" />

        {/* Foto: profissional de pet care com tutores */}
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1548199973-03cce0bbc87b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&h=1080&ixid=M3wxMjA3fDB8MXxzZWFyY2h8Mnx8cGV0JTIwY2FyZSUyMHByb2Zlc3Npb25hbHxlbnwxfHx8fDE3MTcwMDAwMDB8MA&ixlib=rb-4.1.0&q=85&w=840"
          alt="Profissional de pet care interagindo com pets felizes"
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
                <Award className="h-3.5 w-3.5 text-emerald-300" />
                Acesso antecipado — faça parte desde o início
              </div>
              <h2 className="text-4xl font-extrabold font-[family-name:var(--font-display)] leading-tight drop-shadow-md">
                Conectando tutores
                <br />
                e parceiros
                <br />
                com cuidado.
              </h2>
              <p className="mt-4 text-white/85 text-base max-w-xs leading-relaxed">
                Crie sua conta gratuitamente e contribua para construir a melhor
                plataforma pet do Brasil.
              </p>
            </motion.div>

            {/* Feature cards */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
              className="space-y-2.5"
            >
              {[
                { icon: Heart,   text: "Cadastro 100% gratuito para tutores" },
                { icon: Users,   text: "Em crescimento — seja um dos primeiros" },
                { icon: MapPin,  text: "Plataforma em fase de lançamento" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 py-3 shadow">
                  <div className="bg-white/15 rounded-lg p-1.5 shrink-0">
                    <item.icon className="h-4 w-4 text-white/90" />
                  </div>
                  <span className="text-base text-white/90">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          <p className="text-xs text-white/40">© 2026 Pet+. Todos os direitos reservados.</p>
        </div>
      </div>

      {/* ── Painel direito — Formulário ── */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-4 sm:px-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-lg py-4"
        >
          {/* Logo mobile */}
          <div className="flex flex-col items-center lg:hidden mb-4">
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
            <CardHeader className="space-y-0.5 pb-3 pt-5">
              <CardTitle className="text-xl font-extrabold text-center font-[family-name:var(--font-display)]">
                Crie sua conta 
              </CardTitle>
              <CardDescription className="text-center text-sm">
                Junte-se à comunidade Pet+ hoje mesmo
              </CardDescription>
            </CardHeader>

            <CardContent className="pb-2 px-5">
              <form onSubmit={handleRegister} className="space-y-3">

                {/* ─ Tipo de conta ─ */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: "tutor",   icon: Heart,    label: "Sou Tutor",    active: "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]",   iconActive: "text-[var(--color-primary-500)]" },
                    { val: "partner", icon: Briefcase, label: "Sou Parceiro", active: "border-[var(--color-secondary-500)] bg-[var(--color-secondary-50)] text-[var(--color-secondary-700)]", iconActive: "text-[var(--color-secondary-500)]" },
                  ].map((opt) => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: opt.val as any })}
                      className={`flex items-center justify-center gap-2 rounded-lg border-2 px-3 py-2.5 transition-all text-sm font-semibold ${
                        formData.type === opt.val ? opt.active : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <opt.icon className={`h-4 w-4 ${formData.type === opt.val ? opt.iconActive : "text-slate-400"}`} />
                      {opt.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.p key={formData.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="text-xs text-slate-500 text-center -mt-1">
                    {formData.type === "tutor"
                      ? "Encontre os melhores serviços para seu pet."
                      : "Cadastre-se e alcance mais clientes."}
                  </motion.p>
                </AnimatePresence>

                {/* ─ Nome Completo ─ */}
                <div className="space-y-1">
                  <Label htmlFor="name" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome Completo</Label>
                  <div className="relative overflow-visible">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input id="name" placeholder="Seu nome completo" required value={formData.name} onChange={handleChange} className="pl-9 h-9" />
                  </div>
                </div>

                {/* ─ Campos de Parceiro ─ */}
                {isPartner && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                  >
                    {/* Tipo de parceiro + Nome do negócio (2 colunas) */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo</Label>
                        <Select value={formData.partnerType} onValueChange={(val) => setFormData({ ...formData, partnerType: val })}>
                          <SelectTrigger id="partnerType" className="bg-white h-9 text-sm">
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2">Lojista</SelectItem>
                            <SelectItem value="3">Hotel</SelectItem>
                            <SelectItem value="4">Pet Sitter</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="businessName" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome do Negócio</Label>
                        <div className="relative overflow-visible">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                          <Input
                            id="businessName"
                            placeholder="Sua empresa"
                            required={isPartner}
                            value={formData.businessName}
                            onChange={handleChange}
                            className="pl-9 h-9 text-sm"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Documento */}
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Documento</Label>
                      <div className="flex gap-0 overflow-visible">
                        <Select value={formData.documentType} onValueChange={handleDocumentTypeChange} disabled={isDocTypeLocked}>
                          <SelectTrigger
                            id="documentTypeSelect"
                            className={`w-[88px] shrink-0 rounded-r-none border-r-0 bg-slate-100 font-semibold text-sm h-9 ${isDocTypeLocked ? "opacity-60 cursor-not-allowed" : ""}`}
                          >
                            <div className="flex items-center gap-1">
                              <FileText className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="CPF">CPF</SelectItem>
                            <SelectItem value="CNPJ">CNPJ</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          id="documentInput"
                          placeholder={formData.documentType === "CPF" ? "000.000.000-00" : "00.000.000/0000-00"}
                          required={isPartner}
                          value={maskedDocument}
                          onChange={handleDocumentChange}
                          className="rounded-l-none flex-1 h-9 text-sm"
                          inputMode="numeric"
                        />
                      </div>
                      {isDocTypeLocked && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-amber-600 flex items-center gap-1 mt-0.5">
                          <Lock className="h-3 w-3" />
                          Lojistas e Hotéis devem utilizar CNPJ.
                        </motion.p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* ─ E-mail — largura total ─ */}
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail</Label>
                  <div className="relative overflow-visible">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input id="email" type="email" placeholder="seu@email.com" required value={formData.email} onChange={handleChange} className="pl-9 h-9 text-sm" />
                  </div>
                </div>

                {/* ─ Senha + Confirmar Senha (2 colunas) ─ */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Senha */}
                  <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</Label>
                    <div className="relative overflow-visible">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Crie sua senha"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-9 pr-9 h-9 text-sm"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10">
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmar Senha */}
                  <div className="space-y-1">
                    <Label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Confirmar Senha</Label>
                    <div className="relative overflow-visible">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repita a senha"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className={`pl-9 pr-9 h-9 text-sm ${
                          formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword
                            ? "border-red-300"
                            : formData.confirmPassword.length > 0 && formData.password === formData.confirmPassword
                            ? "border-emerald-300"
                            : ""
                        }`}
                      />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10">
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-red-500">
                        Senhas não coincidem
                      </motion.p>
                    )}
                  </div>
                </div>

                {/* ─ Força da senha ─ */}
                {formData.password.length > 0 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div className={`h-full rounded-full ${strengthColor}`}
                          initial={{ width: 0 }} animate={{ width: `${(passwordStrength / 3) * 100}%` }} transition={{ duration: 0.3 }} />
                      </div>
                      <span className={`text-xs font-medium ${passwordStrength === 3 ? "text-emerald-600" : passwordStrength === 2 ? "text-yellow-600" : "text-red-500"}`}>
                        {strengthLabel}
                      </span>
                    </div>
                    <div className="flex gap-4">
                      {passwordChecks.map((check) => {
                        const ok = check.test(formData.password);
                        return (
                          <div key={check.label} className="flex items-center gap-1">
                            {ok ? <Check className="h-3 w-3 text-emerald-500 shrink-0" /> : <X className="h-3 w-3 text-slate-300 shrink-0" />}
                            <span className={`text-[10px] ${ok ? "text-emerald-600" : "text-slate-400"}`}>{check.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}



                {/* ─ Termos ─ */}
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" checked={acceptedTerms} onCheckedChange={(c) => setAcceptedTerms(c === true)} />
                  <label htmlFor="terms" className="text-xs text-slate-600 cursor-pointer leading-tight">
                    Li e concordo com os{" "}
                    <Link to="/terms" className="text-[var(--color-primary-600)] hover:underline font-medium">Termos de Uso</Link>
                    {" "}e{" "}
                    <Link to="/privacy" className="text-[var(--color-primary-600)] hover:underline font-medium">Política de Privacidade</Link>.
                  </label>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-10 font-semibold mt-1 ${
                    isPartner
                      ? "bg-[var(--color-secondary-500)] hover:bg-[var(--color-secondary-600)]"
                      : "bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)]"
                  }`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Criando conta...
                    </div>
                  ) : "Criar minha conta"}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col gap-2.5 pt-2 pb-4">
              <div className="text-center text-sm text-slate-600">
                Já tem uma conta?{" "}
                <Link to="/login" className="font-semibold text-[var(--color-primary-600)] hover:underline">
                  Entrar
                </Link>
              </div>
              <Link to="/" className="flex items-center justify-center text-sm text-slate-400 hover:text-slate-700 group transition-colors">
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
