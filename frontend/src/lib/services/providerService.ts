import { API_URL, getHeaders } from '../api';

export interface ProviderDetails {
  id: string;
  business_name: string;
  document: string;
  status: string;
  description?: string;
  phone?: string;
  created_at: string;
  user: {
    full_name: string;
    email: string;
    avatar_url?: string;
    role_id: number;
    phone?: string;
  };
  products?: any[];
  services?: any[];
  hourly_rate?: number | string;
  daily_rate?: number | string;
  gallery_images?: string[];
  highlights?: string[];
  amenities?: string[];
  allowed_animals?: string[];
  operating_hours?: any;
  rules_policies?: string;
  sitter_roles?: string[];
  address_line?: string;
  city?: string;
  state?: string;
  postal_code?: string;
}

export const providerService = {
  async fetchCompleteness(): Promise<{ isComplete: boolean; missingFields: string[] }> {
    const response = await fetch(`${API_URL}/providers/completeness`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao buscar completude do perfil');
    }

    const data = await response.json();
    return data;
  },

  async fetchProviderDetails(id: string): Promise<ProviderDetails> {
    const response = await fetch(`${API_URL}/providers/${id}`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao buscar detalhes do parceiro');
    }

    const data = await response.json();
    return data;
  },

  async fetchMe(): Promise<any> {
    const response = await fetch(`${API_URL}/providers/me`, {
      method: 'GET',
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao buscar seu perfil');
    }

    const data = await response.json();
    return data;
  },

  async updateMe(updateData: any): Promise<any> {
    const response = await fetch(`${API_URL}/providers/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao atualizar seu perfil');
    }

    const data = await response.json();
    return data;
  },

  async updatePublicProfile(updateData: any): Promise<any> {
    const response = await fetch(`${API_URL}/providers/profile`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updateData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao atualizar sua vitrine');
    }

    const data = await response.json();
    return data;
  },

  async fetchAllProviders(): Promise<any[]> {
    const response = await fetch(`${API_URL}/providers`, {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Erro ao buscar parceiros');
    }

    const data = await response.json();
    return data;
  }
};
