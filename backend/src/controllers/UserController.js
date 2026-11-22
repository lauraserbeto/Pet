const prisma = require("../config/database");
const changePasswordUseCase = require("../useCases/users/ChangePasswordUseCase");
const AppError = require("../utils/AppError");
const { listUsersQuery } = require("../schemas/userSchemas");
const {
  SubmitSitterEvaluationUseCase,
  ReviewSitterEvaluationUseCase,
} = require("../useCases/users/SitterEvaluationUseCases");
const setUserActiveUseCase = require("../useCases/users/SetUserActiveUseCase");

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
    if (obj[key] !== undefined && obj[key] !== "") acc[key] = obj[key];
    return acc;
  }, {});
}

class UserController {
  // Retorna os dados do próprio usuário (utilizado no Perfil)
  async getMe(req, res, next) {
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
              status: true,
            },
          },
          created_at: true,
        },
      });

      // Formatar o retorno para facilitar o frontend
      if (user && user.provider) {
        user.provider_status = user.provider.status;
        delete user.provider;
      }

      if (!user) {
        throw AppError.notFound("Usuário não encontrado");
      }

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  // Atualiza os dados pessoais (nome, telefone e avatar)
  // Email é imutável por esta rota e é ignorado se enviado.
  async updateProfile(req, res, next) {
    try {
      const data = pickDefined(req.body, ["full_name", "phone", "avatar_url"]);

      if (Object.keys(data).length === 0) {
        throw AppError.badRequest("Nenhum campo válido para atualizar");
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

      await changePasswordUseCase.execute({
        userId: req.userId,
        currentPassword,
        newPassword,
      });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }

  // Envia avaliação de Sitter
  async submitSitterEvaluation(req, res, next) {
    try {
      const { experience_details, environment_photos, quiz_answers } = req.body;
      // Papel, candidatura única e lock no use case (E-11 / DEC-D).
      const evaluation = await new SubmitSitterEvaluationUseCase().execute({
        userId: req.userId,
        userRole: req.userRole,
        experienceDetails: experience_details,
        environmentPhotos: environment_photos,
        quizAnswers: quiz_answers,
      });
      return res
        .status(201)
        .json({ message: "Avaliação enviada com sucesso", evaluation });
    } catch (error) {
      return next(error);
    }
  }

  // --- MÉTODOS DO ADMINISTRADOR ---

  // Lista TODOS os usuários da plataforma (tutores, parceiros e admins).
  // `avatar_url` é omitido de propósito: guarda base64 inline, e trazê-lo para
  // N usuários geraria payload de megabytes.
  async listUsers(req, res, next) {
    try {
      const { page, limit, role_id, q } = listUsersQuery.parse(req.query);

      const where = {
        ...(role_id ? { role_id } : {}),
        ...(q
          ? {
              OR: [
                { full_name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      };

      const [total, users] = await Promise.all([
        prisma.user.count({ where }),
        prisma.user.findMany({
          where,
          select: {
            id: true,
            full_name: true,
            email: true,
            phone: true,
            role_id: true,
            is_active: true,
            onboarding_step: true,
            created_at: true,
            role: { select: { name: true } },
            provider: {
              select: { business_name: true, status: true, document: true },
            },
          },
          orderBy: { created_at: "desc" },
          skip: (page - 1) * limit,
          take: limit,
        }),
      ]);

      res.set({
        "X-Total-Count": String(total),
        "X-Page": String(page),
        "X-Limit": String(limit),
        "X-Total-Pages": String(Math.ceil(total / limit)),
      });
      return res.status(200).json(users);
    } catch (error) {
      if (error?.name === "ZodError") {
        return next(AppError.validation("Parâmetros de listagem inválidos."));
      }
      return next(error);
    }
  }

  // Retorna avaliações filtradas por status
  async getEvaluations(req, res, next) {
    try {
      const { status } = req.query;

      const evaluations = await prisma.sitterEvaluation.findMany({
        where: {
          status: status || "PENDING",
        },
        orderBy: {
          created_at: "desc",
        },
        include: {
          user: {
            select: {
              full_name: true,
              email: true,
            },
          },
        },
      });

      return res.status(200).json(evaluations);
    } catch (error) {
      return next(error);
    }
  }

  // Ativa/desativa uma conta (admin) — E-01, DEC-G. Body e params já validados.
  async setActive(req, res, next) {
    try {
      const user = await setUserActiveUseCase.execute({
        adminId: req.userId,
        targetUserId: req.params.id,
        isActive: req.body.is_active,
      });
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  }

  // Aprova ou Rejeita a avaliação de um Pet Sitter
  async reviewEvaluation(req, res, next) {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body; // APPROVED | REJECTED (feedback obrigatório na recusa)

      // Só candidatura PENDING de Pet Sitter, com lock e estados coerentes (E-11 / DEC-D).
      await new ReviewSitterEvaluationUseCase().execute({
        evaluationId: id,
        status,
        feedback,
      });

      return res
        .status(200)
        .json({ message: `Avaliação processada com sucesso: ${status}` });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
