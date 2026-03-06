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
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";

interface PasswordCheck {
  label: string;
  test: (pw: string) => boolean;
}

const passwordChecks: PasswordCheck[] = [
  { label: "Mínimo de 8 caracteres", test: (pw) => pw.length >= 8 },
  { label: "Uma letra maiúscula", test: (pw) => /[A-Z]/.test(pw) },
  { label: "Um número", test: (pw) => /\d/.test(pw) },
];

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    type: "tutor" as "tutor" | "partner",
    partnerType: "",
    businessName: "",
    document: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const passwordStrength = useMemo(() => {
    const passed = passwordChecks.filter((c) => c.test(formData.password));
    return passed.length;
  }, [formData.password]);

  const strengthColor =
    passwordStrength === 0
      ? "bg-slate-200"
      : passwordStrength === 1
        ? "bg-red-400"
        : passwordStrength === 2
          ? "bg-yellow-400"
          : "bg-emerald-400";

  const strengthLabel =
    passwordStrength === 0
      ? ""
      : passwordStrength === 1
        ? "Fraca"
        : passwordStrength === 2
          ? "Média"
          : "Forte";

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error("As senhas não coincidem", {
        description: "Verifique e tente novamente.",
      });
      return;
    }

    if (passwordStrength < 3) {
      toast.error("Senha muito fraca", {
        description: "Sua senha precisa atender todos os requisitos.",
      });
      return;
    }

    if (!acceptedTerms) {
      toast.error("Termos obrigatórios", {
        description: "Você precisa aceitar os termos para continuar.",
      });
      return;
    }

    setIsLoading(true);

    try {
      const authOptions =
        formData.type === "partner"
          ? {
              data: {
                role_id: parseInt(formData.partnerType),
                full_name: formData.name,
                business_name: formData.businessName,
                document: formData.document,
              },
            }
          : {
              data: {
                role_id: 5,
                full_name: formData.name,
              },
            };

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: authOptions,
      });

      if (error) throw error;

      toast.success("Conta criada com sucesso!", {
        description:
          formData.type === "partner"
            ? "Sua conta foi criada. Aguarde a aprovação do administrador."
            : "Bem-vindo ao Pet+! Explore os melhores serviços.",
      });

      setTimeout(() => {
        navigate(formData.type === "partner" ? "/login" : "/");
      }, 600);
    } catch (error: any) {
      console.error("Register error:", error);
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

  return (
    <div className="min-h-screen flex font-[family-name:var(--font-body)]">
      {/* Left Side — Hero Image (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary-600)] to-[var(--color-secondary-800)] z-10 opacity-90" />
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1675266410211-a34b605a675d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYXBweSUyMGRvZyUyMGNhdCUyMHBldCUyMGNvbG9yZnVsfGVufDF8fHx8MTc3MTk1MDk3OXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Pets felizes"
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
                Faça parte da
                <br />
                maior comunidade
                <br />
                pet do Brasil.
              </h2>
              <p className="mt-4 text-white/80 max-w-sm">
                Seja tutor ou parceiro, crie sua conta e descubra uma nova forma
                de cuidar de quem você ama.
              </p>
            </motion.div>

            <div className="grid grid-cols-2 gap-4 max-w-sm">
              {[
                { icon: Heart, text: "Cuidados Premium" },
                { icon: Briefcase, text: "Parceiros Verificados" },
                { icon: PawPrint, text: "Serviços Exclusivos" },
                { icon: User, text: "Comunidade Ativa" },
              ].map((item, i) => (
                <motion.div
                  key={item.text}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2"
                >
                  <item.icon className="h-4 w-4 text-white/80" />
                  <span className="text-sm text-white/90">{item.text}</span>
                </motion.div>
              ))}
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
                Crie sua conta
              </CardTitle>
              <CardDescription className="text-center">
                Junte-se à comunidade Pet+ hoje mesmo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Account Type Selector */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "tutor" })
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-all ${
                      formData.type === "tutor"
                        ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Heart
                      className={`h-4 w-4 ${formData.type === "tutor" ? "text-[var(--color-primary-500)]" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-semibold">Sou Tutor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, type: "partner" })
                    }
                    className={`flex items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 transition-all ${
                      formData.type === "partner"
                        ? "border-[var(--color-secondary-500)] bg-[var(--color-secondary-50)] text-[var(--color-secondary-700)]"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    <Briefcase
                      className={`h-4 w-4 ${formData.type === "partner" ? "text-[var(--color-secondary-500)]" : "text-slate-400"}`}
                    />
                    <span className="text-sm font-semibold">Sou Parceiro</span>
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  <motion.p
                    key={formData.type}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-xs text-slate-500 text-center"
                  >
                    {formData.type === "tutor"
                      ? "Encontre os melhores serviços para seu pet."
                      : "Cadastre-se e alcance mais clientes com o Pet+."}
                  </motion.p>
                </AnimatePresence>

                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      placeholder="Seu nome completo"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                {formData.type === "partner" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="partnerType">Tipo de Parceiro</Label>
                      <Select
                        value={formData.partnerType}
                        onValueChange={(val) => setFormData({ ...formData, partnerType: val })}
                      >
                        <SelectTrigger id="partnerType" className="bg-white">
                          <SelectValue placeholder="Selecione o tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="2">Lojista</SelectItem>
                          <SelectItem value="3">Hotel</SelectItem>
                          <SelectItem value="4">Pet Sitter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessName">Nome do Negócio</Label>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="businessName"
                          placeholder="Nome da sua empresa ou negócio"
                          required={formData.type === "partner"}
                          value={formData.businessName}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document">CNPJ / CPF</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          id="document"
                          placeholder="Somente números"
                          required={formData.type === "partner"}
                          value={formData.document}
                          onChange={handleChange}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Crie uma senha forte"
                      required
                      value={formData.password}
                      onChange={handleChange}
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

                  {/* Password Strength */}
                  {formData.password.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full rounded-full ${strengthColor}`}
                            initial={{ width: 0 }}
                            animate={{
                              width: `${(passwordStrength / 3) * 100}%`,
                            }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength === 3
                              ? "text-emerald-600"
                              : passwordStrength === 2
                                ? "text-yellow-600"
                                : "text-red-500"
                          }`}
                        >
                          {strengthLabel}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {passwordChecks.map((check) => {
                          const passed = check.test(formData.password);
                          return (
                            <div
                              key={check.label}
                              className="flex items-center gap-1.5"
                            >
                              {passed ? (
                                <Check className="h-3 w-3 text-emerald-500" />
                              ) : (
                                <X className="h-3 w-3 text-slate-300" />
                              )}
                              <span
                                className={`text-xs ${passed ? "text-emerald-600" : "text-slate-400"}`}
                              >
                                {check.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Digite a senha novamente"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className={`pl-10 pr-10 ${
                        formData.confirmPassword.length > 0 &&
                        formData.password !== formData.confirmPassword
                          ? "border-red-300 focus-visible:ring-red-300"
                          : formData.confirmPassword.length > 0 &&
                              formData.password === formData.confirmPassword
                            ? "border-emerald-300 focus-visible:ring-emerald-300"
                            : ""
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {formData.confirmPassword.length > 0 &&
                    formData.password !== formData.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-red-500"
                      >
                        As senhas não coincidem
                      </motion.p>
                    )}
                </div>

                <div className="flex items-start space-x-2 pt-2">
                  <Checkbox
                    id="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(checked) =>
                      setAcceptedTerms(checked === true)
                    }
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-tight text-slate-600 cursor-pointer"
                  >
                    Li e concordo com os{" "}
                    <Link
                      to="/terms"
                      className="text-[var(--color-primary-600)] hover:underline"
                    >
                      Termos de Uso
                    </Link>{" "}
                    e{" "}
                    <Link
                      to="/privacy"
                      className="text-[var(--color-primary-600)] hover:underline"
                    >
                      Política de Privacidade
                    </Link>
                    .
                  </label>
                </div>

                <Button
                  type="submit"
                  className={`w-full h-11 mt-2 ${
                    formData.type === "partner"
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
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 pt-2">
              <div className="text-center text-sm text-slate-600">
                Já tem uma conta?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-[var(--color-primary-600)] hover:underline"
                >
                  Entrar
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
