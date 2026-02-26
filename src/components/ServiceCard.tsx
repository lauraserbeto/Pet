import { Star, MapPin, Clock } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { ImageWithFallback } from "../app/components/figma/ImageWithFallback";

interface ServiceCardProps {
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  distance: string;
  imageUrl: string;
  isOpen: boolean;
  address: string;
}

export function ServiceCard({
  name,
  category,
  rating,
  reviewCount,
  distance,
  imageUrl,
  isOpen,
  address,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col h-full group">
      <div className="relative h-48 w-full overflow-hidden">
        <ImageWithFallback
          src={imageUrl}
          alt={name}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3">
          <Badge variant={isOpen ? "default" : "secondary"} className={isOpen ? "bg-green-500 hover:bg-green-600 text-white" : "bg-slate-200 text-slate-600"}>
            {isOpen ? "Aberto Agora" : "Fechado"}
          </Badge>
        </div>
      </div>
      
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start">
          <div>
             <Badge variant="outline" className="mb-2 text-[10px] uppercase tracking-wider">{category}</Badge>
            <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-[var(--color-primary-600)] transition-colors font-[family-name:var(--font-display)]">{name}</h3>
          </div>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span className="font-semibold text-sm">{rating}</span>
          <span className="text-slate-500 text-sm">({reviewCount})</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 flex-grow space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <MapPin className="h-4 w-4 shrink-0" />
          <span className="truncate">{address}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
           <span className="font-medium text-[var(--color-primary-600)]">{distance}</span>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 mt-auto border-t border-slate-50 mt-4 pt-4">
        <Button className="w-full">Agendar</Button>
      </CardFooter>
    </Card>
  );
}
