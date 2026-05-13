const prisma = require('../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const PROFILE_SELECT = {
  id: true,
  full_name: true,
  email: true,
  phone: true,
  avatar_url: true,
  role_id: true,
  onboarding_step: true,
  created_at: true,
};

function pickDefined(obj, keys) {
  return keys.reduce((acc, key) => {
    if (obj[key] !== undefined && obj[key] !== '') acc[key] = obj[key];
    return acc;
  }, {});
}

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

  // Atualiza os dados pessoais (nome, telefone e avatar)
  // Email é imutável por esta rota e é ignorado se enviado.
  async updateProfile(req, res, next) {
    try {
      const data = pickDefined(req.body, ['full_name', 'phone', 'avatar_url']);

      if (Object.keys(data).length === 0) {
        throw AppError.badRequest('Nenhum campo válido para atualizar');
      }

      const user = await prisma.user.update({
        where: { id: req.userId },
        data,
        select: PROFILE_SELECT,
      });

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  // Upload de avatar via base64 data URL.
  // NOTA: armazenamos a string base64 inline em `avatar_url` (campo Text).
  // Trade-off conhecido: aumenta o payload do `/users/me` em ~2MB no pior caso.
  // Migrar para storage externo (Cloudinary/S3) é dívida registrada no plano.
  async uploadAvatar(req, res, next) {
    try {
      const { image } = req.body;

      const user = await prisma.user.update({
        where: { id: req.userId },
        data: { avatar_url: image },
        select: PROFILE_SELECT,
      });

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  // Atualiza a senha — requer senha atual válida
  async updatePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { password_hash: true },
      });

      if (!user?.password_hash) {
        throw AppError.unauthorized('Usuário não possui senha definida');
      }

      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        throw AppError.unauthorized('Senha atual incorreta');
      }

      const password_hash = await bcrypt.hash(newPassword, 10);

      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.userId },
          data: { password_hash },
        }),
        // invalida todos os tokens de reset pendentes
        prisma.passwordResetToken.updateMany({
          where: { user_id: req.userId, used: false },
          data: { used: true },
        }),
      ]);

      return res.status(204).send();
    } catch (error) {
      return next(error);
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
          status: 'PENDING'
        }
      });

      // 2. Atualizar o onboarding_step do User
      await prisma.$transaction([
        prisma.user.update({
          where: { id: req.userId },
          data: { onboarding_step: 'IN_REVIEW' }
        })
      ]);

      return res.status(201).json({ message: 'Avaliação enviada com sucesso', evaluation });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Erro ao enviar avaliação de Sitter' });
    }
  }

  // --- MÉTODOS DO ADMINISTRADOR ---

  // Retorna avaliações filtradas por status
  async getEvaluations(req, res) {
    try {
      const { status } = req.query;
      
      const evaluations = await prisma.sitterEvaluation.findMany({
        where: {
          status: status || 'PENDING'
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
      return res.status(500).json({ error: 'Erro ao buscar avaliações' });
    }
  }

  // Aprova ou Rejeita a avaliação de um Pet Sitter
  async reviewEvaluation(req, res) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body; // status: APPROVED or REJECTED

      // Verifica se a avaliação existe
      const evaluation = await prisma.sitterEvaluation.findUnique({
        where: { id }
      });

      if (!evaluation) {
        return res.status(404).json({ error: 'Avaliação não encontrada' });
      }

      // Prepara as atualizações em transação
      const targetUserStatus = status === 'APPROVED' ? 'COMPLETED' : 'REJECTED';

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
        if (status === 'APPROVED') {
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
