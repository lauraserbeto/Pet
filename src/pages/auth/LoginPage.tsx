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

export function LoginPage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1200));

    toast.success("Login realizado com sucesso!", {
      description: "Redirecionando para o painel...",
    });

    setTimeout(() => {
      navigate("/dashboard");
    }, 600);
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
              <form onSubmit={handleLogin} className="space-y-4">
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

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">
                    Ou continue com
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="w-full h-11"
                  type="button"
                  onClick={() =>
                    toast.info("Login com Google em breve!", {
                      description:
                        "Estamos trabalhando nessa funcionalidade.",
                    })
                  }
                >
                  <svg
                    className="mr-2 h-4 w-4"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  type="button"
                  onClick={() =>
                    toast.info("Login com Facebook em breve!", {
                      description:
                        "Estamos trabalhando nessa funcionalidade.",
                    })
                  }
                >
                  <svg
                    className="mr-2 h-4 w-4 text-[#1877F2]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.148 0-2.797 1.603-2.797 4.16v1.972h5.003l-.699 3.667h-4.298V24l-4.926-.309z" />
                  </svg>
                  Facebook
                </Button>
              </div>
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