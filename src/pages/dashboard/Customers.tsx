import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../../components/ui/table";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { Avatar } from "../../components/ui/avatar";
import { Search, Plus, Filter, MoreHorizontal, Mail, Phone } from "lucide-react";

export function Customers() {
  const customers = [
    { id: 1, name: "Carlos Silva", pet: "Rex (Golden Retriever)", email: "carlos@example.com", phone: "(11) 99999-9999", lastVisit: "20/02/2024", totalSpent: "R$ 450,00", status: "Active" },
    { id: 2, name: "Ana Costa", pet: "Luna (Siamês)", email: "ana@example.com", phone: "(11) 98888-8888", lastVisit: "18/02/2024", totalSpent: "R$ 120,00", status: "Active" },
    { id: 3, name: "Marcos Lima", pet: "Thor (Bulldog)", email: "marcos@example.com", phone: "(11) 97777-7777", lastVisit: "10/01/2024", totalSpent: "R$ 890,00", status: "Inactive" },
    { id: 4, name: "Julia Pereira", pet: "Mel (Poodle)", email: "julia@example.com", phone: "(11) 96666-6666", lastVisit: "22/02/2024", totalSpent: "R$ 60,00", status: "Active" },
    { id: 5, name: "Roberto Ferreira", pet: "Bob (SRD)", email: "beto@example.com", phone: "(11) 95555-5555", lastVisit: "15/02/2024", totalSpent: "R$ 340,00", status: "Active" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Clientes</h2>
          <p className="text-slate-500">Gerencie sua base de clientes e seus pets.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Novo Cliente
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Buscar por nome, pet ou email..." />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="flex gap-2">
               <Filter className="h-4 w-4" /> Filtros
             </Button>
             <Button variant="outline">Exportar</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Última Visita</TableHead>
                <TableHead>Total Gasto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar fallback={customer.name.substring(0,2).toUpperCase()} className="bg-[var(--color-primary-100)] text-[var(--color-primary-700)]" />
                      <div>
                        <div className="font-bold text-slate-900">{customer.name}</div>
                        <div className="text-sm text-slate-500">{customer.pet}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                        <Mail className="h-3 w-3" /> {customer.email}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-slate-600">
                         <Phone className="h-3 w-3" /> {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{customer.lastVisit}</TableCell>
                  <TableCell>{customer.totalSpent}</TableCell>
                  <TableCell>
                    <Badge variant={customer.status === 'Active' ? 'success' : 'secondary'}>
                      {customer.status === 'Active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-sm text-slate-500">
          <span>Mostrando 5 de 128 clientes</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Anterior</Button>
            <Button variant="outline" size="sm">Próximo</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
