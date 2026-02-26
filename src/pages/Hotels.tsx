import { useState } from "react";
import { 
  Search, 
  MapPin, 
  Calendar, 
  Dog, 
  Cat, 
  Star, 
  Filter, 
  Heart, 
  Phone, 
  MessageCircle, 
  PawPrint,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  Stethoscope
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { Avatar } from "../components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "../components/ui/dialog";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";

// Mock Data based on Figma designs
const hotels = [
  {
    id: 1,
    name: "Hotel Amigato",
    price: 120,
    rating: 5.0,
    reviews: 120,
    distance: "2.1km",
    image: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&auto=format&fit=crop&q=60",
    allowsDogs: false,
    allowsCats: true,
    description: "Especializado em felinos, o Hotel Amigato oferece um ambiente tranquilo e enriquecido verticalmente para seu gato.",
    tags: ["Apenas Gatos", "Ambiente Climatizado"]
  },
  {
    id: 2,
    name: "Hotel Brendinha",
    price: 135,
    rating: 4.7,
    reviews: 90,
    distance: "1.5km",
    image: "https://images.unsplash.com/photo-1597843786271-10512415241f?w=400&auto=format&fit=crop&q=60",
    allowsDogs: true,
    allowsCats: true,
    description: "Cuidado familiar para todos os tipos de pets. Aqui a diversão é garantida com nosso playground externo.",
    tags: ["Cães e Gatos", "Playground"]
  },
  {
    id: 3,
    name: "Hotel São Roque",
    price: 190,
    rating: 5.0,
    reviews: 64,
    distance: "3.3km",
    image: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=400&auto=format&fit=crop&q=60",
    allowsDogs: true,
    allowsCats: false,
    description: "No Hotel São Roque, seu cãozinho é tratado com carinho e atenção! Oferecemos hospedagem, creche e muito amor para seu pet se sentir em casa.",
    tags: ["Apenas Cães", "Piscina", "Adestramento"]
  },
  {
    id: 4,
    name: "Hotel Tia Tati",
    price: 130,
    rating: 4.5,
    reviews: 113,
    distance: "0.8km",
    image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&auto=format&fit=crop&q=60",
    allowsDogs: true,
    allowsCats: true,
    description: "Aconchego de casa de vó para seu pet. Monitoramento 24 horas e veterinário de plantão.",
    tags: ["Monitoramento 24h", "Veterinário"]
  }
];

export function Hotels() {
  const [selectedHotel, setSelectedHotel] = useState<typeof hotels[0] | null>(null);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Filters Header (Inspired by Figma Orange Section) */}
      <div className="bg-white pb-6 pt-4 sticky top-16 z-30 shadow-sm border-b border-slate-100">
        <div className="container mx-auto px-4">
           {/* Location & Category Tabs */}
           <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-medium">
                 <MapPin className="text-[var(--color-primary-600)]" />
                 <span>Rua 33, Centro</span>
              </div>
              
              <div className="flex gap-2 bg-slate-100 p-1 rounded-full">
                 <Button variant="ghost" size="sm" className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-white">
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Pet shops
                 </Button>
                 <Button size="sm" className="rounded-full bg-blue-300 hover:bg-blue-400 text-blue-900 shadow-none border-0">
                    <PawPrint className="w-4 h-4 mr-2" />
                    Hotéis
                 </Button>
                 <Button variant="ghost" size="sm" className="rounded-full text-slate-600 hover:text-slate-900 hover:bg-white">
                    <Stethoscope className="w-4 h-4 mr-2" />
                    Cuidados
                 </Button>
              </div>
           </div>

           {/* Search & Orange Filter Box */}
           <div className="relative">
              <div className="relative z-10 mb-4">
                 <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                 <Input 
                    placeholder="Buscar em Hotéis" 
                    className="pl-12 h-12 text-lg rounded-2xl border-orange-200 focus-visible:ring-orange-500 bg-white shadow-sm" 
                 />
              </div>

              {/* Orange Filters Container */}
              <div className="bg-[#F58B05] rounded-3xl p-6 md:p-8 text-white shadow-lg">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white/95 rounded-xl p-3 flex items-start gap-3 text-slate-800 hover:bg-white transition-colors cursor-pointer">
                       <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <Calendar className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Datas</p>
                          <p className="font-medium text-sm">24 abr - 25 abr</p>
                       </div>
                    </div>
                    
                    <div className="bg-white/95 rounded-xl p-3 flex items-start gap-3 text-slate-800 hover:bg-white transition-colors cursor-pointer">
                       <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                          <PawPrint className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hóspedes</p>
                          <p className="font-medium text-sm">1 Cão, P. Pequeno</p>
                       </div>
                    </div>

                    <Button className="h-full w-full bg-[#7FBBDE] hover:bg-[#6caecf] text-white font-bold text-lg rounded-xl shadow-none border-0">
                       Buscar
                    </Button>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Hotel List */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6 font-[family-name:var(--font-display)]">Resultados para sua busca</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
           {hotels.map((hotel) => (
             <Card 
                key={hotel.id} 
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-slate-100"
                onClick={() => setSelectedHotel(hotel)}
             >
                <div className="relative h-48 overflow-hidden">
                   <ImageWithFallback 
                      src={hotel.image} 
                      alt={hotel.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                   />
                   <Badge className="absolute top-3 right-3 bg-white text-slate-900 font-bold shadow-sm">
                      R$ {hotel.price} <span className="font-normal text-xs text-slate-500 ml-1">/noite</span>
                   </Badge>
                </div>
                <CardContent className="p-4">
                   <div className="flex justify-between items-start mb-2">
                      <div>
                         <h3 className="font-bold text-lg text-slate-900">{hotel.name}</h3>
                         <div className="flex items-center gap-1 text-slate-500 text-sm">
                            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-slate-700">{hotel.rating}</span>
                            <span>({hotel.reviews})</span>
                         </div>
                      </div>
                      <div className="flex gap-1">
                         {hotel.allowsDogs ? (
                            <div className="p-1.5 rounded-full bg-green-100 text-green-700" title="Aceita Cães">
                               <Dog className="h-4 w-4" />
                            </div>
                         ) : (
                            <div className="p-1.5 rounded-full bg-red-50 text-red-300" title="Não Aceita Cães">
                               <Dog className="h-4 w-4" />
                            </div>
                         )}
                         {hotel.allowsCats ? (
                            <div className="p-1.5 rounded-full bg-green-100 text-green-700" title="Aceita Gatos">
                               <Cat className="h-4 w-4" />
                            </div>
                         ) : (
                            <div className="p-1.5 rounded-full bg-red-50 text-red-300" title="Não Aceita Gatos">
                               <Cat className="h-4 w-4" />
                            </div>
                         )}
                      </div>
                   </div>
                   <div className="flex items-center gap-2 mt-4 text-xs font-medium text-slate-500">
                      <Badge variant="outline" className="border-slate-200 bg-slate-50">{hotel.distance}</Badge>
                      {hotel.tags[0] && <Badge variant="outline" className="border-slate-200 bg-slate-50">{hotel.tags[0]}</Badge>}
                   </div>
                </CardContent>
             </Card>
           ))}
        </div>
      </div>

      {/* Hotel Detail Dialog (Inspired by PerfilHotel1) */}
      <Dialog open={!!selectedHotel} onOpenChange={(open) => !open && setSelectedHotel(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white border-0 sm:rounded-3xl gap-0">
           {selectedHotel && (
             <>
                {/* Hero Image */}
                <div className="relative h-64 w-full">
                   <ImageWithFallback 
                      src={selectedHotel.image} 
                      alt={selectedHotel.name} 
                      className="w-full h-full object-cover"
                   />
                   <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-4 left-4 bg-white/80 hover:bg-white rounded-full text-slate-900 backdrop-blur-sm"
                      onClick={() => setSelectedHotel(null)}
                   >
                      <XCircle className="h-6 w-6" />
                   </Button>
                   <Button 
                      size="icon" 
                      variant="ghost" 
                      className="absolute top-4 right-4 bg-white/80 hover:bg-white rounded-full text-red-500 backdrop-blur-sm"
                   >
                      <Heart className="h-5 w-5" />
                   </Button>

                   {/* Pagination Dots (Mock) */}
                   <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                      <div className="w-2 h-2 rounded-full bg-white/50"></div>
                   </div>
                </div>

                {/* Content */}
                <div className="p-6">
                   <div className="flex justify-between items-start mb-1">
                      <div>
                         <DialogTitle className="text-2xl font-bold text-slate-900">{selectedHotel.name}</DialogTitle>
                         <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                            <MapPin className="h-4 w-4" />
                            {selectedHotel.distance} • {selectedHotel.reviews} avaliações
                         </div>
                      </div>
                      <div className="text-right">
                         <span className="block text-2xl font-bold text-slate-900">R${selectedHotel.price}</span>
                         <span className="text-xs text-slate-500">por noite</span>
                      </div>
                   </div>

                   {selectedHotel.allowsDogs && !selectedHotel.allowsCats && (
                      <p className="text-red-600 text-xs font-bold uppercase tracking-wider mb-4">Aceitamos somente cães</p>
                   )}

                   <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 my-4 text-sm text-slate-600 leading-relaxed italic">
                      "{selectedHotel.description}"
                   </div>

                   <div className="grid grid-cols-2 gap-3 mb-6">
                      {selectedHotel.tags.map(tag => (
                         <div key={tag} className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-100 p-2 rounded-lg">
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                            {tag}
                         </div>
                      ))}
                   </div>

                   {/* Footer Actions */}
                   <div className="flex items-center gap-3 mt-2">
                      <Button className="flex-1 bg-[#F58B05] hover:bg-[#d67a04] text-white rounded-full py-6 font-bold text-base shadow-lg shadow-orange-200/50 border-0">
                         Reserve aqui!
                         <PawPrint className="ml-2 h-5 w-5" />
                      </Button>
                      <div className="flex gap-2">
                         <Button size="icon" variant="outline" className="rounded-full h-12 w-12 border-blue-200 text-blue-400 hover:bg-blue-50 hover:text-blue-500">
                            <Phone className="h-5 w-5" />
                         </Button>
                         <Button size="icon" variant="outline" className="rounded-full h-12 w-12 border-blue-200 text-blue-400 hover:bg-blue-50 hover:text-blue-500">
                            <MessageCircle className="h-5 w-5" />
                         </Button>
                      </div>
                   </div>
                </div>
             </>
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
