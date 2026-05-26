import { Link, useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Checkbox } from "../../components/ui/checkbox";
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
  MapPin,
  Bone,
  Star,
  Sparkles,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

import iconTransparente from "../../assets/pet+/logo-horizontal.png";
import heroShopDog from "../../assets/imgs/hero_shop_dog.png";

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
    <div className="relative min-h-screen w-full overflow-hidden flex items-center justify-center font-[family-name:var(--font-body)]">

      {/* ── Animated Background ── */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EBF5FF] via-[#F0F7FB] to-[#E6F2ED]" />

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 80% 80%, rgba(54,153,210,0.10) 0%, transparent 60%),
            radial-gradient(ellipse 60% 60% at 20% 20%, rgba(245,139,5,0.07) 0%, transparent 50%),
            radial-gradient(ellipse 50% 40% at 50% 50%, rgba(54,153,210,0.05) 0%, transparent 60%)
          `
        }}
      />

      {/* Dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#93d4eb_0.8px,transparent_0.8px)] [background-size:28px_28px] opacity-[0.07] pointer-events-none" />

      {/* ── Floating Organic Blobs ── */}
      <motion.div
        animate={{ scale: [1, 1.15, 1], rotate: [0, 8, 0], x: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-[400px] h-[400px] bg-[var(--color-secondary-200)]/25 blur-3xl pointer-events-none"
        style={{ borderRadius: "60% 40% 50% 50% / 40% 60% 40% 60%" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], rotate: [0, -6, 0], x: [0, -20, 0] }}
        transition={{ repeat: Infinity, duration: 14, ease: "easeInOut" }}
        className="absolute -bottom-32 -left-32 w-[500px] h-[500px] bg-[var(--color-primary-200)]/18 blur-3xl pointer-events-none"
        style={{ borderRadius: "40% 60% 30% 70% / 50% 40% 60% 50%" }}
      />
      <motion.div
        animate={{ scale: [1, 1.1, 1], y: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        className="absolute top-1/3 -left-16 w-[250px] h-[250px] bg-[var(--color-secondary-300)]/12 blur-2xl pointer-events-none"
        style={{ borderRadius: "50% 50% 40% 60% / 60% 40% 50% 50%" }}
      />

      {/* ── Floating Decorative Icons ── */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [15, 22, 15] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
        className="absolute top-[8%] right-[8%] text-[var(--color-secondary-300)]/35 pointer-events-none hidden md:block"
      >
        <PawPrint className="h-10 w-10" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 10, 0], rotate: [-10, -5, -10] }}
        transition={{ repeat: Infinity, duration: 6, ease: "easeInOut", delay: 0.5 }}
        className="absolute top-[15%] left-[12%] text-[var(--color-primary-400)]/20 pointer-events-none hidden md:block"
      >
        <PawPrint className="h-8 w-8" />
      </motion.div>
      <motion.div
        animate={{ rotate: [-25, -18, -25] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className="absolute bottom-[18%] right-[6%] text-[var(--color-secondary-300)]/25 pointer-events-none hidden md:block"
      >
        <Bone className="h-14 w-14" />
      </motion.div>
      <motion.div
        animate={{ scale: [1, 1.25, 1] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute bottom-[12%] left-[8%] text-rose-300/25 pointer-events-none hidden md:block"
      >
        <Heart className="h-8 w-8" />
      </motion.div>
      <motion.div
        animate={{ y: [0, -8, 0], rotate: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 7, ease: "easeInOut", delay: 1 }}
        className="absolute top-[60%] right-[3%] text-amber-300/20 pointer-events-none hidden lg:block"
      >
        <Star className="h-7 w-7" />
      </motion.div>
      <motion.div
        animate={{ y: [0, 6, 0], scale: [1, 1.15, 1] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 2 }}
        className="absolute top-[5%] left-[35%] text-[var(--color-secondary-200)]/30 pointer-events-none hidden lg:block"
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>

      {/* ── Hero pet image (desktop only, bottom-right) ── */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.4 }}
        className="absolute bottom-0 right-0 w-[300px] h-[300px] xl:w-[380px] xl:h-[380px] pointer-events-none hidden lg:block"
      >
        <div className="relative w-full h-full">
          {/* Blue blob behind pet */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], rotate: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
            className="absolute bottom-4 right-4 w-[85%] h-[85%] bg-[var(--color-secondary-200)]/35"
            style={{ borderRadius: "40% 60% 45% 55% / 55% 45% 55% 45%" }}
          />
          <img
            src={heroShopDog}
            alt="Pet feliz"
            className="relative w-full h-full object-contain z-10"
            style={{ filter: "drop-shadow(0 10px 25px rgba(0,0,0,0.1))" }}
          />
        </div>
      </motion.div>

      {/* ── Main Content ── */}
      <div className={`relative z-10 flex flex-col items-center w-full ${isPartner ? "max-w-2xl" : "max-w-lg"} px-4 sm:px-6 py-6 transition-all duration-300`}>

        {/* Logo + Brand */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center mb-4"
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
          <div className="relative bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_8px_40px_rgba(54,153,210,0.07),0_2px_12px_rgba(0,0,0,0.04)] p-5 sm:p-7">

            {/* Subtle glow accent */}
            <div className="absolute -top-px left-1/2 -translate-x-1/2 w-32 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-secondary-400)] to-transparent rounded-full" />

            <div className="text-center mb-5">
              <h1 className="text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                Crie sua conta 
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Junte-se à comunidade Pet+ hoje mesmo
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-3">

              {/* ─ Tipo de conta ─ */}
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    val: "tutor",
                    icon: Heart,
                    label: "Sou Tutor",
                    activeBg: "bg-gradient-to-br from-[var(--color-primary-50)] to-[var(--color-primary-100)]/60",
                    activeBorder: "border-[var(--color-primary-400)]",
                    activeText: "text-[var(--color-primary-700)]",
                    iconActive: "text-[var(--color-primary-500)]",
                  },
                  {
                    val: "partner",
                    icon: Briefcase,
                    label: "Sou Parceiro",
                    activeBg: "bg-gradient-to-br from-[var(--color-secondary-50)] to-[var(--color-secondary-100)]/60",
                    activeBorder: "border-[var(--color-secondary-400)]",
                    activeText: "text-[var(--color-secondary-700)]",
                    iconActive: "text-[var(--color-secondary-500)]",
                  },
                ].map((opt) => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: opt.val as any })}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 transition-all text-sm font-semibold ${
                      formData.type === opt.val
                        ? `${opt.activeBorder} ${opt.activeBg} ${opt.activeText} shadow-sm`
                        : "border-slate-200/80 bg-white/60 text-slate-500 hover:border-slate-300 hover:bg-white/80"
                    }`}
                  >
                    <opt.icon className={`h-4 w-4 ${formData.type === opt.val ? opt.iconActive : "text-slate-400"}`} />
                    {opt.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.p key={formData.type} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="text-xs text-slate-500 text-center -mt-0.5">
                  {formData.type === "tutor"
                    ? "Encontre os melhores serviços para seu pet."
                    : "Cadastre-se e alcance mais clientes."}
                </motion.p>
              </AnimatePresence>

              {/* ─ Nome Completo ─ */}
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Nome Completo</Label>
                <div className="relative overflow-visible">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                  <Input id="name" placeholder="Seu nome completo" required value={formData.name} onChange={handleChange} className="pl-10 h-10 bg-white/80 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[var(--color-secondary-200)] focus:border-[var(--color-secondary-400)] transition-all" />
                </div>
              </div>

              {/* ─ Campos de Parceiro ─ */}
              {isPartner ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-3 overflow-hidden"
                >
                  {/* Tipo de parceiro + Nome do negócio (2 colunas) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Tipo</Label>
                      <Select value={formData.partnerType} onValueChange={(val) => setFormData({ ...formData, partnerType: val })}>
                        <SelectTrigger id="partnerType" className="bg-white/80 h-10 text-sm rounded-xl border-slate-200/80">
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
                        <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <Input
                          id="businessName"
                          placeholder="Sua empresa"
                          required={isPartner}
                          value={formData.businessName}
                          onChange={handleChange}
                          className="pl-10 h-10 text-sm bg-white/80 border-slate-200/80 rounded-xl"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Documento + E-mail (2 colunas) */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Documento</Label>
                      <div className="flex gap-0 overflow-visible">
                        <Select value={formData.documentType} onValueChange={handleDocumentTypeChange} disabled={isDocTypeLocked}>
                          <SelectTrigger
                            id="documentTypeSelect"
                            className={`w-28 shrink-0 rounded-r-none border-r-0 bg-slate-50/80 font-semibold text-sm h-10 rounded-l-xl ${isDocTypeLocked ? "opacity-60 cursor-not-allowed" : ""}`}
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
                          className="rounded-l-none rounded-r-xl flex-1 h-10 text-sm bg-white/80 border-slate-200/80"
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

                    <div className="space-y-1">
                      <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail</Label>
                      <div className="relative overflow-visible">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                        <Input id="email" type="email" placeholder="seu@email.com" required value={formData.email} onChange={handleChange} className="pl-10 h-10 text-sm bg-white/80 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[var(--color-secondary-200)] focus:border-[var(--color-secondary-400)] transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* ─ E-mail — largura total para Tutor ─ */
                <div className="space-y-1">
                  <Label htmlFor="email" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">E-mail</Label>
                  <div className="relative overflow-visible">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input id="email" type="email" placeholder="seu@email.com" required value={formData.email} onChange={handleChange} className="pl-10 h-10 text-sm bg-white/80 border-slate-200/80 rounded-xl focus:ring-2 focus:ring-[var(--color-secondary-200)] focus:border-[var(--color-secondary-400)] transition-all" />
                  </div>
                </div>
              )}

              {/* ─ Senha + Confirmar Senha (2 colunas) ─ */}
              <div className="grid grid-cols-2 gap-2">
                {/* Senha */}
                <div className="space-y-1">
                  <Label htmlFor="password" className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Senha</Label>
                  <div className="relative overflow-visible">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Crie sua senha"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-10 pr-9 h-10 text-sm bg-white/80 border-slate-200/80 rounded-xl"
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
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none z-10" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repita a senha"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 pr-9 h-10 text-sm bg-white/80 border-slate-200/80 rounded-xl ${
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
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div className={`h-full rounded-full ${strengthColor}`}
                        initial={{ width: 0 }} animate={{ width: `${(passwordStrength / 3) * 100}%` }} transition={{ duration: 0.3 }} />
                    </div>
                    <span className={`text-xs font-semibold ${passwordStrength === 3 ? "text-emerald-600" : passwordStrength === 2 ? "text-yellow-600" : "text-red-500"}`}>
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
              <div className="flex items-start space-x-2 pt-0.5">
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
                className={`w-full h-11 font-bold rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] text-base mt-1 ${
                  isPartner
                    ? "bg-gradient-to-r from-[var(--color-secondary-500)] to-[var(--color-secondary-600)] hover:from-[var(--color-secondary-600)] hover:to-[var(--color-secondary-700)] shadow-sky-200/40 hover:shadow-sky-200/60"
                    : "bg-gradient-to-r from-[var(--color-primary-500)] to-[var(--color-primary-600)] hover:from-[var(--color-primary-600)] hover:to-[var(--color-primary-700)] shadow-orange-200/50 hover:shadow-orange-200/60"
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

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-slate-200/80" />
              <span className="text-xs text-slate-400 font-medium">ou</span>
              <div className="flex-1 h-px bg-slate-200/80" />
            </div>

            {/* Footer links */}
            <div className="space-y-2.5">
              <div className="text-center text-sm text-slate-600">
                Já tem uma conta?{" "}
                <Link to="/login" className="font-bold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] hover:underline transition-colors">
                  Entrar
                </Link>
              </div>
              <Link to="/" className="flex items-center justify-center text-sm text-slate-400 hover:text-slate-700 group transition-colors">
                <ArrowLeft className="mr-1.5 h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
                Voltar para o início
              </Link>
            </div>
          </div>
        </motion.div>


        {/* Copyright */}
        <p className="text-[10px] text-slate-400/60 mt-3">
          © 2026 Pet+. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
