const prisma = require('../config/database');
const AppError = require('../utils/AppError');
const CepService = require('../services/CepService');

const MAX_ADDRESSES_PER_USER = 5;
const BLOCKING_ORDER_STATUSES = ['PENDING', 'PREPARING', 'SHIPPED'];

function normalizeCep(cep) {
  return String(cep || '').replace(/\D/g, '');
}

class AddressController {
  // Lista todos os endereços do usuário (default primeiro, depois mais recentes)
  async getAddresses(req, res, next) {
    try {
      const addresses = await prisma.address.findMany({
        where: { user_id: req.userId },
        orderBy: [{ is_default: 'desc' }, { created_at: 'desc' }],
      });
      return res.status(200).json(addresses);
    } catch (error) {
      return next(error);
    }
  }

  // Cria um novo endereço
  async createAddress(req, res, next) {
    try {
      const count = await prisma.address.count({ where: { user_id: req.userId } });
      if (count >= MAX_ADDRESSES_PER_USER) {
        throw AppError.conflict(
          `Limite de ${MAX_ADDRESSES_PER_USER} endereços por usuário atingido`
        );
      }

      const payload = { ...req.body };
      payload.cep = normalizeCep(payload.cep);
      await CepService.validate(payload.cep);

      const shouldBeDefault = count === 0;

      const address = await prisma.address.create({
        data: {
          user_id: req.userId,
          cep: payload.cep,
          rua: payload.rua,
          numero: payload.numero,
          complemento: payload.complemento || null,
          bairro: payload.bairro,
          cidade: payload.cidade,
          estado: payload.estado,
          is_default: shouldBeDefault,
        },
      });

      return res.status(201).json(address);
    } catch (error) {
      return next(error);
    }
  }

  // Atualiza um endereço existente (não muda is_default — usar setDefault)
  async updateAddress(req, res, next) {
    try {
      const { id } = req.params;
      const owned = await prisma.address.findFirst({
        where: { id, user_id: req.userId },
        select: { id: true },
      });
      if (!owned) throw AppError.notFound('Endereço não encontrado');

      const payload = { ...req.body };
      if (payload.cep) {
        payload.cep = normalizeCep(payload.cep);
        await CepService.validate(payload.cep);
      }
      // is_default é controlado por endpoint dedicado
      delete payload.is_default;
      if (payload.complemento === '') payload.complemento = null;

      const updated = await prisma.address.update({
        where: { id },
        data: payload,
      });

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  }

  // Define um endereço como principal (transação: zera os outros, marca o alvo)
  async setDefault(req, res, next) {
    try {
      const { id } = req.params;

      const target = await prisma.address.findFirst({
        where: { id, user_id: req.userId },
        select: { id: true, is_default: true },
      });
      if (!target) throw AppError.notFound('Endereço não encontrado');

      if (target.is_default) {
        const current = await prisma.address.findUnique({ where: { id } });
        return res.status(200).json(current);
      }

      const updated = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { user_id: req.userId, is_default: true },
          data: { is_default: false },
        });
        return tx.address.update({
          where: { id },
          data: { is_default: true },
        });
      });

      return res.status(200).json(updated);
    } catch (error) {
      return next(error);
    }
  }

  // Exclui um endereço. Regras:
  //  - Se for o último endereço E houver pedidos PENDING/PREPARING/SHIPPED do usuário → 409
  //  - Se for default e existirem outros → promove o mais recente a default na mesma transação
  async deleteAddress(req, res, next) {
    try {
      const { id } = req.params;
      const address = await prisma.address.findFirst({
        where: { id, user_id: req.userId },
      });
      if (!address) throw AppError.notFound('Endereço não encontrado');

      const totalCount = await prisma.address.count({ where: { user_id: req.userId } });

      if (totalCount === 1) {
        const blockingOrders = await prisma.order.count({
          where: {
            customer_id: req.userId,
            status: { in: BLOCKING_ORDER_STATUSES },
          },
        });
        if (blockingOrders > 0) {
          throw AppError.conflict(
            'Não é possível excluir o único endereço enquanto houver pedidos em andamento'
          );
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.address.delete({ where: { id } });

        if (address.is_default && totalCount > 1) {
          const next = await tx.address.findFirst({
            where: { user_id: req.userId },
            orderBy: { created_at: 'desc' },
            select: { id: true },
          });
          if (next) {
            await tx.address.update({
              where: { id: next.id },
              data: { is_default: true },
            });
          }
        }
      });

      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AddressController();
