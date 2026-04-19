# 🐾 Pet+ API - Documentação de Arquitetura

Este documento descreve a estrutura de pastas e a organização do backend da aplicação **Pet+**, desenvolvido com Node.js, Express e Prisma. A arquitetura segue princípios da Arquitetura Limpa de separação de responsabilidades para garantir manutenibilidade e escalabilidade.

## 🏗️ Estrutura de Pastas

Abaixo está o detalhamento de cada diretório e sua responsabilidade dentro do sistema:

### `prisma/`
Gerada automaticamente pelo Prisma. Contém o arquivo `schema.prisma`, que define a modelagem do banco de dados, as tabelas e os relacionamentos. É aqui que configuramos o cliente Prisma e as migrações (migrations).

### `src/`
O diretório raiz de todo o código-fonte da aplicação. Todas as camadas lógicas residem aqui.

#### `config/`
Contém arquivos de configuração global. Exemplos incluem:
- Configurações de conexão com o banco de dados.
- Configurações do Swagger para documentação automática da API.
- Variáveis de ambiente e middlewares globais de configuração.

#### `domain/`
Define as **entidades** e os **tipos puros** do sistema. Representa o núcleo do negócio, independente de frameworks ou bancos de dados. Aqui ficam as regras que definem o que é um "Pet", um "Usuário" ou um "Agendamento".

#### `repositories/`
Esta é a **única camada que conversa diretamente com o Prisma/PostgreSQL**. Os repositórios abstraem a persistência de dados. Se amanhã mudarmos de banco de dados, apenas esta camada deve ser alterada.

#### `useCases/`
Onde residem as **Regras de Negócio**. Cada caso de uso representa uma ação específica que o usuário pode realizar (ex: `CadastrarPet`, `AprovarSitter`). Eles orquestram os dados entre os repositórios e as entidades do domínio.

#### `controllers/`
Responsáveis por receber as requisições HTTP, validar os dados de entrada básicos e chamar o caso de uso (UseCase) correspondente. Eles também formatam e devolvem as respostas (JSON, Status Codes) para o cliente.

#### `routes/`
Contém o mapeamento das URLs do Express. Define quais endpoints estão disponíveis (ex: `GET /pets`, `POST /auth/login`) e quais controllers são acionados em cada rota.

### `server.js`
O ponto de entrada (entry point) da aplicação. É um arquivo limpo que:
1. Inicializa o servidor Express.
2. Conecta os middlewares (CORS, JSON parser).
3. Importa e utiliza as rotas.
4. Inicia a escuta na porta configurada.

---

## 🔌 Serviços Externos e Integrações

### Consulta de CEP (ViaCEP)
O sistema integra-se com a API do **ViaCEP** no frontend para facilitar o cadastro de endereços, garantindo que a base de dados do PostgreSQL receba informações consistentes de Cidade, Estado e Logradouro.

### Validação Cadastral (Brasil API - Roadmap)
Para a versão de produção, está planejada a integração com a **Brasil API**. Esta integração permitirá:
- Validação real de CPF/CNPJ de parceiros.
- Consulta de dados cadastrais de empresas (Lojistas/Hotéis).
- Aumento da camada de segurança no processo de onboarding.

---

## ☁️ Infraestrutura e Deploy

A aplicação Pet+ está distribuída em ambientes de nuvem modernos:

### Frontend
- **Hospedagem:** [Vercel](https://vercel.com/).
- **URL de Produção:** [https://petplus.vercel.app/](https://petplus.vercel.app/).
- **CI/CD:** Deploy automático a cada push na branch principal.

### Backend
- **Hospedagem API:** [Railway](https://railway.com/) (Node.js runtime).
- **Banco de Dados:** PostgreSQL (Instância gerenciada no Railway).
- **ORM:** Prisma (Client & Migrate).
- **CI/CD:** Integrado ao repositório GitHub para deploy automático no Railway.
