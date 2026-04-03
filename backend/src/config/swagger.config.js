const swaggerJsdoc = require('swagger-jsdoc');

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
  apis: ['./src/routes/*.js', './src/controllers/*.js'], 
};

module.exports = swaggerJsdoc(swaggerOptions);