require('dotenv').config();
// Valida variáveis de ambiente obrigatórias no boot (fail-fast).
// Se JWT_SECRET estiver ausente, a aplicação não sobe.
require('./config/env');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');

const prisma = require('./config/database');
const swaggerDocs = require('./config/swagger.config');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');

const app = express();

// Necessário para o express-rate-limit identificar o IP real atrás do proxy
// da plataforma (Railway) via X-Forwarded-For. '1' confia apenas no primeiro hop.
app.set('trust proxy', 1);

const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');

// Limitador para as rotas de autenticação — mitiga força bruta e enumeração
// em login, recuperação de senha, registro e reset.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20,                  // 20 requisições por IP por janela nas rotas de auth
  standardHeaders: true,    // expõe cabeçalhos RateLimit-*
  legacyHeaders: false,
  message: {
    error: { code: 'RATE_LIMITED', message: 'Muitas tentativas. Tente novamente em alguns minutos.' },
    message: 'Muitas tentativas. Tente novamente em alguns minutos.',
  },
});

// Middlewares Globais
// Helmet: cabeçalhos de segurança (HSTS, X-Content-Type-Options, frameguard, etc.).
// CSP desativado aqui — é responsabilidade do frontend (PET-10) e evita quebrar o Swagger UI.
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://petplus-frontend.vercel.app', 'https://petplus.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Verifica a saúde da API e a conexão com o banco
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API e Banco operacionais
 */
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      status: 'success',
      message: 'API rodando e conectada ao PostgreSQL!'
    });
  } catch (error) {
    console.error('Erro no Banco de Dados:', error);
    res.status(500).json({ status: 'error', message: 'Falha no banco de dados.' });
  }
});

// Rotas do Sistema
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/users/me/pets', require('./routes/petRoutes'));
app.use('/api/v1/addresses', require('./routes/addressRoutes'));
app.use('/api/v1/products', require('./routes/productsRoutes'));
app.use('/api/v1/favorites', require('./routes/favoriteRoutes'));
app.use('/api/v1/cart', require('./routes/cartRoutes'));

// 404 + Error Handler (devem ser os últimos)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
