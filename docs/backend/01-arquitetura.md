# 01. Arquitetura do Servidor

O backend do Pet+ segue princípios de separação de responsabilidades (Separation of Concerns), utilizando o Express como framework de roteamento e o Prisma como motor de persistência.

## Estrutura de Pastas (`backend/src/`)

- **`config/`**: Centraliza as configurações de infraestrutura (Banco de Dados, Swagger, Variáveis Globais).
- **`routes/`**: Define os endpoints da API e vincula-os aos controladores.
- **`controllers/`**: Responsável pela interface HTTP. Ele recebe a requisição, valida dados básicos e delega a lógica para os Use Cases.
- **`useCases/`**: Contém o "Coração do Negócio". Cada arquivo representa uma ação específica do sistema (ex: `RegisterUserUseCase`).
- **`services/`**: Serviços transversais que não pertencem a uma entidade específica (ex: Integração com APIs externas como **ViaCEP** e futuramente **Brasil API**).
- **`middlewares/`**: Funções de interceptação (ex: `authMiddleware` para verificar JWT, `adminMiddleware` para permissões).
- **`repositories/`**: Abstração opcional para o Prisma, garantindo que o restante do app não precise saber detalhes das queries SQL.

## Fluxo de uma Requisição (Request Flow)
1. **Request:** O cliente envia um POST para `/api/v1/auth/register`.
2. **Route:** O arquivo `authRoutes.js` recebe e envia para `AuthController.register`.
3. **Controller:** O controlador chama o Use Case correspondente.
4. **Use Case:** Executa a regra de negócio (Verifica se e-mail existe, cria o User via Prisma).
5. **Response:** O Use Case retorna o dado processado para o Controller, que envia o JSON final ao cliente.

## Padronização
- **Endpoints:** Todos os endpoints são versionados com o prefixo `/api/v1`.
- **JSON:** A comunicação é feita estritamente via JSON.
- **Erros:** O sistema utiliza códigos de status HTTP apropriados (200, 201, 400, 401, 403, 404, 500).
