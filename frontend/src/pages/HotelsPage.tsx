import { useState, useEffect } from "react";
import { providerService } from "../lib/services/providerService";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Search,
  MapPin,
  Calendar,
  Dog,
  Cat,
  Star,
  Heart,
  SlidersHorizontal,
  ChevronDown,
  Wifi,
  TreePine,
  Shield,
  Clock,
  ArrowUpDown,
} from "lucide-react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion } from "motion/react";

export function HotelsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "distance">("rating");
  const [showFilters, setShowFilters] = useState(false);

  const [apiHotels, setApiHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOpenNow = (operatingHours: any) => {
    if (!operatingHours || typeof operatingHours !== 'object') return false;
    
    const now = new Date();
    const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const currentDay = days[now.getDay()];
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const dayConfig = operatingHours[currentDay];
    if (!dayConfig || dayConfig.closed) return false;
    
    if (dayConfig.open && dayConfig.close) {
      const [openH, openM] = dayConfig.open.split(':').map(Number);
      const [closeH, closeM] = dayConfig.close.split(':').map(Number);
      
      const openTime = openH * 60 + openM;
      const closeTime = closeH * 60 + closeM;
      
      return currentTime >= openTime && currentTime <= closeTime;
    }
    
    return false;
  };

  useEffect(() => {
    providerService.fetchHotels()
      .then(data => {
        setApiHotels(
          data.map((h: any) => {
            const gallery = Array.isArray(h.gallery_images) ? h.gallery_images : [];
            const allowed = Array.isArray(h.allowed_animals) ? h.allowed_animals : [];
            const amenities = Array.isArray(h.amenities) ? h.amenities : [];

            return {
              id: h.id,
              name: h.business_name || h.user?.full_name || "Hotel Pet",
              rating: 5.0, // Mock enquanto não temos sistema de avaliações
              reviews: Math.floor(Math.random() * 50) + 5,
              price: h.daily_rate ? Number(h.daily_rate) : 150,
              image: gallery.length > 0 ? gallery[0] : (h.user?.avatar_url || "https://images.unsplash.com/photo-1548366086-7f1b76106622?w=600&auto=format&fit=crop&q=80"),
              logo: h.user?.avatar_url,
              accepts: { 
                 dog: allowed.includes('Cachorro') || allowed.includes('Sem restrição') || false, 
                 cat: allowed.includes('Gato') || allowed.includes('Sem restrição') || false 
              },
              distance: "3.0 km",
              address: `${h.city || 'Cidade'}, ${h.state || 'UF'}`,
              amenities: amenities.length > 0 ? amenities.slice(0, 3) : ["Pet Friendly", "Segurança"],
              openNow: isOpenNow(h.operating_hours),
            };
          })
        );
        setLoading(false);
      })
      .catch(err => {
        console.error("Erro ao buscar hotéis:", err);
        setLoading(false);
      });
  }, []);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const filtered = apiHotels
    .filter((h) =>
      h.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
      return b.rating - a.rating;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-700)] pt-6 pb-14 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
              Hotéis Pet
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Encontre o melhor lar temporário para seu pet
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-lg shadow-orange-900/10">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Buscar hotéis por nome ou local..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 text-sm bg-transparent"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-[var(--color-primary-600)] shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>

            {/* Expandable Filters */}
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t border-slate-100 mt-3 pt-3 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors text-left">
                    <div className="p-2 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Datas</p>
                      <p className="text-sm font-semibold text-slate-900">
                        24 abr — 25 abr
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors text-left">
                    <div className="p-2 rounded-lg bg-[var(--color-primary-100)] text-[var(--color-primary-600)]">
                      <Dog size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Pet</p>
                      <p className="text-sm font-semibold text-slate-900">
                        1 Cachorro, Pequeno
                      </p>
                    </div>
                  </button>
                </div>
                <Button className="w-full rounded-xl h-11">
                  Aplicar filtros
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="container mx-auto max-w-4xl px-4 -mt-6 relative z-10">
        {/* Sort & Count Bar */}
        <div className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100 flex items-center justify-between mb-4">
          <p className="text-sm text-slate-600">
            <span className="font-semibold text-slate-900">{loading ? "..." : filtered.length}</span>{" "}
            {filtered.length === 1 ? "hotel encontrado" : "hotéis encontrados"}
          </p>
          <div className="flex items-center gap-1">
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm font-medium text-slate-700 bg-transparent outline-none cursor-pointer"
            >
              <option value="rating">Melhor avaliados</option>
              <option value="price">Menor preço</option>
              <option value="distance">Mais próximos</option>
            </select>
          </div>
        </div>

        {/* Hotel Cards */}
        <div className="space-y-4 pb-8">
          {filtered.map((hotel, index) => (
            <motion.div
              key={hotel.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/hotels/${hotel.id}`)}
                role="article"
                aria-label={`${hotel.name}, ${hotel.rating} estrelas, R$${hotel.price} por noite`}
              >
                {/* Mobile: Stacked / Desktop: Side by side */}
                <div className="flex flex-col sm:flex-row">
                  {/* Logo Container */}
                  <div className="relative sm:w-48 md:w-56 shrink-0 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100 overflow-hidden">
                    <ImageWithFallback
                      src={hotel.logo || "https://ui-avatars.com/api/?name=" + encodeURIComponent(hotel.name)}
                      alt={hotel.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Favorite */}
                    <button
                      className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow-sm hover:bg-white transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(hotel.id);
                      }}
                      aria-label={
                        favorites.includes(hotel.id)
                          ? "Remover dos favoritos"
                          : "Adicionar aos favoritos"
                      }
                    >
                      <Heart
                        className={`h-4 w-4 transition-colors ${
                          favorites.includes(hotel.id)
                            ? "fill-red-500 text-red-500"
                            : "text-slate-600"
                        }`}
                      />
                    </button>
                    {/* Status Badge */}
                    <div className="absolute top-3 left-3">
                      <Badge
                        className={`text-[10px] font-semibold shadow-sm ${
                          hotel.openNow
                            ? "bg-emerald-500 text-white hover:bg-emerald-600"
                            : "bg-slate-700 text-white hover:bg-slate-800"
                        }`}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {hotel.openNow ? "Aberto" : "Fechado"}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      {/* Title Row */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 group-hover:text-[var(--color-primary-600)] transition-colors truncate font-[family-name:var(--font-display)]">
                            {hotel.name}
                          </h3>
                          <div className="flex items-center gap-1 text-slate-500 mt-0.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs truncate">
                              {hotel.address} • {hotel.distance}
                            </span>
                          </div>
                        </div>
                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-slate-900 text-lg leading-none">
                            R${hotel.price}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            /noite
                          </p>
                        </div>
                      </div>

                      {/* Rating */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-700">
                            {hotel.rating.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400">
                          ({hotel.reviews} avaliações)
                        </span>
                      </div>

                      {/* Amenities */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {hotel.amenities.map((amenity: string) => (
                          <span
                            key={amenity}
                            className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-md"
                          >
                            {amenity.toLowerCase().includes("wi-fi") && <Wifi className="h-3 w-3" />}
                            {amenity.toLowerCase().includes("verde") && (
                              <TreePine className="h-3 w-3" />
                            )}
                            {amenity.toLowerCase().includes("superv") && (
                              <Shield className="h-3 w-3" />
                            )}
                            {amenity}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom row */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                      {/* Accepts */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Aceita:</span>
                        <div className="flex gap-1.5">
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              hotel.accepts.dog
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-400"
                            }`}
                          >
                            <Dog className="h-3 w-3" />
                            Cães
                          </div>
                          <div
                            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                              hotel.accepts.cat
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-red-50 text-red-400"
                            }`}
                          >
                            <Cat className="h-3 w-3" />
                            Gatos
                          </div>
                        </div>
                      </div>

                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/hotels/${hotel.id}`);
                        }}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-16">
              <Dog className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-600 mb-1">
                Nenhum hotel encontrado
              </h3>
              <p className="text-sm text-slate-400">
                Tente ajustar os filtros ou a busca
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
