import { motion } from "motion/react";
import { CreditCard as CardIcon } from "lucide-react";

interface CreditCardVisualProps {
  number: string;
  name: string;
  expiry: string;
  cvv: string;
  isFlipped?: boolean;
}

export function CreditCardVisual({ number, name, expiry, cvv, isFlipped = false }: CreditCardVisualProps) {
  const displayNum = number.padEnd(19, "•").replace(/(.{4})/g, "$1 ").trim();
  const displayName = name.toUpperCase() || "NOME IMPRESSO NO CARTÃO";
  const displayExpiry = expiry || "MM/AA";
  const displayCvv = cvv || "•••";

  return (
    <div className="w-full max-w-sm mx-auto" style={{ perspective: "1000px" }}>
      <motion.div
        className="w-full aspect-[1.586/1] relative"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Frente do Cartão */}
        <div 
          className="absolute inset-0 rounded-2xl p-6 text-white overflow-hidden shadow-xl"
          style={{ 
            background: "linear-gradient(135deg, var(--color-primary-600) 0%, var(--color-primary-800) 100%)",
            backfaceVisibility: "hidden"
          }}
        >
          {/* Decoração de fundo */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-black opacity-10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/4"></div>

          <div className="relative h-full flex flex-col justify-between z-10">
            <div className="flex justify-between items-start">
              <CardIcon className="h-8 w-8 text-white/80" />
              <div className="flex gap-1.5">
                <div className="w-8 h-8 rounded-full bg-white/20"></div>
                <div className="w-8 h-8 rounded-full bg-white/20 -ml-4 backdrop-blur-sm"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-xl sm:text-2xl font-mono tracking-widest text-white/90">
                {displayNum}
              </div>

              <div className="flex justify-between items-end">
                <div className="space-y-1 max-w-[70%]">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Titular</div>
                  <div className="font-medium text-sm truncate tracking-wide">
                    {displayName}
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold">Validade</div>
                  <div className="font-mono text-sm tracking-widest">{displayExpiry}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verso do Cartão */}
        <div 
          className="absolute inset-0 rounded-2xl overflow-hidden shadow-xl"
          style={{ 
            background: "linear-gradient(135deg, var(--color-primary-800) 0%, var(--color-primary-900) 100%)",
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden"
          }}
        >
          <div className="mt-6 h-12 w-full bg-black/80"></div>
          
          <div className="p-6">
            <div className="flex flex-col items-end">
              <div className="text-[10px] text-white/60 uppercase tracking-wider font-semibold mb-1 pr-2">CVV</div>
              <div className="bg-white text-slate-900 w-full h-10 rounded flex items-center justify-end px-3 font-mono text-sm">
                {displayCvv}
              </div>
            </div>
            
            <div className="mt-6 text-[8px] text-white/40 text-center px-4">
              Este cartão é de uso pessoal e intransferível. 
              Em caso de perda, comunique imediatamente a central de atendimento.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
