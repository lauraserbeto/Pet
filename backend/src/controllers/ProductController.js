const CreateProductUseCase = require('../useCases/products/CreateProductUseCase');
const listProviderProductsUseCase = require('../useCases/products/ListProviderProductsUseCase');
const updateProductUseCase = require('../useCases/products/UpdateProductUseCase');
const deleteProductUseCase = require('../useCases/products/DeleteProductUseCase');
const listActiveProductsUseCase = require('../useCases/products/ListActiveProductsUseCase');
const getProductDetailsUseCase = require('../useCases/products/GetProductDetailsUseCase');
const { listProductsQuery } = require('../schemas/productSchemas');
class ProductController {
  
  getOptions(req, res) {
    try {
      const categories = [
        "Alimentação", "Higiene", "Farmácia", "Acessórios", "Conforto", "Beleza", "Roupas"
      ];
      const petTypes = ["Todos","Cães", "Gatos", "Outros"];
      
      return res.status(200).json({ categories, petTypes });
    } catch (error) {
      console.error("[ProductController] Erro em getOptions:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async listActive(req, res) {
    try {
      // Lê (sem reatribuir — Express 5 tem req.query só-leitura) e valida a página.
      const { page, limit } = listProductsQuery.parse(req.query);
      const { data, total, totalPages } = await listActiveProductsUseCase.execute({ page, limit });

      // Corpo permanece um ARRAY (compatível com o frontend atual);
      // os metadados de paginação vão nos headers X-*.
      res.set({
        'X-Total-Count': String(total),
        'X-Page': String(page),
        'X-Limit': String(limit),
        'X-Total-Pages': String(totalPages),
      });
      return res.status(200).json(data);
    } catch (error) {
      if (error?.name === 'ZodError') {
        return res.status(422).json({
          error: { code: 'VALIDATION_ERROR', message: 'Parâmetros de paginação inválidos (page>=1, limit 1..100).' },
        });
      }
      console.error("[ProductController] Erro em listActive:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const product = await getProductDetailsUseCase.execute(id);
      return res.status(200).json(product);
    } catch (error) {
      return next(error);
    }
  }

  async listByProvider(req, res, next) {
    try {
      const provider_id = req.userId;
      const products = await listProviderProductsUseCase.execute(provider_id);
      return res.status(200).json(products);
    } catch (error) {
      return next(error);
    }
  }

  // Body já validado e convertido por `createProductSchema` (preço e estoque numéricos).
  async create(req, res, next) {
    try {
      const { name, category, pet_type, description, sku, stock_quantity, price, image_url } = req.body;

      const product = await CreateProductUseCase.execute({
        userId: req.userId,
        userRole: req.userRole,
        name,
        category,
        pet_type,
        description,
        sku,
        stock_quantity,
        price,
        image_url,
      });

      return res.status(201).json({
        message: "Produto cadastrado com sucesso!",
        product
      });
    } catch (error) {
      return next(error);
    }
  }

  // Body já validado e convertido por `updateProductSchema`.
  async update(req, res, next) {
    try {
      const product = await updateProductUseCase.execute({
        productId: req.params.id,
        userId: req.userId,
        userRole: req.userRole,
        data: req.body,
      });

      return res.status(200).json({
        message: "Produto atualizado com sucesso!",
        product
      });
    } catch (error) {
      return next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const product = await deleteProductUseCase.execute(id, req.userId, req.userRole);

      return res.status(200).json({
        message: 'Produto excluído com sucesso!',
        product
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ProductController();
