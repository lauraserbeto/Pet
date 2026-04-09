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
          onboarding_step: true,
          provider: {
            select: {
              status: true
            }
          },
          created_at: true,
        }
      });

      // Formatar o retorno para facilitar o frontend
      if (user && user.provider) {
        user.provider_status = user.provider.status;
        delete user.provider;
      }

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

  // Envia avaliação de Sitter
  async submitSitterEvaluation(req, res) {
    try {
      const { experience_details, environment_photos, quiz_answers } = req.body;

      // 1. Criar o registro de SitterEvaluation
      const evaluation = await prisma.sitterEvaluation.create({
        data: {
          user_id: req.userId,
          experience_details: typeof experience_details === 'string' ? experience_details : JSON.stringify(experience_details),
          environment_photos, // array of base64 ou urls
          quiz_answers,
          status: 'PENDENTE'
        }
      });

      // 2. Atualizar o onboarding_step do User
      await prisma.user.update({
        where: { id: req.userId },
        data: { onboarding_step: 'IN_REVIEW' }
      });

      return res.status(201).json({ message: 'Avaliação enviada com sucesso', evaluation });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao enviar avaliação de Sitter' });
    }
  }

  // --- MÉTODOS DO ADMINISTRADOR ---

  // Retorna todas as avaliações pendentes
  async getPendingEvaluations(req, res) {
    try {
      const evaluations = await prisma.sitterEvaluation.findMany({
        where: {
          status: 'PENDENTE'
        },
        orderBy: {
          created_at: 'desc'
        },
        include: {
          user: {
            select: {
              full_name: true,
              email: true
            }
          }
        }
      });

      return res.status(200).json(evaluations);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao buscar avaliações pendentes' });
    }
  }

  // Aprova ou Rejeita a avaliação de um Pet Sitter
  async reviewEvaluation(req, res) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;

      // Verifica se a avaliação existe
      const evaluation = await prisma.sitterEvaluation.findUnique({
        where: { id }
      });

      if (!evaluation) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      // Prepara as atualizações em transação
      const targetUserStatus = status === 'APROVADO' ? 'COMPLETED' : 'REJECTED';

      await prisma.$transaction(async (tx) => {
        // 1. Atualizar a evaluation
        await tx.sitterEvaluation.update({
          where: { id },
          data: {
            status,
            feedback: feedback || null
          }
        });

        // 2. Atualizar o usuário
        await tx.user.update({
          where: { id: evaluation.user_id },
          data: {
            onboarding_step: targetUserStatus
          }
        });

        // 3. Atualizar provider do usuário se for aprovado
        if (status === 'APROVADO') {
          // Precisamos encontrar se ele tem um provider
          const provider = await tx.provider.findUnique({
            where: { user_id: evaluation.user_id }
          });
          if (provider) {
             await tx.provider.update({
               where: { user_id: evaluation.user_id },
               data: { status: 'ATIVO' }
             });
          }
        }

      });

      return res.status(200).json({ message: `Avaliação processada com sucesso: ${status}` });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao processar avaliação' });
    }
  }

}

module.exports = new UserController();
