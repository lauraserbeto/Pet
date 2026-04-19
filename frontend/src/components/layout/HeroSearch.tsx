import { useState } from "react";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export function HeroSearch() {
  const [isFocused, setIsFocused] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="w-full max-w-2xl"
    >
      <div className="relative group p-1.5 rounded-2xl bg-white/40 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]">
        <div className="flex flex-col md:flex-row items-center bg-white rounded-xl overflow-hidden p-1 gap-1 md:divide-x md:divide-slate-100">
          {/* Service Input */}
          <div 
            className={`flex-1 flex items-center px-4 py-4 md:py-3 transition-all w-full ${
              isFocused === "service" ? "bg-orange-50/50" : "hover:bg-slate-50"
            }`}
          >
            <Search className={`h-5 w-5 mr-3 transition-colors shrink-0 ${
              isFocused === "service" ? "text-orange-500" : "text-slate-400"
            }`} />
            <input
              placeholder="Hotéis, serviços ou produtos..."
              className="w-full bg-transparent border-0 p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              onFocus={() => setIsFocused("service")}
              onBlur={() => setIsFocused(null)}
            />
          </div>

          {/* Location Input */}
          <div 
            className={`flex-1 flex items-center px-4 py-4 md:py-3 transition-all w-full ${
              isFocused === "location" ? "bg-orange-50/50" : "hover:bg-slate-50"
            }`}
          >
            <MapPin className={`h-5 w-5 mr-3 transition-colors shrink-0 ${
              isFocused === "location" ? "text-orange-500" : "text-slate-400"
            }`} />
            <input
              placeholder="Qual cidade ou bairro?"
              className="w-full bg-transparent border-0 p-0 text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:ring-0 focus:outline-none"
              onFocus={() => setIsFocused("location")}
              onBlur={() => setIsFocused(null)}
            />
          </div>

          {/* CTA Button */}
          <Button 
            className="w-full md:w-auto md:px-8 h-auto py-4 md:py-3.5 rounded-lg bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold group/btn shrink-0"
          >
            Pesquisar
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <ArrowRight className="ml-2 h-4 w-4" />
            </motion.div>
          </Button>
        </div>
      </div>

      {/* Quick filters / Popular */}
      <div className="mt-4 flex flex-wrap items-center gap-2 px-2">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mr-1">Sugestões:</span>
        {["Hotelaria", "Pet Sitter", "Banho", "Ração Premium"].map((tag) => (
          <button
            key={tag}
            className="text-xs font-semibold text-slate-500 hover:text-orange-600 hover:bg-orange-50 px-2.5 py-1 rounded-full border border-slate-200 hover:border-orange-200 transition-all"
          >
            {tag}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
