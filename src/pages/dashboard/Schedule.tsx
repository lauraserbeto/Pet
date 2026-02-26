import * as React from "react";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { 
  Plus, 
  User, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Filter
} from "lucide-react";
import { ptBR } from "date-fns/locale";
import { addDays, format } from "date-fns";
import { cn } from "../../lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../components/ui/select";

// Mock Data Types
type Appointment = {
  id: number;
  startTime: string;
  duration: number;
  pet: string;
  owner: string;
  service: string;
  type: "hospedagem" | "passeio" | "daycare" | "petsitter";
  status: "confirmed" | "pending" | "completed" | "cancelled";
  color: string;
};

const appointmentsData: Appointment[] = [
  { id: 1, startTime: "09:00", duration: 90, pet: "Rex", owner: "Carlos Silva", service: "Hospedagem", type: "hospedagem", status: "confirmed", color: "bg-blue-100 border-blue-200 text-blue-700" },
  { id: 2, startTime: "10:30", duration: 45, pet: "Luna", owner: "Ana Costa", service: "Passeio", type: "passeio", status: "pending", color: "bg-green-100 border-green-200 text-green-700" },
  { id: 3, startTime: "11:15", duration: 15, pet: "Thor", owner: "Marcos Lima", service: "Day Care", type: "daycare", status: "completed", color: "bg-purple-100 border-purple-200 text-purple-700" },
  { id: 4, startTime: "14:00", duration: 60, pet: "Mel", owner: "Julia P.", service: "Hospedagem", type: "hospedagem", status: "confirmed", color: "bg-blue-100 border-blue-200 text-blue-700" },
  { id: 5, startTime: "15:30", duration: 45, pet: "Bob", owner: "Roberto F.", service: "Pet Sitter", type: "petsitter", status: "confirmed", color: "bg-orange-100 border-orange-200 text-orange-700" },
];

const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8);

// Toggle for mobile calendar
function MobileCalendarToggle({
  date,
  setDate,
}: {
  date: Date | undefined;
  setDate: (d: Date | undefined) => void;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="lg:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-[var(--color-primary-600)] font-medium bg-[var(--color-primary-50)] px-3 py-1.5 rounded-lg"
      >
        <CalendarIcon className="h-4 w-4" />
        {open ? "Ocultar calendário" : "Ver calendário"}
      </button>
      {open && (
        <div className="mt-3 bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
          <CalendarComponent
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d);
              setOpen(false);
            }}
            locale={ptBR}
            className="rounded-md w-full"
          />
        </div>
      )}
    </div>
  );
}

export function Schedule() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [view, setView] = React.useState<"day" | "week">("day");

  const formatTime = (hour: number) => `${hour.toString().padStart(2, "0")}:00`;

  const getAppointmentsForHour = (hour: number) => {
    return appointmentsData.filter((apt) => {
      const aptHour = parseInt(apt.startTime.split(":")[0]);
      return aptHour === hour;
    });
  };

  return (
    <div className="flex flex-col space-y-3 sm:space-y-4">
      {/* ─── Header Toolbar ─── */}
      <div className="flex flex-col gap-3 bg-white p-3 sm:p-4 rounded-xl shadow-sm border border-slate-200 shrink-0">
        {/* Top row: date nav + view toggle */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Date navigation */}
          <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              onClick={() => setDate((d) => (d ? addDays(d, -1) : new Date()))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Mobile: short date / Desktop: full date */}
            <h2 className="text-sm sm:text-base font-bold text-slate-900 text-center capitalize font-[family-name:var(--font-display)] min-w-0 truncate">
              <span className="sm:hidden">
                {date ? format(date, "EEE, d MMM", { locale: ptBR }) : "Selecione"}
              </span>
              <span className="hidden sm:inline">
                {date ? format(date, "EEEE, d 'de' MMMM", { locale: ptBR }) : "Selecione a data"}
              </span>
            </h2>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 sm:h-9 sm:w-9 shrink-0"
              onClick={() => setDate((d) => (d ? addDays(d, 1) : new Date()))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>

            {/* View toggle — inline on sm+ */}
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-lg ml-2 shrink-0">
              <button
                onClick={() => setView("day")}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-all",
                  view === "day" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Dia
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-3 py-1 text-sm font-medium rounded-md transition-all",
                  view === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
                )}
              >
                Semana
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile view toggle */}
            <div className="sm:hidden flex bg-slate-100 p-1 rounded-lg shrink-0">
              <button
                onClick={() => setView("day")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  view === "day" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
              >
                Dia
              </button>
              <button
                onClick={() => setView("week")}
                className={cn(
                  "px-2.5 py-1 text-xs font-medium rounded-md transition-all",
                  view === "week" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                )}
              >
                Semana
              </button>
            </div>

            <Button variant="outline" size="sm" className="hidden md:flex">
              <Filter className="mr-2 h-4 w-4" /> Filtrar
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" className="flex-1 sm:flex-none bg-[#F58B05] hover:bg-[#d67a04] text-xs sm:text-sm">
                  <Plus className="mr-1 sm:mr-2 h-4 w-4" />
                  <span className="sm:hidden">Novo</span>
                  <span className="hidden sm:inline">Novo Agendamento</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Novo Agendamento</DialogTitle>
                  <DialogDescription>
                    Preencha os detalhes para agendar um novo serviço.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="pet" className="sm:text-right">
                      Pet
                    </Label>
                    <Input id="pet" placeholder="Nome do pet" className="sm:col-span-3" />
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="service" className="sm:text-right">
                      Serviço
                    </Label>
                    <Select>
                      <SelectTrigger className="sm:col-span-3">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hospedagem">Hospedagem</SelectItem>
                        <SelectItem value="passeio">Passeio</SelectItem>
                        <SelectItem value="daycare">Day Care</SelectItem>
                        <SelectItem value="petsitter">Pet Sitter</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col sm:grid sm:grid-cols-4 sm:items-center gap-1.5 sm:gap-4">
                    <Label htmlFor="time" className="sm:text-right">
                      Horário
                    </Label>
                    <Input id="time" type="time" className="sm:col-span-3" />
                  </div>
                </div>
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button type="submit" className="w-full sm:w-auto">
                    Salvar Agendamento
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Mobile calendar toggle */}
        <MobileCalendarToggle date={date} setDate={setDate} />
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-0">
        {/* Calendar Sidebar — hidden on mobile (toggle above), visible on lg+ */}
        <Card className="hidden lg:block w-80 h-fit shrink-0">
          <CardContent className="p-4">
            <CalendarComponent
              mode="single"
              selected={date}
              onSelect={setDate}
              locale={ptBR}
              className="rounded-md w-full"
            />
            <div className="mt-6 space-y-4">
              <h3 className="font-bold text-sm text-slate-700">Próximos Livres</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                  <span className="font-medium text-slate-600">Hoje</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">13:00</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                  <span className="font-medium text-slate-600">Hoje</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">16:15</span>
                </div>
                <div className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg border border-slate-100 cursor-pointer hover:bg-slate-100">
                  <span className="font-medium text-slate-600">Amanhã</span>
                  <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">09:00</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ─── Timeline View ─── */}
        <Card className="flex-1 min-h-0 flex flex-col shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="py-3 sm:py-4 px-3 sm:px-6 border-b border-slate-100 shrink-0 bg-white z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
              <CardTitle className="text-sm sm:text-base font-bold text-slate-700">Agenda do Dia</CardTitle>
              {/* Legend — wraps on mobile */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Hospedagem
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-orange-500" /> Pet Sitter
                </span>
                <span className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-green-500" /> Passeio
                </span>
              </div>
            </div>
          </CardHeader>

          <div className="flex-1 overflow-y-auto p-2 sm:p-4 bg-slate-50/30">
            <div className="relative">
              {/* Time Grid */}
              {timeSlots.map((hour) => {
                const appointmentsInHour = getAppointmentsForHour(hour);

                return (
                  <div
                    key={hour}
                    className="flex group min-h-[72px] sm:min-h-[100px] border-b border-slate-100 last:border-0 relative"
                  >
                    {/* Time Label */}
                    <div className="w-11 sm:w-16 shrink-0 py-2 pr-2 sm:pr-4 text-right">
                      <span className="text-[11px] sm:text-sm font-medium text-slate-400 group-hover:text-[#3699D2] transition-colors">
                        {formatTime(hour)}
                      </span>
                    </div>

                    {/* Slot Area */}
                    <div className="flex-1 relative border-l border-slate-100 pl-2 sm:pl-4 py-1 hover:bg-slate-50 transition-colors min-w-0">
                      {/* Half hour indicator */}
                      <div className="absolute top-1/2 left-0 w-full h-px bg-slate-50 pointer-events-none" />

                      {/* Render Appointments */}
                      {appointmentsInHour.length > 0 ? (
                        <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2 h-full">
                          {appointmentsInHour.map((apt) => (
                            <div
                              key={apt.id}
                              className={cn(
                                "sm:flex-1 rounded-lg border p-2 sm:p-3 shadow-sm hover:shadow-md transition-all cursor-pointer relative overflow-hidden group/card",
                                apt.color
                              )}
                              style={{
                                minHeight: "60px",
                              }}
                            >
                              <div className="flex justify-between items-start gap-1">
                                <div className="min-w-0">
                                  <p className="font-bold text-xs sm:text-sm truncate">{apt.pet}</p>
                                  <p className="text-[10px] sm:text-xs opacity-80 truncate">{apt.service}</p>
                                </div>
                                <Badge
                                  variant="secondary"
                                  className="bg-white/50 text-[9px] sm:text-[10px] backdrop-blur-sm border-0 shrink-0 px-1 sm:px-1.5"
                                >
                                  {apt.startTime}
                                </Badge>
                              </div>

                              <div className="flex items-center gap-1 sm:gap-2 mt-1.5 sm:mt-2 text-[10px] sm:text-xs opacity-70">
                                <User size={10} className="shrink-0 sm:[&]:w-3 sm:[&]:h-3" />
                                <span className="truncate">{apt.owner}</span>
                              </div>

                              {/* Hover Actions */}
                              <div className="absolute right-1.5 sm:right-2 bottom-1.5 sm:bottom-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-white/80 hover:bg-white shadow-sm"
                                >
                                  <MoreVertical size={10} />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Empty Slot */
                        <div className="h-full w-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Button variant="ghost" size="sm" className="text-[#3699D2] hover:bg-blue-50 text-xs sm:text-sm h-7 sm:h-8">
                            <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1" /> Adicionar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
