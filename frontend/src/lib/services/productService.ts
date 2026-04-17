import { API_URL, getHeaders } from '../api';

export interface Product {
  id: string;
  provider_id: string;
  name: string;
  category: string;
  description?: string;
  sku?: string;
  stock_quantity: number;
  price: string | number;
  image_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  created_at: string;
  updated_at: string;
}

export interface CreateProductDTO {
  name: string;
  category: string;
  description?: string;
  sku?: string;
  stock_quantity: number;
  price: number | string;
  image_url?: string;
}

export const productService = {
  async fetchProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products/provider`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao buscar produtos');
    }

    const data = await response.json();
    return data;
  },

  async createProduct(productData: CreateProductDTO): Promise<Product> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao criar produto');
    }

    const data = await response.json();
    return data.product;
  },

  async updateProduct(id: string, productData: Partial<CreateProductDTO>): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao atualizar produto');
    }

    const data = await response.json();
    return data.product;
  },

  async deleteProduct(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao excluir produto');
    }
  }
};
