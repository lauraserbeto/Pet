require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');

const prisma = require('./config/database');
const swaggerDocs = require('./config/swagger.config');

const app = express();

const authRoutes = require('./routes/authRoutes');
const providerRoutes = require('./routes/providerRoutes');

// Middlewares Globais
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'https://petplus-frontend.vercel.app', 'https://petplus.vercel.app'], 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Documentação Swagger
app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/users', require('./routes/userRoutes'));
app.use('/api/v1/addresses', require('./routes/addressRoutes'));
app.use('/api/v1/products', require('./routes/productsRoutes'));

// INICIALIZAÇÃO
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
  console.log(`📚 Acesso local do Swagger: http://localhost:${PORT}/swagger`);
});