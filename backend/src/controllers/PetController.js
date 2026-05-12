const PetRepository = require('../repositories/PetRepository');
const AppError = require('../utils/AppError');

const MAX_PETS_PER_TUTOR = 10;

function normalizePayload(input) {
  const data = { ...input };
  if (data.breed === '') data.breed = null;
  if (data.medical_notes === '') data.medical_notes = null;
  if (data.birth_date) data.birth_date = new Date(data.birth_date);
  if (data.weight_kg !== undefined) {
    data.weight_kg = data.weight_kg === null ? null : Number(data.weight_kg);
  }
  return data;
}

class PetController {
  async listMyPets(req, res, next) {
    try {
      const pets = await PetRepository.findManyByTutor(req.userId);
      return res.status(200).json(pets);
    } catch (err) {
      return next(err);
    }
  }

  async getPet(req, res, next) {
    try {
      const pet = await PetRepository.findByIdAndTutor(req.params.id, req.userId);
      if (!pet) throw AppError.notFound('Pet não encontrado');
      return res.status(200).json(pet);
    } catch (err) {
      return next(err);
    }
  }

  async createPet(req, res, next) {
    try {
      const count = await PetRepository.countByTutor(req.userId);
      if (count >= MAX_PETS_PER_TUTOR) {
        throw AppError.conflict(`Limite de ${MAX_PETS_PER_TUTOR} pets por tutor atingido`);
      }

      const data = normalizePayload(req.body);
      const pet = await PetRepository.create({
        ...data,
        tutor_id: req.userId,
      });
      return res.status(201).json(pet);
    } catch (err) {
      return next(err);
    }
  }

  async updatePet(req, res, next) {
    try {
      const owned = await PetRepository.findByIdAndTutor(req.params.id, req.userId);
      if (!owned) throw AppError.notFound('Pet não encontrado');

      const data = normalizePayload(req.body);
      const pet = await PetRepository.update(req.params.id, data);
      return res.status(200).json(pet);
    } catch (err) {
      return next(err);
    }
  }

  async deletePet(req, res, next) {
    try {
      const owned = await PetRepository.findByIdAndTutor(req.params.id, req.userId);
      if (!owned) throw AppError.notFound('Pet não encontrado');

      const activeAppointments = await PetRepository.countActiveAppointments(req.params.id);
      if (activeAppointments > 0) {
        throw AppError.conflict(
          'Não é possível remover este pet enquanto houver agendamentos pendentes ou confirmados'
        );
      }

      await PetRepository.delete(req.params.id);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  }
}

module.exports = new PetController();
