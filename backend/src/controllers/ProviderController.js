const prisma = require('../config/database');
const getProviderDetailsUseCase = require('../useCases/providers/GetProviderDetailsUseCase');
const updateProviderProfileUseCase = require('../useCases/providers/UpdateProviderProfileUseCase');
const updateProviderAccountUseCase = require('../useCases/providers/UpdateProviderAccountUseCase');

class ProviderController {
  // Lista todos os provedores anexando dados do user
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
