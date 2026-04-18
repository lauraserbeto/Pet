import { motion } from "motion/react";
import { Dog, Cat, Bone, PawPrint, Search, ArrowLeft, Home } from "lucide-react";
import { Link, useNavigate } from "react-router";
import { Button } from "../components/ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center font-[family-name:var(--font-body)] overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute top-10 left-[10%]"
        >
          <Bone size={80} />
        </motion.div>
        <motion.div
          animate={{
            x: [0, -40, 0],
            y: [0, 60, 0],
            rotate: [0, -20, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 right-[15%]"
        >
          <PawPrint size={60} />
        </motion.div>
      </div>

      {/* Main Illustration Container */}
      <div className="relative mb-8 pt-10">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="relative z-10"
        >
          {/* Main Pet Icon Group */}
          <div className="relative flex items-center justify-center">
            <motion.div
              animate={{
                rotate: [0, -5, 5, 0],
                y: [0, -10, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="text-[var(--color-primary-500)]"
            >
              <Dog size={120} strokeWidth={1.5} />
            </motion.div>
            
            <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -top-4 -right-2 bg-white p-2 rounded-full shadow-lg border border-slate-100"
            >
                <Search size={32} className="text-slate-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* Animated Paw Prints Path */}
        <div className="flex gap-4 justify-center mt-6">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ 
                opacity: [0, 1, 0],
                scale: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.4,
                ease: "easeInOut",
              }}
              className="text-slate-200"
            >
              <PawPrint size={24} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Text Content */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="max-w-md w-full"
      >
        <h1 className="text-8xl font-black text-slate-200 mb-2 select-none font-[family-name:var(--font-display)]">
          404
        </h1>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 font-[family-name:var(--font-display)]">
          Ops! Essa página fugiu da coleira...
        </h2>
        <p className="text-slate-500 mb-10 leading-relaxed px-4">
          Parece que seu pet cavou no lugar errado e acabou em uma página que não existe. Não se preocupe, vamos te ajudar a voltar para o caminho certo!
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-center px-4">
          <Button
            size="lg"
            className="w-full sm:w-auto rounded-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white px-8 h-14 font-bold shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
            onClick={() => navigate("/")}
          >
            <Home className="mr-2 h-5 w-5" />
            Chamar o Pet de Volta
          </Button>
          
          <Button
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto rounded-full text-slate-500 hover:text-slate-900 h-14 px-8 font-semibold active:scale-95 transition-all"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Voltar de onde veio
          </Button>
        </div>
      </motion.div>

      {/* Decorative Bottom Cat */}
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ delay: 1, duration: 1, type: "spring" }}
        className="fixed -bottom-6 right-10 text-slate-200 hidden lg:block"
      >
        <Cat size={160} strokeWidth={1} />
      </motion.div>
    </div>
  );
}
