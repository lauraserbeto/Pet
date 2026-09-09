import { API_URL, getHeaders } from '../api';
import { httpClient, ApiError } from '../httpClient';

export interface Product {
  id: string;
  provider_id: string;
  name: string;
  category: string;
  pet_type: string;
  description?: string;
  sku?: string;
  stock_quantity: number;
  price: string | number;
  image_url?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';
  created_at: string;
  updated_at: string;
  provider?: any;
  provider_name?: string;
  provider_avatar?: string;
}

export interface CreateProductDTO {
  name: string;
  category: string;
  pet_type: string;
  description?: string;
  sku?: string;
  stock_quantity: number;
  price: number | string;
  image_url?: string;
}

/**
 * Mensagens de erro da exclusão de produto, por status HTTP do backend (STA-1).
 *
 * O backend já responde com textos legíveis, mas a tela não deve depender
 * deles: se a mensagem mudar do outro lado, o usuário não pode ficar sem
 * explicação. Aqui o texto é garantido por caso.
 */
const DELETE_PRODUCT_MESSAGES: Record<number, string> = {
  403: 'Você não tem permissão para excluir este produto.',
  404: 'Este produto não existe mais. A lista foi atualizada.',
  409: 'Este produto está vinculado a pedidos e não pode ser excluído.',
  422: 'Não foi possível identificar este produto. Recarregue a página e tente novamente.',
};

const DELETE_PRODUCT_FALLBACK = 'Não foi possível excluir o produto. Tente novamente.';

/** Traduz a falha de exclusão na mensagem que vai para o toast. */
export function describeDeleteProductError(error: unknown): string {
  if (error instanceof ApiError) {
    // Falhas de rede e timeout já chegam com texto próprio do httpClient.
    return DELETE_PRODUCT_MESSAGES[error.status] ?? error.message ?? DELETE_PRODUCT_FALLBACK;
  }
  return DELETE_PRODUCT_FALLBACK;
}

/** A lista está fora de sincronia — o item já não existe no servidor. */
export function isProductGoneError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 404;
}

export const productService = {
  async fetchOptions(): Promise<{ categories: string[], petTypes: string[] }> {
    const response = await fetch(`${API_URL}/products/options`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar opções');
    }

    const data = await response.json();
    return data;
  },

  async fetchAllPublicProducts(): Promise<Product[]> {
    const response = await fetch(`${API_URL}/products`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar produtos publicos');
    }

    const data = await response.json();
    return data;
  },

  async fetchProductDetails(id: string): Promise<Product> {
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Erro ao buscar as informações do produto');
    }

    const data = await response.json();
    return data;
  },

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

  /**
   * Exclui um produto do lojista autenticado.
   *
   * Usa o httpClient (padrão do projeto) em vez de `fetch` cru: ele desserializa
   * o erro padronizado do backend em um `ApiError` com `status` e `code`, que é
   * o que a tela precisa para dar a mensagem certa de 403/404/409/422.
   *
   * Antes daqui saía `new Error(errorData.error)` — e como o backend responde
   * `{ error: { code, message } }`, o toast exibia "[object Object]".
   */
  async deleteProduct(id: string): Promise<void> {
    await httpClient.delete(`/products/${id}`);
  }
};
