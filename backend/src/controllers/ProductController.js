const createProductUseCase = require('../useCases/products/CreateProductUseCase');

class ProductController {
  async create(req, res) {
    try {
      const { name, category, description, sku, stock_quantity, price, image_url } = req.body;
      
      const provider_id = req.userId; 

      // Sanitização do Preço
      let sanitizedPrice = 0;
      if (price) {
        const priceStr = price.toString().replace(/[R$\s]/g, '').replace(',', '.');
        sanitizedPrice = parseFloat(priceStr);
      }

      const product = await createProductUseCase.execute({
        provider_id,
        name,
        category,
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
      return res.status(400).json({ error: error.message });
    }
  }
}

module.exports = new ProductController();