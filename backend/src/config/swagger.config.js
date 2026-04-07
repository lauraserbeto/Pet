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
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Servidor Local',
      },
    ],
  },
  // O path.join garante que ele ache a pasta routes independente de onde o terminal foi aberto
  apis: [
    path.join(__dirname, '../server.js'),
    path.join(__dirname, '../routes/*.js'), 
    path.join(__dirname, '../controllers/*.js')
  ], 
};

module.exports = swaggerJsdoc(swaggerOptions);