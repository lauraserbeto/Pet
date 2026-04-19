# 03. Endpoints da API

A API segue o padrão RESTful e está disponível sob o prefixo `/api/v1`.

---

## 📚 Documentação Interativa (Swagger)

A documentação detalhada de cada endpoint, incluindo esquemas de entrada/saída e testes em tempo real, está disponível via Swagger:

- **Local:** [http://localhost:3000/swagger](http://localhost:3000/swagger)
- **Produção:** [https://pet-plus-production.up.railway.app/swagger](https://pet-plus-production.up.railway.app/swagger)

---

## 🔐 Autenticação (`/auth`)

- **POST `/register`**: Cadastro de novos usuários (Tutor ou Parceiro).
- **POST `/login`**: Retorna o JWT e dados básicos do usuário.
- **POST `/forgot-password`**: Inicia fluxo de recuperação de senha.
- **POST `/reset-password`**: Redefine a senha com token.

---

## 🏢 Parceiros (`/providers`)

### Endpoints Públicos (Vitrine)
- **GET `/hotels`**: Lista hotéis que passaram no filtro de completitude e estão ativos.
- **GET `/sitters`**: Lista pet sitters e passeadores ativos.
- **GET `/stores`**: Lista lojistas com inventário ativo.
- **GET `/:id`**: Retorna os detalhes completos de um parceiro (Fotos, Serviços, Descrição).

### Gestão (Privado)
- **GET `/me`**: Retorna dados do parceiro logado.
- **PUT `/me`**: Atualiza dados de conta.
- **PUT `/profile`**: Atualiza dados da vitrine (fotos, taxas, serviços).
- **GET `/completeness`**: Retorna checklist de campos faltantes no perfil.

---

## 📦 Produtos (`/products`)

- **GET `/`**: Lista produtos ativos em toda a plataforma.
- **GET `/:id`**: Detalhes de um produto.
- **POST `/`**: Criação de produto (Somente Lojistas).
- **PUT `/:id`**: Atualização de produto.
- **GET `/provider`**: Lista produtos do lojista autenticado.

---

## 👤 Usuários e Endereços

- **GET `/users/me`**: Dados do perfil logado.
- **POST `/addresses`**: Adiciona novo endereço ao tutor.
- **GET `/addresses`**: Lista endereços do usuário.

---

## 🩺 Health Check
- **GET `/api/health`**: Verifica conectividade com banco de dados.
