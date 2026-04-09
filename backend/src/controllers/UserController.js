const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

class UserController {
  // Retorna os dados do próprio usuário (utilizado no Perfil)
  async getMe(req, res) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: {
          id: true,
          full_name: true,
          email: true,
          phone: true,
          avatar_url: true,
          role_id: true,
          created_at: true,
        }
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      return res.status(200).json(user);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  // Atualiza os dados pessoais (nome e telefone e foto)
  async updateProfile(req, res) {
    try {
      const { full_name, phone, avatar_url } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { full_name, phone, avatar_url }
      });

      return res.status(200).json({ message: 'Perfil atualizado com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar dados pessoais' });
    }
  }

  // Atualiza a senha
  async updatePassword(req, res) {
    try {
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres' });
      }

      const password_hash = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: req.userId },
        data: { password_hash }
      });

      return res.status(200).json({ message: 'Senha atualizada com sucesso' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao atualizar senha' });
    }
  }
}

module.exports = new UserController();
