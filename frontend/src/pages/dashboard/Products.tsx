import { useEffect, useState } from "react";
import { toast } from "sonner";
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
import { Label } from "../../components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "../../components/ui/dialog";
import { Search, Plus, Filter, Package, AlertCircle, Trash2, Loader2, ArrowRight } from "lucide-react";
import { ImageWithFallback } from "../../app/components/figma/ImageWithFallback";
import { productService, Product, CreateProductDTO } from "../../lib/services/productService";

export function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitLoading, setIsSubmitLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialFormState: CreateProductDTO = {
    name: "",
    category: "",
    description: "",
    sku: "",
    stock_quantity: 0,
    price: "",
    image_url: ""
  };

  const [formData, setFormData] = useState<CreateProductDTO>(initialFormState);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const data = await productService.fetchProducts();
      setProducts(data);
    } catch (error: any) {
      toast.error(error.message || "Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setFormData(prev => ({
        ...prev,
        image_url: base64String
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitLoading(true);
      const newProduct = await productService.createProduct(formData);
      setProducts(prev => [newProduct, ...prev]);
      toast.success("Produto criado com sucesso!");
      setIsModalOpen(false);
      setFormData(initialFormState);
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar produto");
    } finally {
      setIsSubmitLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o produto "${name}"?`)) {
      try {
        await productService.deleteProduct(id);
        setProducts(prev => prev.filter(p => p.id !== id));
        toast.success("Produto excluído com sucesso!");
      } catch (error: any) {
        toast.error(error.message || "Erro ao excluir produto");
      }
    }
  };

  const formatCurrency = (value: number | string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(value));
  };

  const totalValue = products.reduce((acc, curr) => acc + (Number(curr.price) * curr.stock_quantity), 0);
  const lowStockCount = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;
  const outOfStockCount = products.filter(p => p.stock_quantity === 0).length;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-display)]">Produtos</h2>
          <p className="text-slate-500">Gerencie seu estoque e catálogo de produtos.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="hidden sm:flex">
            <Package className="mr-2 h-4 w-4" /> Importar
           </Button>
           
           <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Novo Produto
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
              <DialogHeader>
                <DialogTitle>Cadastrar Novo Produto</DialogTitle>
                <DialogDescription>
                  Preencha os dados do produto para adicioná-lo ao catálogo.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Produto</Label>
                  <Input id="name" name="name" required value={formData.name} onChange={handleInputChange} placeholder="Ex: Ração Golden 15kg" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Input id="category" name="category" required value={formData.category} onChange={handleInputChange} placeholder="Ex: Alimentos" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU (Opcional)</Label>
                    <Input id="sku" name="sku" value={formData.sku} onChange={handleInputChange} placeholder="Ex: R-001" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço Real (R$)</Label>
                    <Input id="price" name="price" type="text" required value={formData.price} onChange={handleInputChange} placeholder="Ex: 30,00" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stock_quantity">Qtd. Estoque</Label>
                    <Input id="stock_quantity" name="stock_quantity" type="number" min="0" required value={formData.stock_quantity} onChange={handleInputChange} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_file">Imagem do Produto (Opcional)</Label>
                  <Input id="image_file" name="image_file" type="file" accept="image/*" onChange={handleFileChange} />
                  {formData.image_url && <p className="text-xs text-green-600 mt-1">Imagem carregada e pronta para envio.</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Input id="description" name="description" value={formData.description} onChange={handleInputChange} placeholder="Breve descrição do produto" />
                </div>

                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                  <Button type="submit" disabled={isSubmitLoading}>
                    {isSubmitLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Salvar Produto
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Valor em Estoque</p>
               <h3 className="text-2xl font-bold text-slate-900">{formatCurrency(totalValue)}</h3>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
               <Package size={20} />
            </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Alertas de Estoque</p>
               <div className="flex gap-2 items-baseline mt-1">
                 <h3 className="text-2xl font-bold text-orange-600">{lowStockCount}</h3>
                 <span className="text-xs text-red-500 font-medium">({outOfStockCount} esgotados)</span>
               </div>
            </div>
            <div className="h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
               <AlertCircle size={20} />
            </div>
         </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
               <p className="text-sm font-medium text-slate-500">Total de Itens Cadastrados</p>
               <h3 className="text-2xl font-bold text-slate-900">{products.length}</h3>
            </div>
            <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
               <Package size={20} />
            </div>
         </div>
      </div>

      {/* Main Table Area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              className="pl-10 bg-white" 
              placeholder="Buscar por nome, SKU ou categoria..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
             <Button variant="outline" className="flex gap-2 bg-white">
               <Filter className="h-4 w-4" /> Filtrar
             </Button>
          </div>
        </div>

        <div className="overflow-x-auto min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
               <Loader2 className="h-8 w-8 animate-spin mb-4 text-[#F58B05]" />
               <p>Carregando catálogo de produtos...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-center px-4">
                <Package className="h-12 w-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Nenhum produto encontrado</h3>
                <p className="text-slate-500 mt-1 mb-4 text-sm max-w-sm">Você ainda não tem produtos cadastrados ou nenhum corresponde à sua busca atual.</p>
                <Button onClick={() => setIsModalOpen(true)} variant="outline" className="text-[#3699D2] border-[#3699D2] hover:bg-blue-50">
                   <Plus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Produto
                </Button>
             </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-50/80 uppercase text-xs">
                <TableRow>
                  <TableHead className="w-[80px] pl-6 font-semibold">Imagem</TableHead>
                  <TableHead className="font-semibold">Produto</TableHead>
                  <TableHead className="font-semibold">Categoria</TableHead>
                  <TableHead className="font-semibold">SKU</TableHead>
                  <TableHead className="font-semibold px-4 text-right">Preço</TableHead>
                  <TableHead className="font-semibold">Estoque</TableHead>
                  <TableHead className="text-right pr-6 font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-slate-100">
                {filteredProducts.map((product) => (
                  <TableRow key={product.id} className="hover:bg-slate-50/50 transition-colors group">
                    <TableCell className="pl-6">
                      <div className="h-12 w-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200">
                         <ImageWithFallback 
                           src={product.image_url || 'https://via.placeholder.com/150?text=Pet+Product'} 
                           alt={product.name} 
                           className="h-full w-full object-cover" 
                         />
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="font-bold text-slate-900 group-hover:text-[#3699D2] transition-colors">{product.name}</div>
                       {product.description && <div className="text-xs text-slate-500 truncate max-w-[200px]">{product.description}</div>}
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium">
                        {product.category}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-500">{product.sku || '-'}</TableCell>
                    <TableCell className="font-bold text-slate-900 px-4 text-right">{formatCurrency(product.price)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${
                          product.stock_quantity > 5 ? 'bg-green-500 ring-4 ring-green-500/20' :
                          product.stock_quantity > 0 ? 'bg-orange-500 ring-4 ring-orange-500/20' : 
                          'bg-red-500 ring-4 ring-red-500/20'
                        }`}></span>
                        <span className="text-sm font-medium">
                          {product.stock_quantity > 0 ? `${product.stock_quantity} un.` : <span className="text-red-500">Esgotado</span>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(product.id, product.name)}
                        className="text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Excluir Produto"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
}
