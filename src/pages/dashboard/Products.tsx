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
import { Search, Plus, Filter, MoreHorizontal, Package, AlertCircle } from "lucide-react";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";

export function Products() {
  const products = [
    { id: 1, name: "Ração Premium Cães 15kg", category: "Alimentos", stock: 12, price: "R$ 249,90", status: "In Stock", sku: "R-001", image: "https://images.unsplash.com/photo-1589924691195-41432c84c161?w=100&auto=format&fit=crop&q=60" },
    { id: 2, name: "Shampoo Hipoalergênico 500ml", category: "Higiene", stock: 3, price: "R$ 45,50", status: "Low Stock", sku: "H-023", image: "https://images.unsplash.com/photo-1585232561307-3f8d40864319?w=100&auto=format&fit=crop&q=60" },
    { id: 3, name: "Coleira de Couro M", category: "Acessórios", stock: 25, price: "R$ 89,90", status: "In Stock", sku: "A-105", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=100&auto=format&fit=crop&q=60" },
    { id: 4, name: "Brinquedo Osso Borracha", category: "Brinquedos", stock: 0, price: "R$ 25,00", status: "Out of Stock", sku: "B-099", image: "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=100&auto=format&fit=crop&q=60" },
    { id: 5, name: "Antipulgas Pipeta", category: "Farmácia", stock: 50, price: "R$ 120,00", status: "In Stock", sku: "F-332", image: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=100&auto=format&fit=crop&q=60" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Produtos</h2>
          <p className="text-slate-500">Gerencie seu estoque e catálogo de produtos.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline">
            <Package className="mr-2 h-4 w-4" /> Importar
           </Button>
           <Button>
            <Plus className="mr-2 h-4 w-4" /> Novo Produto
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Valor em Estoque</p>
               <h3 className="text-2xl font-bold text-slate-900">R$ 45.280,00</h3>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Package size={20} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Produtos Baixo Estoque</p>
               <h3 className="text-2xl font-bold text-orange-600">5</h3>
            </div>
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
               <AlertCircle size={20} />
            </div>
         </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Total de Itens</p>
               <h3 className="text-2xl font-bold text-slate-900">1,240</h3>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
               <Package size={20} />
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input className="pl-10" placeholder="Buscar produto, SKU..." />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="flex gap-2">
               <Filter className="h-4 w-4" /> Categoria
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Imagem</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Estoque</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                       <ImageWithFallback src={product.image} alt={product.name} className="h-full w-full object-cover" />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                     <span className="font-bold text-slate-900">{product.name}</span>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell className="font-mono text-xs text-slate-500">{product.sku}</TableCell>
                  <TableCell>{product.price}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 rounded-full ${
                        product.status === 'In Stock' ? 'bg-green-500' :
                        product.status === 'Low Stock' ? 'bg-orange-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm">
                        {product.stock > 0 ? `${product.stock} un.` : 'Sem estoque'}
                      </span>
                    </div>
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
      </div>
    </div>
  );
}
