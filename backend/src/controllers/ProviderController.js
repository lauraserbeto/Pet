const prisma = require('../config/database');

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
        id: p.id,
        user_id: p.user_id,
        business_name: p.business_name,
        document: p.document,
        status: p.status,
        rejection_reason: p.rejection_reason,
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
