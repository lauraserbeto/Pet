const express = require("express");
const router = express.Router();
const ProviderController = require("../controllers/ProviderController");
const OrderController = require("../controllers/OrderController");
const authMiddleware = require("../middlewares/authMiddleware");
const adminMiddleware = require("../middlewares/adminMiddleware");
const providerMiddleware = require("../middlewares/providerMiddleware");
const validate = require("../middlewares/validate");

/**
 * @swagger
 * /api/v1/providers/me/metrics:
 *   get:
 *     summary: Métricas do parceiro autenticado (aprovado), sem acesso cruzado
 *     description: Janela de dias civis em America/Sao_Paulo. Pedidos e reservas por criação. Receita reconhecida nos estados PAGO/PREPARANDO/ENVIADO/CONCLUIDO; cancelados e tentativas não aprovadas ficam fora. Não representa saldo disponível. Pagamentos simulados de agendamentos usam paid_at/refunded_at e ficam separados.
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema: { type: integer, default: 30, minimum: 1, maximum: 365 }
 *     responses:
 *       200:
 *         description: commerce com orders, appointments, revenue/daily, appointment_payments, service_mix e dez registros recentes de cada tipo; totais do período completo.
 *       401:
 *         description: Sessão inválida
 *       403:
 *         description: Perfil não permitido ou parceiro não aprovado
 *       422:
 *         description: Janela inválida
 */
router.get("/me/metrics", authMiddleware, ProviderController.getMetrics);
const {
  providerIdParamsSchema,
  updateProviderStatusSchema,
  updateProviderProfileSchema,
  updateProviderAccountSchema,
} = require("../schemas/providerSchemas");

/**
 * @swagger
 * /api/v1/providers/orders:
 *   get:
 *     summary: Lista os pedidos recebidos pelo parceiro autenticado
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     description: "Sem view mantém array e headers. view=page retorna orders, total, page, limit, totalPages, summary global (independente de q/página), receita por criação no mês civil de São Paulo conforme DSH. Query inválida retorna 422."
 *     parameters:
 *       - in: query
 *         name: view
 *         schema: { type: string, enum: [page] }
 *       - in: query
 *         name: q
 *         description: Busca literal por ID parcial, nome ou e-mail do cliente em todos os pedidos próprios
 *         schema: { type: string, maxLength: 100 }

 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Lista de pedidos recebidos
 *         headers:
 *           X-Total-Count:
 *             schema:
 *               type: integer
 *           X-Page:
 *             schema:
 *               type: integer
 *           X-Limit:
 *             schema:
 *               type: integer
 *           X-Total-Pages:
 *             schema:
 *               type: integer
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso restrito a parceiros cadastrados
 */
router.get("/orders", authMiddleware, OrderController.listReceived);

/**
 * @swagger
 * /api/v1/providers/hotels:
 *   get:
 *     summary: Lista hotéis ativos
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de hotéis, incluindo rating_avg e rating_count reais por parceiro
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReviewSummary'
 */
router.get("/hotels", (req, res, next) =>
  ProviderController.listHotels(req, res, next),
);

/**
 * @swagger
 * /api/v1/providers/sitters:
 *   get:
 *     summary: Lista pet sitters ativos
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de pet sitters, incluindo rating_avg e rating_count reais por parceiro
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReviewSummary'
 */
router.get("/sitters", (req, res, next) =>
  ProviderController.listSitters(req, res, next),
);

/**
 * @swagger
 * /api/v1/providers/stores:
 *   get:
 *     summary: Lista lojistas ativos/aprovados
 *     tags: [Providers]
 *     responses:
 *       200:
 *         description: Lista de lojistas
 */
router.get("/stores", (req, res, next) =>
  ProviderController.listStores(req, res, next),
);

/**
 * @swagger
 * /api/v1/providers:
 *   get:
 *     summary: Lista todos os parceiros para moderação (somente admin)
 *     description: Inclui CPF/CNPJ, motivo da recusa e estado da conta. Usada pelo painel de aprovações.
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de parceiros com dados de moderação
 *       401:
 *         description: Não autenticado
 *       403:
 *         description: Acesso restrito a administradores
 */
// A listagem expõe dados de moderação (e-mail, CPF/CNPJ, motivo da recusa) e
// por isso é exclusiva do admin; as vitrines públicas usam /hotels, /sitters e /stores.
router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  ProviderController.listPartners,
);

/**
 * @swagger
 * /api/v1/providers/me:
 *   get:
 *     summary: Retorna dados do parceiro logado
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados do parceiro
 *       401:
 *         description: Não autorizado
 */
router.get("/me", authMiddleware, providerMiddleware, ProviderController.getMe);

/**
 * @swagger
 * /api/v1/providers/completeness:
 *   get:
 *     summary: Verifica se o parceiro logado finalizou o cadastro do seu perfil público
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dados de completitude
 */
router.get(
  "/completeness",
  authMiddleware,
  providerMiddleware,
  ProviderController.getCompleteness,
);

/**
 * @swagger
 * /api/v1/providers/me/resubmit:
 *   post:
 *     summary: Reenvio do cadastro após recusa — move o status de REJEITADO para EM_REVISAO
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cadastro reenviado para revisão
 *       400:
 *         description: Status atual não permite reenvio
 *       401:
 *         description: Não autenticado
 *       404:
 *         description: Perfil de parceiro não encontrado
 */
router.post("/me/resubmit", authMiddleware, ProviderController.resubmit);

/**
 * @swagger
 * /api/v1/providers/me:
 *   put:
 *     summary: Atualiza dados de conta do parceiro
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Parceiro atualizado
 */
router.put(
  "/me",
  authMiddleware,
  providerMiddleware,
  validate({ body: updateProviderAccountSchema }),
  ProviderController.updateMe,
);

/**
 * @swagger
 * /api/v1/providers/profile:
 *   put:
 *     summary: Atualiza dados do perfil público
 *     description: |
 *       Envie só os campos alterados. Imagens (avatar_url e gallery_images) são
 *       data URL JPEG/PNG/WebP de até 2 MB ou URL https; a galeria tem no máximo 8 fotos.
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               avatar_url:
 *                 type: string
 *               gallery_images:
 *                 type: array
 *                 maxItems: 8
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       413:
 *         description: Corpo acima do limite da rota (PAYLOAD_TOO_LARGE)
 *       422:
 *         description: Imagem de tipo não permitido, acima de 2 MB, galeria com mais de 8 fotos ou campo inválido
 */
router.put(
  "/profile",
  authMiddleware,
  providerMiddleware,
  validate({ body: updateProviderProfileSchema }),
  ProviderController.updateProfile,
);

/**
 * @swagger
 * /api/v1/providers/{id}:
 *   get:
 *     summary: Retorna detalhes de um parceiro específico
 *     tags: [Providers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do parceiro com rating_avg/rating_count e agregados dos produtos públicos incluídos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewSummary'
 *       404:
 *         description: Parceiro inexistente, não aprovado ou com conta desativada
 *       422:
 *         description: id inválido
 */
router.get(
  "/:id",
  validate({ params: providerIdParamsSchema }),
  ProviderController.getDetails,
);

/**
 * @swagger
 * /api/v1/providers/{id}/status:
 *   patch:
 *     summary: Atualiza o status de aprovação de um parceiro (Admin)
 *     tags: [Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDENTE, EM_REVISAO, APROVADO, REJEITADO]
 *     responses:
 *       200:
 *         description: Status atualizado
 */
// Aprovar/recusar parceiro é ação exclusiva do admin. Sem estes middlewares a
// rota ficava aberta, permitindo auto-aprovação por qualquer um sem token.
router.patch(
  "/:id/status",
  authMiddleware,
  adminMiddleware,
  validate({
    params: providerIdParamsSchema,
    body: updateProviderStatusSchema,
  }),
  ProviderController.updateStatus,
);

module.exports = router;
