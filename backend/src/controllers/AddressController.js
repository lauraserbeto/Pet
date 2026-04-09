const prisma = require('../config/database');

class AddressController {
  // Retorna todos os endereços do usuário
  async getAddresses(req, res) {
    try {
      const addresses = await prisma.address.findMany({
        where: { user_id: req.userId },
        orderBy: { created_at: 'desc' }
      });
      return res.status(200).json(addresses);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao listar endereços' });
    }
  }

  // Cria um novo endereço
  async createAddress(req, res) {
    try {
      const { cep, rua, numero, complemento, bairro, cidade, estado } = req.body;

      if (!cep || !rua || !numero || !bairro || !cidade || !estado) {
        return res.status(400).json({ error: 'Campos obrigatórios faltando' });
      }

      const address = await prisma.address.create({
        data: {
          user_id: req.userId,
          cep, rua, numero, complemento, bairro, cidade, estado
        }
      });

      return res.status(201).json(address);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao criar endereço' });
    }
  }

  // Atualiza um endereço existente
  async updateAddress(req, res) {
    try {
      const { id } = req.params;
      const { cep, rua, numero, complemento, bairro, cidade, estado } = req.body;

      // Verifica se o endereço pertence ao usuário
      const address = await prisma.address.findFirst({
        where: { id, user_id: req.userId }
      });

      if (!address) {
        return res.status(404).json({ error: 'Endereço não encontrado ou você não tem permissão' });
      }

      const updated = await prisma.address.update({
        where: { id },
        data: { cep, rua, numero, complemento, bairro, cidade, estado }
      });

      return res.status(200).json(updated);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar endereço' });
    }
  }

  // Exclui um endereço
  async deleteAddress(req, res) {
    try {
      const { id } = req.params;

      const address = await prisma.address.findFirst({
        where: { id, user_id: req.userId }
      });

      if (!address) {
        return res.status(404).json({ error: 'Endereço não encontrado ou você não tem permissão' });
      }

      await prisma.address.delete({ where: { id } });

      return res.status(200).json({ message: 'Endereço excluído com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao excluir endereço' });
    }
  }
}

module.exports = new AddressController();
