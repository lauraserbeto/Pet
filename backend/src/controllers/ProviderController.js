const prisma = require('../config/database');
const getProviderDetailsUseCase = require('../useCases/providers/GetProviderDetailsUseCase');
const updateProviderProfileUseCase = require('../useCases/providers/UpdateProviderProfileUseCase');
const updateProviderAccountUseCase = require('../useCases/providers/UpdateProviderAccountUseCase');

class ProviderController {
  // Validador de completitude em memória (JS) para estabilidade de tipagem
  #isProfileComplete(p) {
    // Regras Básicas (Gerais)
    // Flexibilizamos a foto (avatar_url): Se não tiver, ainda consideramos "completo" para listagem, 
    // o frontend lida com o fallback.
    const hasBasicInfo = p.description && p.phone && p.city && p.zip_code;
    
    if (!hasBasicInfo) return false;

    // Regras por Role
    const roleId = p.user?.role_id;

    if (roleId === 3) { // HOTEL
      const hasDailyRate = p.daily_rate && Number(p.daily_rate) > 0;
      const hasImages = Array.isArray(p.gallery_images) && p.gallery_images.length >= 1;
      return !!(hasDailyRate && hasImages);
    }

    if (roleId === 4) { // PET_SITTER
      const hasHourlyRate = p.hourly_rate && Number(p.hourly_rate) > 0;
      const hasRoles = Array.isArray(p.sitter_roles) && p.sitter_roles.length > 0;
      return !!(hasHourlyRate && hasRoles);
    }

    return true; // LOJISTA
  }

  // Lista os status que consideramos como "Aprovado/Visível"
  #getApprovedStatus() {
    return { in: ['APROVADO', 'ATIVO', 'ACTIVE'] };
  }

  async listHotels(req, res) {
    try {
      const providers = await prisma.provider.findMany({
        where: {
          status: this.#getApprovedStatus(),
          user: { role_id: 3 } // HOTEL
        },
        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true
            }
          },
          services: {
            where: { is_active: true },
            take: 3
          }
        }
      });

      const completeHotels = providers.filter(p => this.#isProfileComplete(p));
      return res.status(200).json(completeHotels);
    } catch (error) {
      console.error("[ProviderController] listHotels:", error);
      return res.status(500).json({ error: 'Erro ao listar hotéis' });
    }
  }

  async listSitters(req, res) {
    try {
      const providers = await prisma.provider.findMany({
        where: {
          status: this.#getApprovedStatus(),
          user: { role_id: 4 } // PET_SITTER
        },
        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true
            }
          },
          services: {
            where: { is_active: true },
            take: 3
          }
        }
      });

      const completeSitters = providers.filter(p => this.#isProfileComplete(p));
      return res.status(200).json(completeSitters);
    } catch (error) {
      console.error("[ProviderController] listSitters:", error);
      return res.status(500).json({ error: 'Erro ao listar pet sitters' });
    }
  }

  async listStores(req, res) {
    try {
      const providers = await prisma.provider.findMany({
        where: {
          status: this.#getApprovedStatus(),
          user: { role_id: 2 } // LOJISTA
        },
        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true
            }
          },
          _count: {
            select: { products: true }
          }
        }
      });

      const completeStores = providers.filter(p => this.#isProfileComplete(p));
      return res.status(200).json(completeStores);
    } catch (error) {
      console.error("[ProviderController] listStores:", error);
      return res.status(500).json({ error: 'Erro ao listar lojas' });
    }
  }

  // Lista todos os provedores anexando dados do user (Padrão/Admin)
  async listPartners(req, res) {
    try {
      const providers = await prisma.provider.findMany({
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
              role_id: true,
            }
          }
        }
      });

      // Transforma para o formato esperado pelo frontend
      const mapped = providers.map(p => ({
        ...p,
        full_name: p.user ? p.user.full_name : 'Desconhecido',
        email: p.user ? p.user.email : 'Sem email',
        role_id: p.user ? p.user.role_id : undefined
      }));

      return res.status(200).json(mapped);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar provedores' });
    }
  }

  async getDetails(req, res) {
    try {
      const { id } = req.params;
      const provider = await getProviderDetailsUseCase.execute(id);
      return res.status(200).json(provider);
    } catch (error) {
      console.error("[ProviderController] Erro em getDetails:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  async getMe(req, res) {
    try {
      const userId = req.userId;
      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
        include: { user: true }
      });
      return res.status(200).json(provider);
    } catch (error) {
      console.error("[ProviderController] Erro em getMe:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // Novo endpoint exclusivo para Vitrine/Perfil Público
  async updateProfile(req, res) {
    try {
      const userId = req.userId;
      console.log("[updateProfile] Atualizando vitrine para:", userId);

      const updatedProvider = await updateProviderProfileUseCase.execute(userId, req.body);
      return res.status(200).json(updatedProvider);
    } catch (error) {
      console.error("[ProviderController] Erro em updateProfile:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  // Endpoint para dados básicos de conta
  async updateMe(req, res) {
    try {
      const userId = req.userId;
      console.log("[updateMe] Atualizando conta para:", userId);

      const updatedProvider = await updateProviderAccountUseCase.execute(userId, req.body);
      return res.status(200).json(updatedProvider);
    } catch (error) {
      console.error("[ProviderController] Erro em updateMe:", error.message);
      return res.status(500).json({ error: error.message });
    }
  }

  async getCompleteness(req, res) {
    try {
      const userId = req.userId;
      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
        include: { user: true }
      });

      if (!provider) {
        return res.status(404).json({ error: 'Provedor não encontrado' });
      }

      const missingFields = [];
      const roleName = provider.user.role_id === 3 ? 'HOTEL' : (provider.user.role_id === 4 ? 'PET_SITTER' : 'OTHER');

      // Campos Obrigatórios Gerais
      if (!provider.description) missingFields.push('description');
      if (!provider.phone) missingFields.push('phone');
      if (!provider.user.avatar_url) missingFields.push('avatar_url');
      if (!provider.zip_code) missingFields.push('zip_code');
      if (!provider.city) missingFields.push('city');
      if (!provider.operating_hours || Object.keys(provider.operating_hours).length === 0) missingFields.push('operating_hours');

      // Campos Obrigatórios por Role
      if (roleName === 'HOTEL') {
        if (!provider.daily_rate || Number(provider.daily_rate) <= 0) missingFields.push('daily_rate');
        
        const allowedAnimals = provider.allowed_animals || [];
        if (Array.isArray(allowedAnimals) && allowedAnimals.length < 1) missingFields.push('allowed_animals');
        else if (!Array.isArray(allowedAnimals)) missingFields.push('allowed_animals');

        const amenities = provider.amenities || [];
        if (Array.isArray(amenities) && amenities.length < 1) missingFields.push('amenities');
        else if (!Array.isArray(amenities)) missingFields.push('amenities');

        const galleryImages = provider.gallery_images || [];
        if (Array.isArray(galleryImages) && galleryImages.length < 3) missingFields.push('gallery_images');
        else if (!Array.isArray(galleryImages)) missingFields.push('gallery_images');

      } else if (roleName === 'PET_SITTER') {
        if (!provider.hourly_rate || Number(provider.hourly_rate) <= 0) missingFields.push('hourly_rate');
        
        const sitterRoles = provider.sitter_roles || [];
        if (Array.isArray(sitterRoles) && sitterRoles.length < 1) missingFields.push('sitter_roles');
        else if (!Array.isArray(sitterRoles)) missingFields.push('sitter_roles');
      }

      return res.status(200).json({
        isComplete: missingFields.length === 0,
        missingFields
      });
    } catch (error) {
      console.error("[ProviderController] Erro em getCompleteness:", error);
      return res.status(500).json({ error: 'Erro ao verificar completitude do perfil' });
    }
  }

  // Atualiza status do provedor
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      const updated = await prisma.provider.update({
        where: { id },
        data: {
          status,
          rejection_reason: rejection_reason || null
        }
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar provedor' });
    }
  }
}

module.exports = new ProviderController();
