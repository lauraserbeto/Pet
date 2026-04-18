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
          verified: data.status === 'ACTIVE',
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
    <div className="min-h-screen bg-slate-50 pb-28 font-[family-name:var(--font-body)]">
      {/* Cover Image */}
      <div className="relative h-[220px] sm:h-[280px] w-full bg-slate-200">
        <ImageWithFallback
          src={store.coverImage}
          alt="Capa da Loja"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

        {/* Top Controls */}
        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 shadow-sm h-10 w-10"
            onClick={() => navigate(-1)}
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </Button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 -mt-16 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 sm:p-6"
        >
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            {/* Avatar */}
            <div className="relative shrink-0 -mt-14 sm:-mt-16">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-4 border-white shadow-md bg-white">
                <ImageWithFallback
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Name & Meta */}
            <div className="flex-1 text-center sm:text-left sm:pt-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
                  {store.name}
                </h1>
                {store.verified && (
                  <ShieldCheck className="h-5 w-5 text-[var(--color-primary-500)]" />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-2 text-sm text-slate-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {store.address}, {store.city} - {store.state}
                </span>
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {store.phone}
                </span>
                <span className="flex items-center gap-1">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  {store.products.length} Produtos
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-xl sm:mt-2">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <span className="font-bold text-amber-700">
                {store.rating.toFixed(1)}
              </span>
              <span className="text-xs text-amber-600/70">
                ({store.reviews})
              </span>
            </div>
          </div>
          
          <div className="mt-6 border-t border-slate-100 pt-5">
            <h2 className="font-bold text-slate-900 mb-2 font-[family-name:var(--font-display)]">Sobre a loja</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
                {store.description}
            </p>
          </div>
        </motion.div>

        {/* Products Grid */}
        <div className="mt-8">
            <h2 className="text-2xl font-bold font-[family-name:var(--font-display)] text-slate-900 mb-6">Vitrine da Loja</h2>
            {store.products.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <ShoppingBag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-medium text-slate-700">Nenhum produto cadastrado</h3>
                    <p className="text-sm text-slate-500 mt-1">Esta loja ainda não possui produtos ativos.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {store.products.map((product: any) => (
                    <div 
                        key={product.id} 
                        className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                        onClick={() => navigate(`/shopping/${product.id}`)}
                    >
                        <div className="aspect-square bg-slate-100 relative overflow-hidden group">
                        <ImageWithFallback 
                            src={product.image_url} 
                            alt={product.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        </div>
                        <div className="p-3 sm:p-4">
                        <h3 className="font-medium text-slate-900 line-clamp-2 text-sm mb-1 group-hover:text-[var(--color-primary-600)] transition-colors">
                            {product.title}
                        </h3>
                        <div className="flex items-center justify-between mt-2">
                            <span className="font-extrabold text-slate-900">
                                R$ {Number(product.price).toFixed(2)}
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
