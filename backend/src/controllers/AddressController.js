const prisma = require("../config/database");
const AppError = require("../utils/AppError");
const CepService = require("../services/CepService");
const mutations = require("../useCases/addresses/AddressMutations");
const normalizeCep = (value) => String(value || "").replace(/\D/g, "");
class AddressController {
  async getAddresses(req, res, next) {
    try {
      return res.json(
        await prisma.address.findMany({
          where: { user_id: req.userId },
          orderBy: [
            { is_default: "desc" },
            { created_at: "desc" },
            { id: "asc" },
          ],
        }),
      );
    } catch (error) {
      return next(error);
    }
  }
  async createAddress(req, res, next) {
    try {
      const payload = { ...req.body, cep: normalizeCep(req.body.cep) };
      await CepService.validate(payload.cep);
      return res.status(201).json(await mutations.create(req.userId, payload));
    } catch (error) {
      return next(error);
    }
  }
  async updateAddress(req, res, next) {
    try {
      const owned = await prisma.address.findFirst({
        where: { id: req.params.id, user_id: req.userId },
        select: { id: true },
      });
      if (!owned) throw AppError.notFound("Endereço não encontrado");
      const payload = { ...req.body };
      if (payload.cep) {
        payload.cep = normalizeCep(payload.cep);
        await CepService.validate(payload.cep);
      }
      delete payload.is_default;
      if (payload.complemento === "") payload.complemento = null;
      return res.json(
        await mutations.update(req.userId, req.params.id, payload),
      );
    } catch (error) {
      return next(error);
    }
  }
  async setDefault(req, res, next) {
    try {
      return res.json(await mutations.setDefault(req.userId, req.params.id));
    } catch (error) {
      return next(error);
    }
  }
  async deleteAddress(req, res, next) {
    try {
      await mutations.remove(req.userId, req.params.id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  }
}
module.exports = new AddressController();
