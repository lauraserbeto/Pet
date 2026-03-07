import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Search,
  MapPin,
  Star,
  Heart,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  ArrowUpDown,
  PawPrint,
  Calendar,
  Dog,
  Briefcase,
  ShieldCheck,
} from "lucide-react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { motion } from "motion/react";

export function WalkersPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"rating" | "price" | "distance">("rating");
  const [activeService, setActiveService] = useState("todos");
  const [showFilters, setShowFilters] = useState(false);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const walkers = [
    {
      id: "pedro-alves",
      name: "Pedro Alves",
      role: "Pet Sitter & Dog Walker",
      rating: 5.0,
      reviews: 24,
      price: 40,
      image:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&auto=format&fit=crop&q=60",
      verified: true,
      distance: "1 km",
      experience: "3 anos",
      petsServed: 35,
      services: ["Pet Sitter", "Dog Walker"],
      available: true,
      bio: "Publicitário e dog walker certificado. Apaixonado por animais.",
    },
    {
      id: "isabela-smith",
      name: "Isabela Smith",
      role: "Pet Sitter & Dog Walker",
      rating: 5.0,
      reviews: 48,
      price: 40,
      image:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60",
      verified: true,
      distance: "2.5 km",
      experience: "5 anos",
      petsServed: 80,
      services: ["Pet Sitter", "Dog Walker", "Day Care"],
      available: true,
      bio: "Veterinária com experiência em cuidados especiais.",
    },
    {
      id: "joao-souza",
      name: "João Souza",
      role: "Médico Veterinário & Dog Walker",
      rating: 4.8,
      reviews: 36,
      price: 45,
      image:
        "https://images.unsplash.com/photo-1771340183956-6f69d2d08f43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYW4lMjBwb3J0cmFpdCUyMG91dGRvb3JzJTIwY2FzdWFsJTIwY29uZmlkZW50fGVufDF8fHx8MTc3MjAyOTc0MHww&ixlib=rb-4.1.0&q=80&w=1080",
      verified: true,
      distance: "2.5 km",
      experience: "7 anos",
      petsServed: 120,
      services: ["Pet Sitter", "Dog Walker"],
      available: false,
      bio: "Médico veterinário com especialização em comportamento animal.",
    },
    {
      id: "ana-costa",
      name: "Ana Costa",
      role: "Pet Sitter",
      rating: 4.9,
      reviews: 62,
      price: 35,
      image:
        "https://images.unsplash.com/photo-1765648763932-43a3e2f8f35c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx5b3VuZyUyMHdvbWFuJTIwcG9ydHJhaXQlMjBmcmllbmRseSUyMHNtaWxlJTIwcHJvZmVzc2lvbmFsfGVufDF8fHx8MTc3MjAyOTczOXww&ixlib=rb-4.1.0&q=80&w=1080",
      verified: true,
      distance: "3.1 km",
      experience: "2 anos",
      petsServed: 45,
      services: ["Pet Sitter", "Day Care"],
      available: true,
      bio: "Bióloga apaixonada por pets. Cuido com muito carinho e responsabilidade.",
    },
  ];

  const serviceFilters = [
    { key: "todos", label: "Todos" },
    { key: "pet-sitter", label: "Pet Sitter" },
    { key: "dog-walker", label: "Dog Walker" },
    { key: "day-care", label: "Day Care" },
  ];

  const filtered = walkers
    .filter((w) => w.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter((w) => {
      if (activeService === "todos") return true;
      if (activeService === "pet-sitter") return w.services.includes("Pet Sitter");
      if (activeService === "dog-walker") return w.services.includes("Dog Walker");
      if (activeService === "day-care") return w.services.includes("Day Care");
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "price") return a.price - b.price;
      if (sortBy === "distance") return parseFloat(a.distance) - parseFloat(b.distance);
      return b.rating - a.rating;
    });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-sky-600 to-sky-700 pt-6 pb-14 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full -ml-10 -mb-10" />

        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold text-white font-[family-name:var(--font-display)]">
              Pet Sitters
            </h1>
            <p className="text-white/70 text-sm mt-1">
              Profissionais verificados para cuidar do seu pet
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-white rounded-2xl p-3 shadow-lg shadow-sky-900/10">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-slate-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder="Buscar por nome ou especialidade..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 text-sm bg-transparent"
              />
              <Button
                variant="ghost"
                size="sm"
                className="text-sky-600 shrink-0"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4 mr-1" />
                Filtros
              </Button>
            </div>

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
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] text-slate-500">Data</p>
                      <p className="text-sm font-semibold text-slate-900">
                        24 abr — 25 abr
                      </p>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100 p-3 rounded-xl transition-colors text-left">
                    <div className="p-2 rounded-lg bg-sky-100 text-sky-600">
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
                <Button className="w-full rounded-xl h-11 bg-sky-600 hover:bg-sky-700">
                  Aplicar filtros
                </Button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Results Area */}
      <div className="container mx-auto max-w-4xl px-4 -mt-6 relative z-10">
        {/* Service Type Pills */}
        <div className="bg-white rounded-2xl px-3 py-3 shadow-sm border border-slate-100 mb-4 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max">
            {serviceFilters.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveService(filter.key)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                  activeService === filter.key
                    ? "bg-sky-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-1 pl-4 border-l border-slate-100">
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
        </div>

        {/* Results Count */}
        <p className="text-sm text-slate-500 mb-4 px-1">
          <span className="font-semibold text-slate-700">{filtered.length}</span>{" "}
          {filtered.length === 1
            ? "profissional encontrado"
            : "profissionais encontrados"}
        </p>

        {/* Walker Cards */}
        <div className="space-y-4 pb-8">
          {filtered.map((walker, index) => (
            <motion.div
              key={walker.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer group"
                onClick={() => navigate(`/walkers/${walker.id}`)}
                role="article"
                aria-label={`${walker.name}, ${walker.rating} estrelas, R$${walker.price} por hora`}
              >
                <div className="p-4 sm:p-5">
                  {/* Top Row: Avatar + Info + Price */}
                  <div className="flex gap-4">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-100">
                        <ImageWithFallback
                          src={walker.image}
                          alt={walker.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {/* Online indicator */}
                      {walker.available && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors font-[family-name:var(--font-display)]">
                              {walker.name}
                            </h3>
                            {walker.verified && (
                              <ShieldCheck className="h-4 w-4 text-sky-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {walker.role}
                          </p>
                        </div>

                        {/* Price */}
                        <div className="text-right shrink-0">
                          <p className="font-extrabold text-slate-900 text-lg leading-none">
                            R${walker.price}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            /hora
                          </p>
                        </div>
                      </div>

                      {/* Rating + Distance */}
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-amber-700">
                            {walker.rating.toFixed(1)}
                          </span>
                          <span className="text-[10px] text-amber-600/60">
                            ({walker.reviews})
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <MapPin className="h-3 w-3" />
                          <span className="text-xs">{walker.distance}</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400">
                          <Briefcase className="h-3 w-3" />
                          <span className="text-xs">{walker.experience}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio preview */}
                  <p className="text-xs text-slate-500 mt-3 line-clamp-1">
                    {walker.bio}
                  </p>

                  {/* Bottom Row: Services + Actions */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                    <div className="flex flex-wrap gap-1.5">
                      {walker.services.map((service) => (
                        <Badge
                          key={service}
                          variant="secondary"
                          className="text-[10px] bg-sky-50 text-sky-600 hover:bg-sky-100 font-medium"
                        >
                          {service}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(walker.id);
                        }}
                        aria-label={
                          favorites.includes(walker.id)
                            ? "Remover dos favoritos"
                            : "Favoritar"
                        }
                      >
                        <Heart
                          className={`h-4 w-4 transition-colors ${
                            favorites.includes(walker.id)
                              ? "fill-red-500 text-red-500"
                              : "text-slate-400"
                          }`}
                        />
                      </button>
                      <Button
                        size="sm"
                        className="rounded-full text-xs h-8 px-4 bg-sky-600 hover:bg-sky-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/walkers/${walker.id}`);
                        }}
                      >
                        Ver perfil
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <PawPrint className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="font-semibold text-slate-600 mb-1">
                Nenhum profissional encontrado
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
