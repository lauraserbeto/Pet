# 04. Segurança e Qualidade

O backend do sistema Pet+ segue rigorosos padrões de segurança para garantir a integridade dos dados e a privacidade dos usuários. Este documento descreve as políticas de proteção implementadas.

---

## 🔐 Autenticação e Autorização

O acesso à API é controlado por um sistema de autenticação baseada em tokens.

### JWT (JSON Web Tokens)
Utilizamos JWT para autenticação sem estado (stateless). Após o login bem-sucedido, o servidor gera um token assinado com uma chave secreta (`JWT_SECRET`) que contém o ID e a Role do usuário.

### Middlewares de Proteção
O sistema utiliza middlewares Express para interceptar requisições e validar acessos:

- **`authMiddleware`**: Valida a presença e integridade do token JWT no cabeçalho `Authorization: Bearer <token>`. Se inválido ou ausente, a requisição é bloqueada (401 Unauthorized).
- **`adminMiddleware`**: Restringe o acesso a rotas específicas apenas para usuários com o cargo de Administrador (Role: `admin`).
- **RBAC (Role-Based Access Control)**: O acesso a recursos é filtrado dinamicamente com base no `role_id` contido no payload do token.

---

## 🛡️ Proteção de Dados e Infraestrutura

### Criptografia de Senhas
As senhas nunca são armazenadas em texto puro. Utilizamos a biblioteca `bcryptjs` com um fator de custo (salt) de 10 para gerar hashes irreversíveis antes da persistência no banco de dados.

### Variáveis de Ambiente
Todas as credenciais sensíveis (chaves de API, URLs de banco de dados, segredos JWT) são armazenadas em arquivos `.env` e nunca são versionadas no Git, seguindo as melhores práticas do *Twelve-Factor App*.

### CORS (Cross-Origin Resource Sharing)
O servidor está configurado para permitir requisições apenas de origens confiáveis (Frontend na Vercel e Localhost), mitigando ataques de Cross-Site Request Forgery (CSRF).

---

## 📝 Validações de Entrada e Lógica de Negócio

Para garantir a qualidade dos dados que entram no sistema, aplicamos múltiplas camadas de validação:

### Validação Matemática de Documentos
Implementamos algoritmos de validação matemática para:
- **CPF:** Verificação de dígitos verificadores e formato.
- **CNPJ:** Validação estrutural rigorosa para parceiros lojistas e hotéis.
*Nota: Cadastros com documentos matematicamente inválidos são rejeitados antes mesmo da verificação em órgãos externos (roadmap).*

### Integridade Referencial
O uso do **Prisma ORM** garante que as operações no banco de dados respeitem os relacionamentos (Foreign Keys). Exemplos:
- Pets são deletados em cascata se o tutor for removido.
- Repositórios isolam as consultas para evitar SQL Injection.

---

## 🧪 Estratégia de Testes (Qualidade)

A validação da qualidade do software é realizada através de:

1.  **Testes Manuais E2E:** Verificação de fluxos completos no ambiente de staging (Railway/Vercel).
2.  **Validação de Endpoints (Swagger):** Uso da interface interativa para testar inputs/outputs e códigos de status HTTP (200, 201, 400, 401, 403, 404, 500).
3.  **Monitoramento de Logs:** Auditoria de erros em tempo real no dashboard do Railway.
