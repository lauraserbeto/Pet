import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { providerService } from "../lib/services/providerService";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MapPin, Phone, Star, ShieldCheck, ShoppingBag, ArrowLeft } from "lucide-react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion } from "motion/react";

export function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    providerService.fetchProviderDetails(id)
      .then((data) => {
        setStore({
          id: data.id,
          name: data.business_name || data.user.full_name,
          rating: 4.9, // Mock
          reviews: 120, // Mock
          description: data.description || "Bem-vindo à nossa loja!",
          image: data.user.avatar_url || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
          coverImage: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=1200",
          address: data.address_line || "Endereço não informado",
          city: data.city || "Cidade não informada",
          state: data.state || "UF",
          phone: data.phone || "Não informado",
          verified: data.status === 'APROVADO',
          products: data.products || []
        });
        setLoading(false);
      })
      .catch((error) => {
        console.error("Erro ao carregar loja:", error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-display)] text-[var(--color-primary-600)]">Carregando loja...</div>;
  }

  if (!store) {
    return <div className="min-h-screen flex items-center justify-center font-[family-name:var(--font-display)]">Loja não encontrada.</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 sm:pb-28 font-[family-name:var(--font-body)]">
      {/* Native Tailwind Banner with playful pattern */}
      <div className="relative h-[200px] sm:h-[260px] w-full bg-gradient-to-r from-orange-400 to-orange-500 overflow-hidden">
        {/* Subtle dot pattern using CSS radial-gradient logic inline */}
        <div className="absolute inset-0 opacity-[0.15]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 2px, transparent 0)', backgroundSize: '30px 30px' }} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
        
        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-10">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 shadow-sm h-10 w-10 transition-transform hover:scale-105"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
      </div>

      {/* Profile Card - Elevated */}
      <div className="container mx-auto max-w-5xl px-4 sm:px-6 relative z-10 -mt-20">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.4 }}
           className="bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 p-6 sm:p-8"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="shrink-0 -mt-16 sm:-mt-20 relative">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-white ring-1 ring-slate-100">
                <ImageWithFallback
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {store.verified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                  <ShieldCheck className="h-6 w-6 text-emerald-500" />
                </div>
              )}
            </div>

            {/* Main Info */}
            <div className="flex-1 text-center sm:text-left flex flex-col pt-1">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] tracking-tight">
                      {store.name}
                    </h1>
                 </div>
                 
                 {/* Rating */}
                 <div className="inline-flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-100/50 justify-center sm:justify-start">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="font-bold text-amber-800 text-sm">
                    {store.rating.toFixed(1)}
                  </span>
                  <span className="text-xs font-medium text-amber-600/70 ml-0.5">
                    ({store.reviews} avaliações)
                  </span>
                 </div>
              </div>

              {/* Meta: Location and Phone (Null Resilient) */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-6 gap-y-3 mt-4">
                 <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <MapPin className="h-4 w-4 text-slate-400" />
                    </div>
                    {(!store.city && !store.state) ? (
                      <span className="text-sm font-medium text-slate-400 italic">Endereço não informado</span>
                    ) : (
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-bold text-slate-700 leading-tight">
                          {store.city || 'Cidade N/A'} - {store.state || 'UF'}
                        </span>
                        {store.address && <span className="text-[11px] font-medium text-slate-500 truncate max-w-[200px] sm:max-w-xs">{store.address}</span>}
                      </div>
                    )}
                 </div>

                 <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                      <Phone className="h-4 w-4 text-slate-400" />
                    </div>
                    {!store.phone ? (
                       <span className="text-sm font-medium text-slate-400 italic">Contato não informado</span>
                    ) : (
                       <span className="text-sm font-bold text-slate-700">{store.phone}</span>
                    )}
                 </div>
              </div>
              
              {/* Description */}
              <div className="mt-6 pt-5 border-t border-slate-50">
                <p className="text-sm text-slate-600 leading-relaxed max-w-3xl border-l-[3px] border-slate-100 pl-4 py-1">
                    {store.description}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="mt-8 mb-8 px-2 sm:px-0">
            <div className="flex items-center flex-wrap gap-4 justify-between mb-6">
               <h2 className="text-2xl font-extrabold font-[family-name:var(--font-display)] text-slate-900 tracking-tight">Vitrine da Loja</h2>
               <div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-white px-3 py-1.5 rounded-full border border-slate-100 shadow-sm shrink-0">
                 <ShoppingBag className="h-4 w-4 text-[var(--color-primary-500)]" />
                 {store.products.length} Produtos Disponíveis
               </div>
            </div>

            {store.products.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-slate-100">
                      <ShoppingBag className="h-8 w-8 text-slate-300" />
                    </div>
                    <h3 className="font-bold text-slate-700 text-lg">Nenhum produto cadastrado</h3>
                    <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">Esta loja ainda não possui produtos ativos disponíveis para venda no momento.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {store.products.map((product: any) => (
                    <div 
                        key={product.id} 
                        className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-[0_4px_12px_rgba(0,0,0,0.02)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col"
                        onClick={() => navigate(`/shopping/${product.id}`)}
                    >
                        <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-6 shrink-0 border-b border-slate-50">
                          <ImageWithFallback 
                              src={product.image_url} 
                              alt={product.title || product.name}
                              className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500 ease-in-out mix-blend-multiply"
                          />
                        </div>
                        <div className="p-4 sm:p-5 flex-1 flex flex-col">
                           <h3 className="font-medium text-slate-800 line-clamp-2 text-sm mb-3 group-hover:text-[var(--color-primary-600)] transition-colors leading-relaxed">
                               {product.title || product.name}
                           </h3>
                           <div className="mt-auto flex items-end justify-between border-t border-slate-50 pt-3">
                               <span className="font-black text-[1.1rem] text-slate-900 tracking-tight">
                                   R$ {Number(product.price).toFixed(2).replace('.', ',')}
                               </span>
                               <span className="text-[10px] font-bold text-[var(--color-primary-500)] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                                 Ver mais <ArrowLeft className="h-3 w-3 rotate-180" />
                               </span>
                           </div>
                        </div>
                    </div>
                    ))}
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
