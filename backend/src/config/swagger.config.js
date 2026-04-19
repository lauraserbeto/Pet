const swaggerJsdoc = require('swagger-jsdoc');
const path = require('path');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Pet+',
      version: '1.0.0',
      description: 'Documentação da API RESTful do sistema Pet+',
    },
    servers: [
      {
        url: `https://pet-plus-production.up.railway.app`,
        description: 'Servidor de Produção',
      },
      {
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor Local',
      },
    ],
  },

  apis: [
    path.join(__dirname, '../server.js'),
    path.join(__dirname, '../routes/*.js'), 
    path.join(__dirname, '../controllers/*.js')
  ], 
};

module.exports = swaggerJsdoc(swaggerOptions);