# Especificação Técnica de Integrações Frontend-Supabase para Migração Node.js/Express

Este documento mapeia profundamente todas as integrações diretas do Frontend (React) com o Supabase, descrevendo o comportamento atual e as propostas para a nova arquitetura baseada em Clean Architecture e REST/Node.js.

---

### [Gestão do Perfil do Usuário - Busca Inicial]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `loadProfile`)
**Ação Realizada:** Busca dos dados básicos do usuário logado.
**Tabela Alvo / Serviço:** Tabela `users`
**Payload / Dados Trafegados:**
- **Request:** Filtro por `id = session.user.id`
- **Response:** Recebe campos como `full_name`, `phone`, `avatar_url` (o select usa `*`)
**Regras de Negócio Identificadas:** Só executa se houver sessão ativa. Retorna apenas os dados do respectivo usuário autenticado (`.single()`).
**Proposta de Rota Express:** `GET /api/v1/users/me`
**Proposta de Middleware de Segurança:** `authMiddleware` (Qualquer usuário autenticado)

---

### [Gestão do Perfil do Usuário - Atualização de Dados]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `handleSavePersonal`)
**Ação Realizada:** Atualização de nome e telefone.
**Tabela Alvo / Serviço:** Tabela `users`
**Payload / Dados Trafegados:**
- **Request:** `{ full_name, phone }` referenciados ao `user.id`.
**Regras de Negócio Identificadas:** Exibe loading antes de fazer a alteração para a base de dados.
**Proposta de Rota Express:** `PUT /api/v1/users/me`
**Proposta de Middleware de Segurança:** `authMiddleware` (Qualquer usuário autenticado)

---

### [Gestão de Endereços - Listagem]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `loadAddresses`)
**Ação Realizada:** Busca os endereços cadastrados de um usuário.
**Tabela Alvo / Serviço:** Tabela `addresses`
**Payload / Dados Trafegados:**
- **Request:** Filtro por `user_id = session.user.id`, com ordenação descendente em `created_at`.
- **Response:** Array de objetos `{ id, cep, rua, numero, complemento, bairro, cidade, estado, ... }`.
**Regras de Negócio Identificadas:** Endereços recém criados devem aparecer primeiro.
**Proposta de Rota Express:** `GET /api/v1/users/me/addresses`
**Proposta de Middleware de Segurança:** `authMiddleware` (Acesso apenas aos próprios endereços)

---

### [Gestão de Endereços - Criação e Atualização]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `handleSaveAddress`)
**Ação Realizada:** Inserção ou alteração de endereço.
**Tabela Alvo / Serviço:** Tabela `addresses`
**Payload / Dados Trafegados:**
- **Request:** `{ cep, rua, numero, complemento, bairro, cidade, estado, user_id }`. No caso de update, é enviado junto ao filtro `id = editingAddressId`.
**Regras de Negócio Identificadas:** Se o estado contiver o `editingAddressId`, faz update, caso contrário faz insert.
**Proposta de Rota Express:** `POST /api/v1/users/me/addresses` (Criação) e `PUT /api/v1/users/me/addresses/:id` (Atualização)
**Proposta de Middleware de Segurança:** `authMiddleware` + Validação de Propriedade do Recurso

---

### [Gestão de Endereços - Exclusão]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `handleDeleteAddress`)
**Ação Realizada:** Exclusão de um endereço.
**Tabela Alvo / Serviço:** Tabela `addresses`
**Payload / Dados Trafegados:**
- **Request:** Filtro por `id = id_do_endereco`.
**Regras de Negócio Identificadas:** Possui confirmação visual antes da exclusão (`confirm()`). Atualiza listagem local após apagar.
**Proposta de Rota Express:** `DELETE /api/v1/users/me/addresses/:id`
**Proposta de Middleware de Segurança:** `authMiddleware` + Validação de Propriedade do Recurso

---

### [Upload de Avatar]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `handleAvatarUpload`)
**Ação Realizada:** Upload de foto de perfil, resgate da URL pública e atualização na tabela de usuários.
**Tabela Alvo / Serviço:** Serviço Storage (bucket `avatars`) e Tabela `users`
**Payload / Dados Trafegados:**
- **Request (Storage):** Arquivo transmitido ao path `${user.id}/${user.id}-${Math.random()}.${fileExt}`.
- **Request (Database):** `{ avatar_url: publica_url_gerada }`
**Regras de Negócio Identificadas:** Ao fazer o upload a imagem recebe um hash aleatório. Se ocorrer erro de upload, a operação é interrompida; após sucesso na conversão em public URL, o update é injetado na tabela de usuarios dentro da mesma transação local.
**Proposta de Rota Express:** `POST /api/v1/users/me/avatar` (Rota deve receber arquivo como `multipart/form-data`, realizar o upload para um S3/Disco local, e atualizar a URL do usuário no banco)
**Proposta de Middleware de Segurança:** `authMiddleware`

---

### [Segurança do Usuário - Atualização de Senha]
**Arquivo de Origem:** `src/pages/tutor/TutorProfile.tsx` (função `handleSavePassword`)
**Ação Realizada:** Atualização de credencial (senha).
**Tabela Alvo / Serviço:** Serviço Auth (`supabase.auth.updateUser`)
**Payload / Dados Trafegados:**
- **Request:** `{ password: newPassword }`
**Regras de Negócio Identificadas:** As senhas devem ser verificadas no front para baterem entre si antes de enviar. A senha tem uma regra de comprimento mínimo (>=6).
**Proposta de Rota Express:** `PATCH /api/v1/auth/password`
**Proposta de Middleware de Segurança:** `authMiddleware`

---

### [Vitrine de Parceiro - Leitura Perfil Comercial]
**Arquivo de Origem:** `src/pages/dashboard/Profile.tsx` (função `fetchProfileData`)
**Ação Realizada:** Coleta de dados combinados do usuário e do provedor correspondente.
**Tabela Alvo / Serviço:** Tabelas `users` e `providers`
**Payload / Dados Trafegados:**
- **Request:** Filtro `id = session.user.id` e `user_id = session.user.id`
- **Response:** `{ full_name, email }` da tabela users e `{ business_name, document, phone, description, zip_code, address_line, city, state }` da tabela providers.
**Regras de Negócio Identificadas:** Recupera simultaneamente dados do Perfil de Usuário e Perfil Comercial via `Promise.all`. Ignora erros não-fatais do provedor (PGRST116 - Not found in single row).
**Proposta de Rota Express:** `GET /api/v1/providers/me`
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['PARCEIRO', 'LOJISTA', 'HOTEL', 'PET_SITTER'])` (Perfis com acesso ao dashboard comercial)

---

### [Vitrine de Parceiro - Edição Perfil Comercial]
**Arquivo de Origem:** `src/pages/dashboard/Profile.tsx` (função `handleSubmit`)
**Ação Realizada:** Atualização combinada dos dados pessoais e comerciais.
**Tabela Alvo / Serviço:** Tabelas `users` e `providers`
**Payload / Dados Trafegados:**
- **Request (users):** `{ full_name }`
- **Request (providers):** `{ business_name, document, phone, description, zip_code, address_line, city, state }`
**Regras de Negócio Identificadas:** Atualizações simultâneas. Na API isto deve ser agrupado em uma única transaction SQL na rota REST.
**Proposta de Rota Express:** `PUT /api/v1/providers/me`
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['PARCEIRO', 'LOJISTA', 'HOTEL', 'PET_SITTER'])`

---

### [Gestão de Pets - Listagem]
**Arquivo de Origem:** `src/pages/tutor/TutorPets.tsx` (função `loadPets`)
**Ação Realizada:** Listagem de pets vinculados ao tutor.
**Tabela Alvo / Serviço:** Tabela `pets`
**Payload / Dados Trafegados:**
- **Request:** Filtro `tutor_id = session.user.id`
- **Response:** Array ordenado de forma descrescente (`created_at`) de objetos `{ id, name, species, breed, weight, birth_date, ... }`
**Regras de Negócio Identificadas:** Nenhuma validação rigorosa, apenas garante o retorno atrelado ao dono.
**Proposta de Rota Express:** `GET /api/v1/pets`
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['TUTOR'])` (Apenas tutores podem ter pets vinculados)

---

### [Gestão de Pets - Inserção]
**Arquivo de Origem:** `src/pages/tutor/TutorPets.tsx` (função `handleSavePet`)
**Ação Realizada:** Adiciona um novo Pet ao cadastro.
**Tabela Alvo / Serviço:** Tabela `pets`
**Payload / Dados Trafegados:**
- **Request:** `{ name, species, breed, birth_date, weight_kg, medical_notes, tutor_id: user.id }`
**Regras de Negócio Identificadas:** O ID do tutor é atrelado internamente durante a requisição com os dados do usuário autenticado. Formulário tem estado limpo após inserção.
**Proposta de Rota Express:** `POST /api/v1/pets`
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['TUTOR'])`

---

### [Onboarding Partner - Verificação de Status]
**Arquivo de Origem:** `src/pages/onboarding/PetSitterOnboarding.tsx` (função `checkUserStatus`)
**Ação Realizada:** Consulta o passo atual de onboarding do usuário.
**Tabela Alvo / Serviço:** Tabela `users`
**Payload / Dados Trafegados:**
- **Request:** Filtro `id = session.user.id`
- **Response:** Campo `onboarding_step` (ex: `'IN_REVIEW'`, `'COMPLETED'`, `'PENDENTE'`).
**Regras de Negócio Identificadas:** Cria um funil de views. Se status `IN_REVIEW`, estaciona mostrando tela de análise. Se `COMPLETED`, vai pro Dashboard. Caso contrário, exibe Formulário.
**Proposta de Rota Express:** `GET /api/v1/users/me/onboarding-status`
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['PARCEIRO', 'LOJISTA', 'HOTEL', 'PET_SITTER'])`

---

### [Onboarding Partner - Envio de Avaliação / Formulário]
**Arquivo de Origem:** `src/pages/onboarding/PetSitterOnboarding.tsx` (função `handleSubmit`)
**Ação Realizada:** Upload seqüencial de fotos do ambiente, persistência das respostas de quiz e currículo e atualização do status.
**Tabela Alvo / Serviço:** Serviço Storage (bucket `sitter_photos`), Tabelas `sitter_evaluations` e `users`
**Payload / Dados Trafegados:**
- **Request (Storage - bucket sitter_photos):** Múltiplos arquivos (fotos JPG/PNG).
- **Request (sitter_evaluations):** `{ user_id, experience_details, environment_photos (array com links), quiz_answers, status: 'PENDENTE' }`
- **Request (users):** `{ onboarding_step: 'IN_REVIEW' }`
**Regras de Negócio Identificadas:** Múltiplas etapas que precisam ser processadas em lote (Upload de fotos, gerar array de URLs, registrar avaliação form, alterar status de usuário para IN_REVIEW). 
**Proposta de Rota Express:** `POST /api/v1/providers/onboarding` (Deve suportar envio nativo de `multipart/form-data`)
**Proposta de Middleware de Segurança:** `authMiddleware` + `requireRole(['PARCEIRO', 'LOJISTA', 'HOTEL', 'PET_SITTER'])`

---

### [Autenticação - Registro]
**Arquivo de Origem:** `src/pages/auth/RegisterPage.tsx` (função `handleRegister`)
**Ação Realizada:** Criação de usuário Tutor ou Parceiro.
**Tabela Alvo / Serviço:** Serviço Auth (`supabase.auth.signUp`)
**Payload / Dados Trafegados:**
- **Request Geral:** Email e Senha (com meta-dados em `options.data`)
  - **Meta-dados Tutor:** `{ role_id: 5, full_name, terms_accepted }`
  - **Meta-dados Parceiro:** `{ role_id: ID do parceiro [2, 3 ou 4], full_name, business_name, document, terms_accepted }`
**Regras de Negócio Identificadas:** Validação de segurança da senha (8 char, Maiúscula, Número), aceite obrigatório dos Termos. A API de inserção usa triggers do supabase para injetar esses dados adicionais em suas tabelas (Provavelmente `users` e `providers`). No Express, a rota de cadastro deve gerenciar isso.
**Proposta de Rota Express:** `POST /api/v1/auth/register`
**Proposta de Middleware de Segurança:** Nenhum (Rota Pública / Unauthenticated)

---

### [Autenticação - Login e Bloqueio Protetivo]
**Arquivo de Origem:** `src/pages/auth/LoginPage.tsx` (função `handleSignIn`)
**Ação Realizada:** Entra na conta e bloqueia perfis comerciais que não tenham aprovação.
**Tabela Alvo / Serviço:** Serviço Auth (`signInWithPassword`), Tabelas `users` e `providers`
**Payload / Dados Trafegados:**
- **Request:** `{ email, password }`
- Após logar, solicita `{ role_id }` do user. Se partner, solicita `{ status }` do provedor.
**Regras de Negócio Identificadas:** Existe redundância frontend após o sign-in puro: Caso a consulta confirme que o Parceiro possui status `PENDENTE` ou `REJEITADO`, a aplicação invalida o token via `signOut()` e não permite acesso. Em um backend, esta etapa não deve devolver o token JWT se não for autorizado acessar o ambiente.
**Proposta de Rota Express:** `POST /api/v1/auth/login` (O JWT só é trafegado para o cliente caso o status comercial já esteja aprovado ou a role não dependa de tal check).
**Proposta de Middleware de Segurança:** Nenhum (Rota Pública / Unauthenticated). Toda regra de role/status do login é resolvida no service (não precisa de middleware de checagem para bater na rota de tentar o login).

---

### [Tratamento de Sessão Transversal / Logout]
**Arquivos de Origem:** Diversos provedores de layou (`Navbar.tsx`, `DashboardLayout.tsx`)
**Ação Realizada:** Gerenciamento do ciclo de vida da verificação local do JWT.
- Chama rotinas de `supabase.auth.getSession()`, `supabase.auth.signOut()` e `supabase.auth.onAuthStateChange()`.
**Proposta de Abstração:**
Na arquitetura do Express, estas validações passam a ser middlewares nas rotas privadas analisando os cabeçalhos `Authorization: Bearer <token>`. E as funções de login/logout manipulam tokens ou refresh tokens via cookie HTTP-Only para maior segurança.
**Rotas Express Comuns:** `GET /api/v1/auth/me` para resgatar sessão inicializada, e `POST /api/v1/auth/logout`.
**Proposta de Middleware de Segurança:** `authMiddleware`
