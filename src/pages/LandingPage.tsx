import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import { ServiceCard } from "../components/ServiceCard";
import { Link } from "react-router";
import { Search, MapPin, Calendar, Heart, Shield, Award, Hotel, PawPrint, ShoppingBag, Smartphone, Star, Bell, QrCode, Download } from "lucide-react";
import { motion } from "motion/react";

export function LandingPage() {
  const featuredServices = [
    {
      id: 1,
      name: "Hotel Pet Paradise",
      category: "Hotelaria",
      rating: 4.8,
      reviewCount: 124,
      distance: "1.2km",
      imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBob3RlbHxlbnwxfHx8fDE3NzE5NDI4NDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      isOpen: true,
      address: "Rua das Flores, 123",
    },
    {
      id: 2,
      name: "Passeios Felizes",
      category: "Passeador",
      rating: 4.9,
      reviewCount: 89,
      distance: "2.5km",
      imageUrl: "https://images.unsplash.com/photo-1628009368231-76033527212e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW58ZW58MXx8fHwxNzcxOTQyODQxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      isOpen: true,
      address: "Av. Paulista, 1000",
    },
    {
      id: 3,
      name: "Pet Sitter Premium",
      category: "Pet Sitter",
      rating: 4.7,
      reviewCount: 56,
      distance: "5.0km",
      imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkb2clMjBob3RlbHxlbnwxfHx8fDE3NzE5NDI4NDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      isOpen: false,
      address: "Rua do Campo, 50",
    },
    {
      id: 4,
      name: "Day Care Patinhas",
      category: "Day Care",
      rating: 5.0,
      reviewCount: 210,
      distance: "0.8km",
      imageUrl: "https://images.unsplash.com/photo-1758101512269-660feabf64fd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2ZXRlcmluYXJpYW4lMjBjbGluaWMlMjBpbnRlcmlvciUyMG1vZGVybnxlbnwxfHx8fDE3NzE5NDI4NDF8MA&ixlib=rb-4.1.0&q=80&w=1080",
      isOpen: true,
      address: "Rua da Saúde, 88",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-[var(--color-secondary-50)] py-20 lg:py-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <Badge variant="secondary" className="px-4 py-1 text-sm font-medium rounded-full bg-white text-[var(--color-secondary-700)] shadow-sm">
                A melhor plataforma para seu pet
              </Badge>
              <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight text-slate-900 font-[family-name:var(--font-display)]">
                Cuidado completo para quem você <span className="text-[var(--color-primary-500)]">mais ama</span>.
              </h1>
              <p className="text-lg text-slate-600 max-w-xl font-[family-name:var(--font-body)]">
                Encontre veterinários, pet shops e hotéis próximos a você. Agende serviços, compare preços e garanta o bem-estar do seu melhor amigo.
              </p>
              
              <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-100 max-w-lg">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="O que seu pet precisa?" className="pl-9 border-0 bg-slate-50 focus-visible:ring-0" />
                  </div>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input placeholder="Localização" className="pl-9 border-0 bg-slate-50 focus-visible:ring-0" />
                  </div>
                  <Button size="lg" className="w-full md:w-auto">Buscar</Button>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[var(--color-secondary-500)]" />
                  Profissionais Verificados
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-[var(--color-secondary-500)]" />
                  Agendamento Online
                </div>
              </div>
            </div>
            <div className="relative lg:h-[600px] rounded-3xl overflow-hidden shadow-2xl">
               <img 
                src="https://images.unsplash.com/photo-1719292606971-0916fc62f5b0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnb2xkZW4lMjByZXRyaWV2ZXIlMjBkb2clMjBoYXBweXxlbnwxfHx8fDE3NzE4ODA5NjN8MA&ixlib=rb-4.1.0&q=80&w=1080" 
                alt="Happy Dog" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-8 w-8 rounded-full border-2 border-white bg-slate-200"></div>
                    ))}
                  </div>
                  <span className="text-sm font-medium">+2.000 tutores satisfeitos</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Abstract Background Shapes */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-[var(--color-primary-100)] rounded-full blur-3xl opacity-50 z-0"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-[var(--color-secondary-100)] rounded-full blur-3xl opacity-50 z-0"></div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Tudo que seu pet precisa</h2>
            <p className="mt-4 text-slate-600 font-[family-name:var(--font-body)]">Navegue por categorias e encontre o serviço ideal.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { name: "Hotelaria", icon: Hotel, color: "bg-blue-100 text-blue-600", href: "/hotels" },
              { name: "Pet Sitter", icon: PawPrint, color: "bg-orange-100 text-orange-600", href: "/walkers" },
              { name: "Shopping", icon: ShoppingBag, color: "bg-green-100 text-green-600", href: "/shopping" },
            ].map((cat) => (
              <Link key={cat.name} to={cat.href}>
                <Card className="hover:shadow-lg transition-all cursor-pointer border-slate-100 hover:border-[var(--color-primary-200)] group">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <div className={`p-4 rounded-full ${cat.color} mb-4 group-hover:scale-110 transition-transform`}>
                      <cat.icon className="h-8 w-8" />
                    </div>
                    <h3 className="font-bold text-slate-900 font-[family-name:var(--font-display)]">{cat.name}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Destaques da Semana</h2>
              <p className="mt-2 text-slate-600">Os estabelecimentos mais bem avaliados na sua região.</p>
            </div>
            <Button variant="link" className="hidden md:inline-flex">Ver todos</Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredServices.map((service) => (
              <ServiceCard key={service.id} {...service} />
            ))}
          </div>
          
          <div className="mt-12 text-center md:hidden">
            <Button variant="outline" className="w-full">Ver todos</Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[var(--color-primary-600)] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 font-[family-name:var(--font-display)]">Você tem um Pet Shop ou Clínica?</h2>
          <p className="text-lg text-[var(--color-primary-100)] mb-8 max-w-2xl mx-auto">
            Junte-se ao Pet+ e expanda seu negócio. Gerencie agendamentos, clientes e produtos em um só lugar.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" variant="secondary" className="font-bold">Cadastrar meu Negócio</Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white/10">Saiba Mais</Button>
          </div>
        </div>
      </section>

      {/* Mobile App Promo Section */}
      <section className="relative py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[var(--color-primary-500)]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-secondary-500)]/10 rounded-full blur-3xl"></div>

        <div className="container mx-auto px-6 sm:px-10 md:px-16 lg:px-24 xl:px-32 relative z-10 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left — Content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <Badge className="bg-[var(--color-primary-500)]/20 text-[var(--color-primary-300)] border-[var(--color-primary-500)]/30 px-4 py-1.5 text-sm rounded-full">
                <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                Novo — App Mobile
              </Badge>

              <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight font-[family-name:var(--font-display)]">
                O Pet+ agora está na
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-400)] to-[var(--color-secondary-400)]">
                  palma da sua mão.
                </span>
              </h2>

              <p className="text-slate-400 text-lg max-w-md font-[family-name:var(--font-body)]">
                Agende serviços, receba notificações em tempo real e acompanhe seu pet de onde estiver. Tudo mais rápido e prático pelo app.
              </p>

              {/* Feature pills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { icon: Bell, label: "Notificações em tempo real" },
                  { icon: Calendar, label: "Agendamento rápido" },
                  { icon: MapPin, label: "GPS e rastreamento" },
                  { icon: Star, label: "Avaliações exclusivas" },
                ].map((feat) => (
                  <div key={feat.label} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                    <div className="p-2 rounded-lg bg-[var(--color-primary-500)]/20">
                      <feat.icon className="h-4 w-4 text-[var(--color-primary-400)]" />
                    </div>
                    <span className="text-sm text-slate-300">{feat.label}</span>
                  </div>
                ))}
              </div>

              {/* Store buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-white text-slate-900 rounded-xl px-6 py-3.5 hover:bg-slate-100 transition-colors group"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Baixar na</span>
                    <p className="text-sm font-semibold -mt-0.5">App Store</p>
                  </div>
                </a>
                <a
                  href="#"
                  className="inline-flex items-center gap-3 bg-white text-slate-900 rounded-xl px-6 py-3.5 hover:bg-slate-100 transition-colors group"
                >
                  <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor">
                    <path d="M3.61 1.814L13.793 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .61-.92zm.503-.368l11.27 6.518L12.87 10.48 4.113 1.446zM20.18 11.09l-3.126 1.81-2.756-2.9 2.756-2.9 3.126 1.81c.608.352.608.928 0 1.28v-.1zM4.113 22.554l8.757-9.034 2.513 2.516-11.27 6.518z"/>
                  </svg>
                  <div className="text-left">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500">Disponível no</span>
                    <p className="text-sm font-semibold -mt-0.5">Google Play</p>
                  </div>
                </a>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 pt-2 text-sm text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Download className="h-4 w-4" />
                  <span>50k+ downloads</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="flex">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <span>4.9 na loja</span>
                </div>
              </div>
            </motion.div>

            {/* Right — Phone mockup */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="flex justify-center lg:justify-end"
            >
              <div className="relative">
                {/* Phone frame */}
                <div className="relative w-[280px] sm:w-[300px] rounded-[3rem] border-[8px] border-slate-700 bg-slate-800 shadow-2xl shadow-black/40 overflow-hidden">
                  {/* Status bar */}
                  <div className="flex items-center justify-between px-6 pt-3 pb-1 bg-slate-900/80 text-[10px] text-slate-400">
                    <span>9:41</span>
                    <div className="w-24 h-6 bg-slate-900 rounded-full mx-auto"></div>
                    <div className="flex gap-1">
                      <div className="w-4 h-2 bg-slate-500 rounded-sm"></div>
                    </div>
                  </div>
                  {/* App screen */}
                  <div className="bg-white">
                    <img
                      src="https://images.unsplash.com/photo-1629697776809-f37ceac39e77?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzbWFydHBob25lJTIwbW9iaWxlJTIwYXBwJTIwbW9ja3VwJTIwaGFuZHxlbnwxfHx8fDE3NzE5MjY5MjV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                      alt="Pet+ App"
                      className="w-full aspect-[9/16] object-cover"
                    />
                  </div>
                </div>

                {/* Floating cards */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="absolute -left-12 sm:-left-20 top-1/4 bg-white text-slate-900 rounded-2xl shadow-xl p-4 flex items-center gap-3 min-w-[180px]"
                >
                  <div className="p-2 rounded-full bg-green-100">
                    <Bell className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Agendamento confirmado!</p>
                    <p className="text-[10px] text-slate-400">Hotel Pet Paradise</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -right-8 sm:-right-16 bottom-1/3 bg-white text-slate-900 rounded-2xl shadow-xl p-4 flex items-center gap-3 min-w-[160px]"
                >
                  <div className="p-2 rounded-full bg-yellow-100">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold">Nova avaliação</p>
                    <p className="text-[10px] text-slate-400">5.0 — Excelente!</p>
                  </div>
                </motion.div>

                {/* QR Code card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1, duration: 0.5 }}
                  className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white text-slate-900 rounded-xl shadow-xl px-4 py-3 flex items-center gap-2"
                >
                  <QrCode className="h-5 w-5 text-[var(--color-primary-500)]" />
                  <span className="text-xs font-medium whitespace-nowrap">Escaneie e baixe</span>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}