import { useState, useRef } from "react";
import { useParams, Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";
import { toast } from "sonner";
import { useCart } from "../components/cart/CartContext";
import {
  Star,
  Heart,
  ShoppingCart,
  Minus,
  Plus,
  ChevronLeft,
  ChevronRight,
  Truck,
  ShieldCheck,
  RotateCcw,
  Package,
  Check,
  Store,
  ExternalLink,
  ThumbsUp,
  Camera,
  Share2,
  MessageCircle,
  Award,
  Clock,
  MapPin,
  Info,
} from "lucide-react";

/* ═══════════════════════════════════════════════
   DATA — In production this would come from API
   ═══════════════════════════════════════════════ */

const allProducts = [
  {
    id: 1,
    name: "Ração Premium Cães Adultos 15kg",
    brand: "Pedigree",
    price: 149.9,
    originalPrice: 179.9,
    rating: 4.5,
    reviews: 328,
    image: "https://images.unsplash.com/photo-1725533488658-437e3619f856?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwZG9nJTIwZm9vZCUyMGJhZyUyMGtpYmJsZXxlbnwxfHx8fDE3NzIxMjE1NTd8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "alimentacao",
    pet: "caes",
    badge: "Mais Vendido",
  },
  {
    id: 2,
    name: "Brinquedo Interativo Resistente",
    brand: "PetClean",
    price: 39.9,
    rating: 4.7,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1714339691990-803e3dbf2056?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB0b3klMjBjb2xvcmZ1bCUyMGRvZ3xlbnwxfHx8fDE3NzIxMjE1NTh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "acessorios",
    pet: "caes",
  },
  {
    id: 3,
    name: "Coleira Ajustável Refletiva Premium",
    brand: "Premier",
    price: 89.9,
    originalPrice: 119.9,
    rating: 4.8,
    reviews: 94,
    image: "https://images.unsplash.com/photo-1765895899115-bfdd2854b141?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjb2xsYXIlMjBsZWFzaCUyMGFjY2Vzc29yaWVzfGVufDF8fHx8MTc3MjEyMTU1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "acessorios",
    pet: "caes",
    badge: "Oferta",
  },
  {
    id: 4,
    name: "Cama Ortopédica Pet Grande",
    brand: "Premier",
    price: 219.9,
    rating: 4.9,
    reviews: 201,
    image: "https://images.unsplash.com/photo-1632147104665-09e9bf73703e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBiZWQlMjBjdXNoaW9uJTIwY29tZm9ydHxlbnwxfHx8fDE3NzIxMjE1NTl8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "caes",
    badge: "Novo",
  },
  {
    id: 5,
    name: "Suplemento Vitamínico Cães e Gatos",
    brand: "Sanol",
    price: 64.9,
    rating: 4.3,
    reviews: 78,
    image: "https://images.unsplash.com/photo-1556739664-787e863d09c4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjB2aXRhbWlucyUyMHN1cHBsZW1lbnRzJTIwaGVhbHRofGVufDF8fHx8MTc3MjEyMTU1OXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "farmacia",
    pet: "caes",
  },
  {
    id: 6,
    name: "Biscoito Natural Orgânico 500g",
    brand: "GranPlus",
    price: 29.9,
    rating: 4.6,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1609075689223-58f5120b3d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjB0cmVhdCUyMHNuYWNrJTIwYmlzY3VpdHxlbnwxfHx8fDE3NzIxMjE1NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "alimentacao",
    pet: "caes",
    badge: "Popular",
  },
  {
    id: 7,
    name: "Sanitário Higiênico para Gatos",
    brand: "PetClean",
    price: 124.9,
    originalPrice: 159.9,
    rating: 4.4,
    reviews: 167,
    image: "https://images.unsplash.com/photo-1689349511905-44b0c120a05e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBsaXR0ZXIlMjBib3glMjBhY2Nlc3Nvcmllc3xlbnwxfHx8fDE3NzIxMjE1NjB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "higiene",
    pet: "gatos",
    badge: "Oferta",
  },
  {
    id: 8,
    name: "Bolsa de Transporte Acolchoada",
    brand: "Premier",
    price: 189.9,
    rating: 4.7,
    reviews: 92,
    image: "https://images.unsplash.com/photo-1765182272682-c1e8edf6251e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBjYXJyaWVyJTIwdHJhbnNwb3J0JTIwYmFnfGVufDF8fHx8MTc3MjEyMTU2MXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "caes",
  },
  {
    id: 9,
    name: "Roupinha Inverno Fleece M",
    brand: "PetClean",
    price: 59.9,
    rating: 4.2,
    reviews: 64,
    image: "https://images.unsplash.com/photo-1765312769388-bfb3d5d68472?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBjbG90aGluZyUyMG91dGZpdCUyMHdpbnRlcnxlbnwxfHx8fDE3NzIxMjE1NjF8MA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "roupas",
    pet: "caes",
  },
  {
    id: 10,
    name: "Aquário Completo com Filtro 50L",
    brand: "Golden",
    price: 349.9,
    rating: 4.8,
    reviews: 45,
    image: "https://images.unsplash.com/photo-1667763207293-fab06a1accb1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcXVhcml1bSUyMGZpc2glMjB0YW5rJTIwc3VwcGxpZXN8ZW58MXx8fHwxNzcyMTIxNTYxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "outros",
    badge: "Premium",
  },
  {
    id: 11,
    name: "Shampoo Neutro Hipoalergênico 500ml",
    brand: "Sanol",
    price: 34.9,
    rating: 4.5,
    reviews: 289,
    image: "https://images.unsplash.com/photo-1587291086390-69a3af40cf0b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzaGFtcG9vJTIwYm90dGxlJTIwZ3Jvb21pbmd8ZW58MXx8fHwxNzcyMTIxNTY1fDA&ixlib=rb-4.1.0&q=80&w=1080",
    category: "beleza",
    pet: "caes",
    badge: "Mais Vendido",
  },
  {
    id: 12,
    name: "Arranhador Torre para Gatos",
    brand: "Royal Canin",
    price: 279.9,
    originalPrice: 349.9,
    rating: 4.9,
    reviews: 134,
    image: "https://images.unsplash.com/photo-1762037770311-6a2e21c0fac1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXQlMjBzY3JhdGNoaW5nJTIwcG9zdCUyMHRvd2VyfGVufDF8fHx8MTc3MjEyMTU2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    category: "conforto",
    pet: "gatos",
    badge: "Oferta",
  },
];

/* Extra gallery images per product (mock) */
const extraGallery = [
  "https://images.unsplash.com/photo-1767023023369-96a7c923be0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBlYXRpbmclMjBraWJibGUlMjBib3dsfGVufDF8fHx8MTc3MjEyMjQ2NXww&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1763295739245-27db2fbc8b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBoYXBweSUyMGhlYWx0aHl8ZW58MXx8fHwxNzcyMTIyNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080",
  "https://images.unsplash.com/photo-1684882726821-2999db517441?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBudXRyaXRpb24lMjBsYWJlbCUyMHBhY2thZ2luZ3xlbnwxfHx8fDE3NzIxMjI0Njh8MA&ixlib=rb-4.1.0&q=80&w=1080",
];

const productDescriptions: Record<number, string> = {
  1: "A Ração Premium para Cães Adultos Pedigree é formulada com ingredientes selecionados e balanceados para garantir a nutrição completa do seu cão adulto. Enriquecida com vitaminas, minerais e ômega 3 e 6 para pelagem brilhante e saudável. Contém proteínas de alta qualidade que promovem músculos fortes e energia para o dia a dia. Ideal para cães de médio e grande porte acima de 12 meses.",
  2: "Brinquedo desenvolvido com borracha atóxica de alta resistência, ideal para cães que adoram mastigar. Estimula a atividade física e mental do pet, prevenindo o tédio e comportamentos destrutivos. Design ergonômico que facilita a preensão e torna a brincadeira mais divertida.",
  3: "Coleira ajustável com faixa refletiva para máxima visibilidade durante passeios noturnos. Fabricada em nylon premium com fecho de segurança em aço inoxidável. Acolchoada internamente para conforto durante longos passeios.",
  4: "Cama ortopédica com espuma viscoelástica de alta densidade que se adapta ao corpo do pet, aliviando pontos de pressão e proporcionando suporte articular. Capa removível e lavável em tecido impermeável antialérgico.",
  5: "Suplemento vitamínico completo formulado por veterinários para reforçar a saúde de cães e gatos. Contém vitaminas A, D, E, complexo B, zinco, ferro e probióticos para imunidade e vitalidade.",
  6: "Biscoitos artesanais feitos com ingredientes 100% naturais e orgânicos. Sem conservantes artificiais, corantes ou aromatizantes. Receita aprovada por veterinários nutricionistas. Sabor irresistível que os pets adoram!",
  7: "Sanitário higiênico fechado com filtro de carvão ativado que neutraliza odores. Design moderno com porta basculante e bandeja removível para fácil limpeza. Ideal para gatos de todos os tamanhos.",
  8: "Bolsa de transporte acolchoada com estrutura semi-rígida para proteção e conforto. Aberturas laterais em tela para ventilação, alça de ombro ajustável e bolso frontal para acessórios. Aprovada para transporte em cabines de aviões.",
  9: "Roupinha de inverno em fleece macio e quentinho. Corte ergonômico que não restringe movimentos. Fácil de vestir com fechamento em velcro. Disponível em várias cores e tamanhos.",
  10: "Kit aquário completo com tanque de vidro temperado 50L, filtro externo, aquecedor, iluminação LED e termômetro digital. Tudo que você precisa para começar seu aquário com peixes tropicais.",
  11: "Shampoo neutro com fórmula hipoalergênica e pH balanceado para peles sensíveis. Enriquecido com aloe vera e camomila para hidratação profunda. Não irrita os olhos e deixa a pelagem macia e perfumada.",
  12: "Arranhador torre com 3 níveis, corda de sisal natural e plataformas acolchoadas. Base estável anti-tombamento. Inclui brinquedos pendurados e toca para descanso. Ideal para gatos ativos.",
};

const specifications: Record<string, { label: string; value: string }[]> = {
  alimentacao: [
    { label: "Peso", value: "15 kg" },
    { label: "Sabor", value: "Carne e vegetais" },
    { label: "Faixa etária", value: "Adulto (1-7 anos)" },
    { label: "Porte", value: "Médio e grande" },
    { label: "Composição", value: "Proteína 26%, Gordura 12%, Fibra 4%" },
    { label: "Validade", value: "18 meses" },
    { label: "País de origem", value: "Brasil" },
  ],
  acessorios: [
    { label: "Material", value: "Nylon premium / Aço inox" },
    { label: "Tamanhos", value: "P, M, G, GG" },
    { label: "Peso máximo", value: "Até 40 kg" },
    { label: "Cor", value: "Preto, Azul, Vermelho" },
    { label: "Garantia", value: "6 meses" },
  ],
  conforto: [
    { label: "Dimensões", value: "80 x 60 x 20 cm" },
    { label: "Material", value: "Espuma viscoelástica" },
    { label: "Capa", value: "Removível e lavável" },
    { label: "Peso suportado", value: "Até 45 kg" },
    { label: "Garantia", value: "12 meses" },
  ],
  farmacia: [
    { label: "Apresentação", value: "Comprimidos mastigáveis" },
    { label: "Quantidade", value: "60 unidades" },
    { label: "Indicação", value: "Cães e gatos" },
    { label: "Administração", value: "1x ao dia" },
    { label: "Registro MAPA", value: "SP-12345" },
  ],
  higiene: [
    { label: "Dimensões", value: "55 x 40 x 42 cm" },
    { label: "Material", value: "Polipropileno" },
    { label: "Filtro", value: "Carvão ativado (substituível)" },
    { label: "Peso", value: "2,8 kg" },
    { label: "Cor", value: "Cinza, Branco" },
  ],
  beleza: [
    { label: "Volume", value: "500 ml" },
    { label: "pH", value: "Neutro (7.0)" },
    { label: "Ingredientes", value: "Aloe vera, Camomila, Glicerina" },
    { label: "Indicação", value: "Peles sensíveis" },
    { label: "Vegano", value: "Sim" },
  ],
  roupas: [
    { label: "Material", value: "Fleece 100% poliéster" },
    { label: "Tamanho", value: "P, M, G" },
    { label: "Peso do pet", value: "3-12 kg" },
    { label: "Lavagem", value: "Máquina (água fria)" },
    { label: "Fechamento", value: "Velcro" },
  ],
};

const reviews = [
  {
    id: 1,
    author: "Ana Beatriz",
    rating: 5,
    date: "15 fev 2026",
    text: "Meu cachorro adorou! A qualidade é excelente, pelagem ficou muito mais brilhante desde que troquei de ração. Recomendo demais!",
    helpful: 24,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1763295739245-27db2fbc8b9a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBoYXBweSUyMGhlYWx0aHl8ZW58MXx8fHwxNzcyMTIyNDY2fDA&ixlib=rb-4.1.0&q=80&w=1080",
    verified: true,
  },
  {
    id: 2,
    author: "Carlos Mendes",
    rating: 4,
    date: "10 fev 2026",
    text: "Produto de boa qualidade e entrega rápida. Só achei o preço um pouco salgado, mas vale o custo-benefício no longo prazo.",
    helpful: 12,
    hasPhoto: false,
    verified: true,
  },
  {
    id: 3,
    author: "Juliana Oliveira",
    rating: 5,
    date: "5 fev 2026",
    text: "Terceira vez comprando e sempre excelente! O vendedor é super atencioso e a embalagem chega perfeita. Meus 3 dogs aprovam!",
    helpful: 18,
    hasPhoto: true,
    photoUrl: "https://images.unsplash.com/photo-1767023023369-96a7c923be0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBlYXRpbmclMjBraWJibGUlMjBib3dsfGVufDF8fHx8MTc3MjEyMjQ2NXww&ixlib=rb-4.1.0&q=80&w=1080",
    verified: true,
  },
  {
    id: 4,
    author: "Roberto Alves",
    rating: 5,
    date: "28 jan 2026",
    text: "Melhor produto que já comprei nessa categoria. Nota 10 em tudo, desde a qualidade até o atendimento.",
    helpful: 9,
    hasPhoto: false,
    verified: false,
  },
  {
    id: 5,
    author: "Marina Costa",
    rating: 4,
    date: "20 jan 2026",
    text: "Muito bom! Atendeu minhas expectativas. A embalagem poderia ser um pouco mais sustentável, mas o produto em si é ótimo.",
    helpful: 6,
    hasPhoto: false,
    verified: true,
  },
];

const ratingDistribution = [
  { stars: 5, percentage: 72 },
  { stars: 4, percentage: 18 },
  { stars: 3, percentage: 6 },
  { stars: 2, percentage: 3 },
  { stars: 1, percentage: 1 },
];

const storeInfo = {
  name: "PetWorld Store",
  rating: 4.8,
  reviews: 1256,
  products: 347,
  followers: "12.4k",
  responseTime: "< 1 hora",
  location: "São Paulo, SP",
  since: "2021",
  logo: "https://images.unsplash.com/photo-1761618843734-ffd54d9c493b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXQlMjBzdG9yZSUyMHNob3AlMjBpbnRlcmlvcnxlbnwxfHx8fDE3NzIxMjI0NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
};

const variants = ["15 kg", "10 kg", "5 kg", "1 kg"];

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const cls = size === "lg" ? "h-5 w-5" : size === "md" ? "h-4 w-4" : "h-3.5 w-3.5";
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`${cls} ${
            i < Math.floor(rating)
              ? "fill-amber-400 text-amber-400"
              : i < rating
              ? "fill-amber-400/50 text-amber-400"
              : "fill-slate-200 text-slate-200"
          }`}
        />
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════ */

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = allProducts.find((p) => p.id === Number(id)) ?? allProducts[0];
  const gallery = [product.image, ...extraGallery];

  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"desc" | "specs" | "delivery">("desc");

  const carouselRef = useRef<HTMLDivElement>(null);
  const relatedScrollRef = useRef<HTMLDivElement>(null);

  const specs = specifications[product.category] || specifications.alimentacao;
  const description = productDescriptions[product.id] || productDescriptions[1];
  const relatedProducts = allProducts.filter((p) => p.id !== product.id).slice(0, 8);
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const addToCart = () => {
    toast.success(`${quantity}x ${product.name} (${selectedVariant}) adicionado ao carrinho!`);
  };
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast(isFavorite ? "Removido dos favoritos" : "Adicionado aos favoritos!");
  };
  const scrollRelated = (dir: "left" | "right") => {
    relatedScrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  const badgeColor = (badge?: string) => {
    switch (badge) {
      case "Mais Vendido": return "bg-emerald-500";
      case "Oferta": return "bg-red-500";
      case "Novo": return "bg-blue-500";
      case "Popular": return "bg-[var(--color-primary-500)]";
      case "Premium": return "bg-amber-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="font-[family-name:var(--font-body)] bg-slate-50 min-h-screen">
      {/* ═══════ Breadcrumb ═══════ */}
      <div className="bg-white border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <nav className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-400 overflow-x-auto">
            <Link to="/" className="hover:text-slate-600 transition-colors shrink-0">Home</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <Link to="/shopping" className="hover:text-slate-600 transition-colors shrink-0">Shopping</Link>
            <ChevronRight className="h-3 w-3 shrink-0" />
            <span className="text-slate-700 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ═══════ Main Product Section ═══════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* ─── Gallery ─── */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Main image */}
            <div className="relative bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-square">
              <ImageWithFallback
                src={gallery[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.badge && (
                <span className={`absolute top-3 left-3 sm:top-4 sm:left-4 ${badgeColor(product.badge)} text-white text-xs font-bold px-3 py-1 rounded-full shadow-md`}>
                  {product.badge}
                </span>
              )}
              {discount > 0 && (
                <span className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                  -{discount}%
                </span>
              )}
              {/* Nav arrows */}
              <button
                onClick={() => setSelectedImage((p) => (p === 0 ? gallery.length - 1 : p - 1))}
                className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
              >
                <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setSelectedImage((p) => (p === gallery.length - 1 ? 0 : p + 1))}
                className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-white/80 backdrop-blur-sm shadow flex items-center justify-center text-slate-600 hover:bg-white transition-colors"
              >
                <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Thumbnails */}
            <div ref={carouselRef} className="flex gap-2 sm:gap-3 mt-3 sm:mt-4 overflow-x-auto pb-1 scrollbar-hide">
              {gallery.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all ${
                    selectedImage === i
                      ? "border-[var(--color-primary-500)] shadow-md"
                      : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <ImageWithFallback src={img} alt={`Imagem ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* ─── Product Info ─── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="flex flex-col"
          >
            {/* Brand & category */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm font-semibold text-[var(--color-primary-600)] uppercase tracking-wide">
                {product.brand}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-400 capitalize">{product.category}</span>
            </div>

            {/* Name */}
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] leading-tight">
              {product.name}
            </h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2 sm:mt-3">
              <Stars rating={product.rating} size="md" />
              <span className="text-sm font-semibold text-slate-700">{product.rating}</span>
              <span className="text-sm text-slate-400">({product.reviews} avaliações)</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-sm text-emerald-600 font-medium">
                <Check className="inline h-3.5 w-3.5 mr-0.5" />
                Em estoque
              </span>
            </div>

            {/* Price block */}
            <div className="mt-4 sm:mt-5 p-4 sm:p-5 bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">{fmt(product.price)}</span>
                {product.originalPrice && (
                  <span className="text-base sm:text-lg text-slate-400 line-through">{fmt(product.originalPrice)}</span>
                )}
                {discount > 0 && (
                  <span className="bg-red-50 text-red-600 text-xs font-bold px-2 py-0.5 rounded-md">
                    -{discount}% OFF
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                ou 3x de {fmt(product.price / 3)} sem juros
              </p>

              {/* Variant selector */}
              <div className="mt-4">
                <p className="text-sm font-semibold text-slate-700 mb-2">Tamanho / Variação</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map((v) => (
                    <button
                      key={v}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-3 sm:px-4 py-2 rounded-lg sm:rounded-xl text-sm font-medium border transition-all ${
                        selectedVariant === v
                          ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)] text-[var(--color-primary-700)]"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity + CTA */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5">
                {/* Quantity */}
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden shrink-0">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-11 w-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="h-11 w-12 flex items-center justify-center font-bold text-slate-800 border-x border-slate-200 text-sm">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity((q) => Math.min(10, q + 1))}
                    className="h-11 w-11 flex items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>

                {/* Add to cart */}
                <button
                  onClick={addToCart}
                  className="flex-1 flex items-center justify-center gap-2 h-11 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-colors text-sm sm:text-base"
                >
                  <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                  Adicionar ao Carrinho
                </button>

                {/* Favorite */}
                <button
                  onClick={toggleFavorite}
                  className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center hover:border-red-200 hover:bg-red-50 transition-colors self-center"
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-400"}`} />
                </button>

                {/* Share */}
                <button
                  onClick={() => { toast("Link copiado!"); }}
                  className="hidden sm:flex h-11 w-11 shrink-0 rounded-xl border border-slate-200 items-center justify-center hover:border-slate-300 hover:bg-slate-50 transition-colors"
                >
                  <Share2 className="h-5 w-5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4 sm:mt-5">
              {[
                { icon: Truck, label: "Frete grátis", sub: "acima de R$ 199" },
                { icon: ShieldCheck, label: "Compra segura", sub: "dados protegidos" },
                { icon: RotateCcw, label: "Troca grátis", sub: "em até 7 dias" },
              ].map((b) => (
                <div key={b.label} className="flex flex-col items-center text-center p-2.5 sm:p-3 bg-white rounded-xl border border-slate-100">
                  <b.icon className="h-5 w-5 text-[var(--color-primary-500)] mb-1" />
                  <span className="text-[10px] sm:text-xs font-semibold text-slate-700">{b.label}</span>
                  <span className="text-[9px] sm:text-[10px] text-slate-400">{b.sub}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════ Tabs: Description / Specs / Delivery ═══════ */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tabs content — 2 cols */}
          <div className="lg:col-span-2">
            {/* Tab buttons */}
            <div className="flex border-b border-slate-200 bg-white rounded-t-2xl px-1 sm:px-2 overflow-x-auto">
              {(
                [
                  { key: "desc", label: "Descrição", icon: Info },
                  { key: "specs", label: "Especificações", icon: Package },
                  { key: "delivery", label: "Entrega", icon: Truck },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors shrink-0 ${
                    activeTab === tab.key
                      ? "border-[var(--color-primary-500)] text-[var(--color-primary-600)]"
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab panels */}
            <div className="bg-white rounded-b-2xl border border-t-0 border-slate-100 p-5 sm:p-6 lg:p-8 shadow-sm">
              {activeTab === "desc" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-3">
                    Sobre o produto
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{description}</p>
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Check, text: "Formulação balanceada e nutritiva" },
                      { icon: Award, text: "Marca líder no mercado pet" },
                      { icon: ShieldCheck, text: "Aprovado por veterinários" },
                      { icon: Package, text: "Embalagem hermética de qualidade" },
                    ].map((item) => (
                      <div key={item.text} className="flex items-center gap-2 text-sm text-slate-600">
                        <div className="h-6 w-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                          <item.icon className="h-3.5 w-3.5 text-emerald-500" />
                        </div>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "specs" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                    Especificações técnicas
                  </h3>
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    {specs.map((s, i) => (
                      <div
                        key={s.label}
                        className={`flex justify-between sm:grid sm:grid-cols-2 px-4 py-3 text-sm ${
                          i % 2 === 0 ? "bg-slate-50" : "bg-white"
                        }`}
                      >
                        <span className="font-medium text-slate-500">{s.label}</span>
                        <span className="text-slate-800 font-medium text-right sm:text-left">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "delivery" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
                  <h3 className="text-lg font-bold text-slate-900 font-[family-name:var(--font-display)] mb-4">
                    Informações de entrega
                  </h3>
                  <div className="space-y-4">
                    {[
                      {
                        icon: Truck,
                        title: "Entrega padrão",
                        desc: "3 a 7 dias úteis — Grátis para compras acima de R$ 199",
                        color: "bg-blue-50 text-blue-500",
                      },
                      {
                        icon: Clock,
                        title: "Entrega expressa",
                        desc: "1 a 2 dias úteis — A partir de R$ 14,90",
                        color: "bg-amber-50 text-amber-500",
                      },
                      {
                        icon: MapPin,
                        title: "Retirada na loja",
                        desc: "Disponível em lojas parceiras — Sem custo adicional",
                        color: "bg-emerald-50 text-emerald-500",
                      },
                      {
                        icon: RotateCcw,
                        title: "Política de troca",
                        desc: "Troca gratuita em até 7 dias após o recebimento. Produto deve estar lacrado.",
                        color: "bg-purple-50 text-purple-500",
                      },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 p-3 sm:p-4 border border-slate-100 rounded-xl">
                        <div className={`p-2 rounded-lg shrink-0 ${item.color}`}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.title}</p>
                          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ─── Seller Card ─── */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden sticky top-20">
              {/* Store header */}
              <div className="relative h-24 sm:h-28 bg-gradient-to-br from-[var(--color-primary-400)] to-amber-400">
                <div className="absolute -bottom-8 left-5">
                  <div className="h-16 w-16 rounded-xl border-4 border-white shadow-lg overflow-hidden bg-white">
                    <ImageWithFallback src={storeInfo.logo} alt={storeInfo.name} className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              <div className="pt-10 pb-5 px-5">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">{storeInfo.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Stars rating={storeInfo.rating} size="sm" />
                      <span className="text-xs text-slate-500 ml-1">{storeInfo.rating} ({storeInfo.reviews})</span>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-1 rounded-full">
                    <Check className="h-3 w-3" /> Verificado
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {[
                    { label: "Produtos", value: storeInfo.products },
                    { label: "Seguidores", value: storeInfo.followers },
                    { label: "Resposta", value: storeInfo.responseTime },
                    { label: "Desde", value: storeInfo.since },
                  ].map((s) => (
                    <div key={s.label} className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-xs font-bold text-slate-800">{s.value}</p>
                      <p className="text-[10px] text-slate-400">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 mt-4">
                  <button className="flex-1 flex items-center justify-center gap-1.5 h-10 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold rounded-xl text-sm transition-colors">
                    <Store className="h-4 w-4" />
                    Visitar Loja
                  </button>
                  <button className="h-10 w-10 shrink-0 rounded-xl border border-slate-200 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <MessageCircle className="h-4 w-4 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Reviews & Ratings ═══════ */}
      <section className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-[family-name:var(--font-display)] mb-6 sm:mb-8">
            Avaliações e Comentários
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            {/* Rating summary */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100 p-5 sm:p-6">
              <div className="text-center mb-5">
                <p className="text-4xl sm:text-5xl font-extrabold text-slate-900">{product.rating}</p>
                <Stars rating={product.rating} size="lg" />
                <p className="text-sm text-slate-500 mt-1">{product.reviews} avaliações</p>
              </div>
              <div className="space-y-2">
                {ratingDistribution.map((r) => (
                  <div key={r.stars} className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 w-3 text-right">{r.stars}</span>
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 rounded-full transition-all"
                        style={{ width: `${r.percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-8 text-right">{r.percentage}%</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-5 flex items-center justify-center gap-2 h-10 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                <Camera className="h-4 w-4" />
                Escrever avaliação
              </button>
            </div>

            {/* Review list */}
            <div className="lg:col-span-2 space-y-4">
              {/* Review photo strip */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {reviews
                  .filter((r) => r.hasPhoto && r.photoUrl)
                  .map((r) => (
                    <div key={`photo-${r.id}`} className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-slate-100">
                      <ImageWithFallback src={r.photoUrl!} alt="Foto da avaliação" className="w-full h-full object-cover" />
                    </div>
                  ))}
                <div className="shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                  <Camera className="h-5 w-5 mb-0.5" />
                  <span className="text-[10px] font-medium">+{product.reviews} fotos</span>
                </div>
              </div>

              {/* Individual reviews */}
              {reviews.map((r, i) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-slate-100 rounded-xl sm:rounded-2xl p-4 sm:p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      {/* Avatar initial */}
                      <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gradient-to-br from-[var(--color-primary-200)] to-[var(--color-primary-400)] flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {r.author.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-bold text-sm text-slate-800">{r.author}</p>
                          {r.verified && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-600 font-medium">
                              <Check className="h-3 w-3" /> Compra verificada
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Stars rating={r.rating} size="sm" />
                          <span className="text-[11px] text-slate-400">{r.date}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{r.text}</p>

                  {r.hasPhoto && r.photoUrl && (
                    <div className="mt-3 w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden border border-slate-100">
                      <ImageWithFallback src={r.photoUrl} alt="Foto avaliação" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50">
                    <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                      <ThumbsUp className="h-3.5 w-3.5" />
                      Útil ({r.helpful})
                    </button>
                  </div>
                </motion.div>
              ))}

              <button className="w-full py-3 text-sm font-semibold text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-xl transition-colors">
                Ver todas as {product.reviews} avaliações
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ Related Products Carousel ═══════ */}
      <section className="bg-slate-50 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 font-[family-name:var(--font-display)]">
              Produtos Relacionados
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => scrollRelated("left")}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors shadow-sm"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => scrollRelated("right")}
                className="h-8 w-8 sm:h-9 sm:w-9 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-colors shadow-sm"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            ref={relatedScrollRef}
            className="flex gap-3 sm:gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory"
          >
            {relatedProducts.map((rp) => (
              <Link
                key={rp.id}
                to={`/shopping/${rp.id}`}
                className="shrink-0 w-[45%] sm:w-[30%] md:w-[23%] lg:w-[19%] snap-start group"
              >
                <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all overflow-hidden flex flex-col h-full">
                  <div className="relative aspect-square bg-slate-100 overflow-hidden">
                    <ImageWithFallback
                      src={rp.image}
                      alt={rp.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    {rp.badge && (
                      <span className={`absolute top-2 left-2 ${badgeColor(rp.badge)} text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full`}>
                        {rp.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-2.5 sm:p-3 flex-1 flex flex-col">
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium uppercase">{rp.brand}</span>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 mt-0.5">{rp.name}</h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Stars rating={rp.rating} size="sm" />
                      <span className="text-[10px] text-slate-400">{rp.rating}</span>
                    </div>
                    <div className="flex-1" />
                    <p className="text-sm font-extrabold text-slate-900 mt-1.5">{fmt(rp.price)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ Mobile Sticky CTA ═══════ */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-4 py-3 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div>
            <p className="text-xs text-slate-400 line-through">{product.originalPrice ? fmt(product.originalPrice) : ""}</p>
            <p className="text-lg font-extrabold text-slate-900">{fmt(product.price)}</p>
          </div>
          <button
            onClick={addToCart}
            className="flex-1 flex items-center justify-center gap-2 h-11 bg-[var(--color-primary-500)] hover:bg-[var(--color-primary-600)] text-white font-bold rounded-xl shadow-lg shadow-orange-200 transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}