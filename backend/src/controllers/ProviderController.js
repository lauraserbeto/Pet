const prisma = require("../config/database");
const reviewRepository = require("../repositories/ReviewRepository");
const {
  getProfileCompleteness,
  isPublicProfileComplete,
} = require("../utils/profileCompleteness");
const {
  UpdateProviderStatusUseCase,
} = require("../useCases/providers/UpdateProviderStatusUseCase");
const getProviderDetailsUseCase = require("../useCases/providers/GetProviderDetailsUseCase");
const updateProviderProfileUseCase = require("../useCases/providers/UpdateProviderProfileUseCase");
const updateProviderAccountUseCase = require("../useCases/providers/UpdateProviderAccountUseCase");
const {
  PROVIDER_STATUS,
  isOperationalSitter,
} = require("../constants/providerStatus");
const {
  PROVIDER_ROLES,
  operationalProviderWhere,
} = require("../useCases/providers/providerAccess");
const {
  toPublicProvider,
  toPublicProviders,
} = require("../utils/publicProvider");
const {
  ADMIN_PROVIDER_SELECT,
  toAdminProviders,
} = require("../utils/adminProvider");
const emailService = require("../services/EmailService");
const logger = require("../config/logger");
const { FRONTEND_URL } = require("../config/env");
const AppError = require("../utils/AppError");
const getProviderMetricsUseCase = require("../useCases/providers/GetProviderMetricsUseCase");
const { metricsQuery } = require("../schemas/adminSchemas");

class ProviderController {
  async getMetrics(req, res, next) {
    try {
      const { days } = metricsQuery.parse(req.query);
      return res.json(
        await getProviderMetricsUseCase.execute({
          userId: req.userId,
          userRole: req.userRole,
          days,
        }),
      );
    } catch (error) {
      return next(
        error?.name === "ZodError"
          ? AppError.validation(
              "Parâmetros de métricas inválidos (days entre 1 e 365).",
            )
          : error,
      );
    }
  }

  // Vitrine: mesma regra usada por /providers/completeness (utils/profileCompleteness).
  #isProfileComplete(p) {
    return isPublicProfileComplete(p);
  }

  #withoutSitterEvaluationProbe(provider) {
    const { sitter_evaluations: _omit, ...user } = provider.user || {};
    return { ...provider, user };
  }

  async listHotels(req, res, next) {
    try {
      const providers = await prisma.provider.findMany({
        // Vitrine: hotel aprovado, com conta ativa e pelo menos um serviço ativo.
        where: {
          ...operationalProviderWhere({ roleId: PROVIDER_ROLES.HOTEL }),
          services: {
            some: {
              is_active: true,
            },
          },
        },

        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true,
            },
          },

          services: {
            where: { is_active: true },
            orderBy: { price: "asc" },
            select: {
              id: true,
              name: true,
              price: true,
              is_active: true,
            },
          },
        },
      });

      const completeHotels = providers.filter((p) =>
        this.#isProfileComplete(p),
      );

      const hotelsWithStartingPrice = completeHotels.map((p) => ({
        ...p,
        starting_price:
          p.services.length > 0 ? Number(p.services[0].price) : null,
        services: p.services.map((service) => ({
          ...service,
          price: Number(service.price),
        })),
      }));

      const ratedHotels = await reviewRepository.withProviderRatings(
        hotelsWithStartingPrice,
      );
      return res.status(200).json(toPublicProviders(ratedHotels));
    } catch (error) {
      return next(error);
    }
  }

  async listSitters(req, res, next) {
    try {
      const providers = await prisma.provider.findMany({
        // Vitrine: sitter aprovado, com conta ativa, avaliação aprovada e serviço ativo.
        where: {
          ...operationalProviderWhere({ roleId: PROVIDER_ROLES.PET_SITTER }),
          services: {
            some: {
              is_active: true,
            },
          },
        },

        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true,
              sitter_evaluations: {
                where: { status: "APPROVED" },
                select: {
                  id: true,
                  status: true,
                },
                take: 1,
              },
            },
          },

          services: {
            where: { is_active: true },
            orderBy: { price: "asc" },
            select: {
              id: true,
              name: true,
              price: true,
              is_active: true,
            },
          },
        },
      });

      const completeSitters = providers
        .filter((p) => isOperationalSitter(p) && this.#isProfileComplete(p))
        .map((p) => ({
          ...p,
          starting_price:
            p.services.length > 0 ? Number(p.services[0].price) : null,
          services: p.services.map((service) => ({
            ...service,
            price: Number(service.price),
          })),
        }))
        .map((p) => this.#withoutSitterEvaluationProbe(p));

      const ratedSitters =
        await reviewRepository.withProviderRatings(completeSitters);
      return res.status(200).json(toPublicProviders(ratedSitters));
    } catch (error) {
      return next(error);
    }
  }

  async listStores(req, res, next) {
    try {
      const providers = await prisma.provider.findMany({
        // Vitrine: lojista aprovado e com conta ativa (E-01).
        where: operationalProviderWhere({ roleId: PROVIDER_ROLES.STORE }),

        include: {
          user: {
            select: {
              full_name: true,
              avatar_url: true,
              role_id: true,
            },
          },

          _count: {
            select: { products: true },
          },
        },
      });

      const completeStores = providers.filter((p) =>
        this.#isProfileComplete(p),
      );

      return res.status(200).json(toPublicProviders(completeStores));
    } catch (error) {
      return next(error);
    }
  }

  // Listagem administrativa de parceiros (E-02): rota exclusiva do admin, com
  // os dados de moderação (CPF/CNPJ, motivo da recusa e estado da conta).
  async listPartners(req, res, next) {
    try {
      const providers = await prisma.provider.findMany({
        select: ADMIN_PROVIDER_SELECT,
      });

      return res.status(200).json(toAdminProviders(providers));
    } catch (error) {
      return next(error);
    }
  }

  async getDetails(req, res, next) {
    try {
      const { id } = req.params;
      const provider = await getProviderDetailsUseCase.execute(id);

      // Rota pública: o detalhe do parceiro também não pode carregar CPF/CNPJ.
      return res.status(200).json(toPublicProvider(provider));
    } catch (error) {
      return next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      const userId = req.userId;

      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
              role_id: true,
              phone: true,
            },
          },
        },
      });

      if (!provider) throw AppError.notFound("Parceiro não encontrado");
      return res.status(200).json(provider);
    } catch (error) {
      return next(error);
    }
  }

  // Novo endpoint exclusivo para Vitrine/Perfil Público
  async updateProfile(req, res, next) {
    try {
      const userId = req.userId;

      const updatedProvider = await updateProviderProfileUseCase.execute(
        userId,
        req.body,
      );

      return res.status(200).json(updatedProvider);
    } catch (error) {
      return next(error);
    }
  }

  // Endpoint para dados básicos de conta
  async updateMe(req, res, next) {
    try {
      const userId = req.userId;

      const updatedProvider = await updateProviderAccountUseCase.execute(
        userId,
        req.body,
      );

      return res.status(200).json(updatedProvider);
    } catch (error) {
      return next(error);
    }
  }

  async getCompleteness(req, res, next) {
    try {
      const userId = req.userId;

      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
        include: {
          user: {
            select: {
              id: true,
              full_name: true,
              email: true,
              avatar_url: true,
              role_id: true,
              phone: true,
            },
          },

          services: {
            where: {
              is_active: true,
            },
            select: {
              id: true,
            },
          },
        },
      });

      if (!provider) {
        throw AppError.notFound("Parceiro não encontrado");
      }

      // Mesma regra da vitrine. `isComplete`/`missingFields` mantêm o contrato
      // anterior, agora restritos ao que de fato impede a publicação;
      // `recommendedFields` lista o que melhora o perfil sem bloquear (G12).
      const { isPublic, required, recommended } =
        getProfileCompleteness(provider);

      return res.status(200).json({
        isComplete: isPublic,
        missingFields: required,
        recommendedFields: recommended,
      });
    } catch (error) {
      return next(error);
    }
  }

  // Atualiza status do provedor (admin)
  async updateStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, rejection_reason } = req.body;

      // Transição validada e serializada no use case (E-11 / AUD-15, DEC-D).
      const { updated, email } = await new UpdateProviderStatusUseCase().execute({
        providerId: id,
        status,
        rejectionReason: rejection_reason,
      });

      // Dispara e-mail de recusa após o commit — falha não reverte a persistência
      if (status === PROVIDER_STATUS.REJECTED && email) {
        const correctionUrl = `${FRONTEND_URL}/parceiro/corrigir-cadastro`;

        try {
          await emailService.sendRejection(email, {
            reason: rejection_reason,
            correctionUrl,
          });
        } catch (err) {
          logger.error(
            { err, providerId: id },
            "[ProviderController] Falha ao enviar e-mail de recusa",
          );
        }
      }

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  }

  // Endpoint de reenvio: parceiro REJEITADO move o próprio cadastro para EM_REVISAO
  async resubmit(req, res, next) {
    try {
      const userId = req.userId;

      const provider = await prisma.provider.findUnique({
        where: { user_id: userId },
      });

      if (!provider) {
        return next(AppError.notFound("Perfil de parceiro não encontrado"));
      }

      if (provider.status !== PROVIDER_STATUS.REJECTED) {
        return next(
          AppError.badRequest(
            `Reenvio só é permitido a partir do status REJEITADO. Status atual: ${provider.status}`,
          ),
        );
      }

      // Condicional ao status lido: um reenvio concorrente com a decisão do
      // admin não sobrescreve uma aprovação/recusa já gravada (E-11).
      const { count } = await prisma.provider.updateMany({
        where: { id: provider.id, status: PROVIDER_STATUS.REJECTED },
        data: { status: PROVIDER_STATUS.IN_REVIEW },
      });
      if (count !== 1) {
        return next(
          AppError.conflict(
            "O status do cadastro mudou durante o reenvio. Recarregue a página.",
          ),
        );
      }

      const updated = await prisma.provider.findUnique({
        where: { id: provider.id },
      });
      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new ProviderController();
