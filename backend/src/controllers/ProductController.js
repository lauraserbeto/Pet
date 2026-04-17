const CreateProductUseCase = require('../useCases/products/createProductUseCase');
const listProviderProductsUseCase = require('../useCases/products/ListProviderProductsUseCase');
const updateProductUseCase = require('../useCases/products/UpdateProductUseCase');

class ProductController {
  
  getOptions(req, res) {
    try {
      const categories = [
        "Alimentação", "Higiene", "Farmácia", "Acessórios", "Conforto", "Beleza", "Roupas"
      ];
      const petTypes = ["Cães", "Gatos", "Outros"];
      
      return res.status(200).json({ categories, petTypes });
    } catch (error) {
      console.error("[ProductController] Erro em getOptions:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async listByProvider(req, res) {
    try {
      const provider_id = req.userId;
      const products = await listProviderProductsUseCase.execute(provider_id);
      return res.status(200).json(products);
    } catch (error) {
      console.error("[ProductController] Erro em listByProvider:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async create(req, res) {
    try {
      const { name, category, pet_type, description, sku, stock_quantity, price, image_url } = req.body;
      
      const provider_id = req.userId; 

      // Sanitização do Preço
      let sanitizedPrice = 0;
      if (price) {
        const priceStr = price.toString().replace(/[R$\s]/g, '').replace(',', '.');
        sanitizedPrice = parseFloat(priceStr);
      }

      const product = await CreateProductUseCase.execute({
        provider_id,
        name,
        category,
        pet_type,
        description,
        sku,
        stock_quantity: Number(stock_quantity),
        price: sanitizedPrice,
        image_url
      });

      return res.status(201).json({
        message: "Produto cadastrado com sucesso!",
        product
      });

    } catch (error) {
      console.error("[ProductController] Erro em create:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const { name, category, pet_type, description, sku, stock_quantity, price, image_url } = req.body;
      const provider_id = req.userId;

      let sanitizedPrice = undefined;
      if (price !== undefined) {
        const priceStr = price.toString().replace(/[R$\s]/g, '').replace(',', '.');
        sanitizedPrice = parseFloat(priceStr);
      }

      const product = await updateProductUseCase.execute(id, provider_id, {
        name,
        category,
        pet_type,
        description,
        sku,
        stock_quantity: stock_quantity !== undefined ? Number(stock_quantity) : undefined,
        price: sanitizedPrice,
        image_url
      });

      return res.status(200).json({
        message: "Produto atualizado com sucesso!",
        product
      });
    } catch (error) {
      console.error("[ProductController] Erro em update:", error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();