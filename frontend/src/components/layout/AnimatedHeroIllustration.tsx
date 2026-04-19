import { motion } from "motion/react";
import { Star, Bone, PawPrint, Heart } from "lucide-react";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

export function AnimatedHeroIllustration() {
  return (
    <div className="relative w-full h-[400px] md:h-[600px] flex items-center justify-center">
      {/* Background Blobs */}
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 5, 0],
          x: [0, 10, 0]
        }}
        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-orange-100/50 rounded-[40%_60%_70%_30%_/_40%_50%_60%_50%] blur-3xl -z-10"
      />
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          rotate: [0, -10, 0],
          x: [0, -20, 0]
        }}
        transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-teal-50/50 rounded-[60%_40%_30%_70%_/_50%_60%_40%_60%] blur-3xl -z-10"
      />

      {/* Main Illustration Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full h-full max-w-md md:max-w-xl flex items-center justify-center"
      >
        <div className="relative w-full aspect-square overflow-hidden rounded-full bg-gradient-to-br from-orange-50/50 to-teal-50/30 flex items-center justify-center p-8 border border-white/50 shadow-inner">
          <img
            src="/hero_isolated.png"
            alt="Premium Pet Care Illustration"
            className="w-full h-full object-contain mix-blend-multiply"
          />
        </div>
      </motion.div>

      

      {/* Decorative Icons */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className="absolute top-1/4 -left-10 text-orange-200"
      >
        <Bone size={40} className="opacity-50" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, -10, 0] }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 -right-10 text-teal-200"
      >
        <PawPrint size={48} className="opacity-50" />
      </motion.div>

      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="absolute top-1/2 -right-8 text-rose-300"
      >
        <Heart size={32} className="opacity-40" />
      </motion.div>
    </div>
  );
}
