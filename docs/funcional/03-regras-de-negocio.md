# 03. Regras de Negócio e Estados

O Pet+ utiliza uma máquina de estados rigorosa para garantir que apenas parceiros qualificados e com perfis completos sejam expostos ao consumidor final (Tutor).

## 🟢 Máquina de Estados do Parceiro (Provider Status)

Todo parceiro (Lojista, Hotel ou Pet Sitter) passa pelos seguintes estados de sistema:

1. **`PENDENTE`**: Estado inicial após o cadastro. O parceiro tem acesso ao painel, mas não aparece em nenhuma busca.
2. **`APROVADO` / `ACTIVE`**: O Admin Master revisou os documentos e liberou a conta.
3. **`BLOQUEADO` / `INACTIVE`**: Suspensão manual por violação de termos ou solicitação do próprio parceiro.

---

## 🔍 Regras de Visibilidade (Vitrine Pública)

Estar **`APROVADO`** não é o único requisito para aparecer na vitrine. O sistema valida a **Completitude do Perfil**:

### Requisitos Gerais (Para todos os Provedores)
- Ter descrição (`description`) preenchida.
- Ter telefone (`phone`) válido.
- Ter localização (CEP e Cidade) configurada (Integrado com **ViaCEP** para preenchimento automático).

### Requisitos Específicos por Categoria
- **Hotel:**
  - Deve ter taxa diária (`daily_rate`) > 0.
  - Deve ter pelo menos **1 foto** na galeria de imagens.
- **Pet Sitter:**
  - Deve ter taxa por hora (`hourly_rate`) > 0.
  - Deve ter pelo menos **1 papel/serviço** selecionado (Ex: Sitter, Walker).

> **Segurança e Validação (Roadmap):** Em ambiente de produção, o sistema integrará com a **Brasil API** para realizar a validação automática e rigorosa de CPF e CNPJ durante o onboarding, prevenindo cadastros fraudulentos e garantindo que os dados de cada parceiro sejam autênticos.

---

## 🐶 Máquina de Estados de Onboarding (Pet Sitter)

Para Pet Sitters, existe um passo extra de **Avaliação Técnica**:
1. O usuário se cadastra.
2. Preenche o quiz de conhecimentos pet e envia fotos do ambiente/experiência.
3. Cria-se um registro em `sitter_evaluations` com status `PENDING`.
4. O Admin aprova a avaliação → O status do usuário muda para `APROVADO`.

---

## 👤 Regras do Tutor (Perfil e Dados Pessoais)

### Atualização de perfil
- **E-mail é imutável** após cadastro (não pode ser alterado pelo `PUT /users/me`).
- **Telefone:** formato brasileiro `(XX) XXXXX-XXXX` (regex `^\(\d{2}\) \d{4,5}-\d{4}$`) — máscara aplicada no frontend.
- **Avatar:** aceita imagens JPEG, PNG ou WebP, máximo 2 MB; armazenado como **base64 data URL** no campo `avatar_url`.

### Troca de senha
- Requer obrigatoriamente a **senha atual** (validada via bcrypt).
- Nova senha: mínimo 8 caracteres, com pelo menos 1 letra e 1 dígito.
- A nova senha não pode ser igual à atual.
- Tokens de reset de senha pendentes são invalidados após a troca (defesa em profundidade).

---

## 🏠 Regras de Endereços

### Endereço principal (`is_default`)
- Cada tutor tem **no máximo 1 endereço marcado como principal** (invariante garantida pelo backend via transação).
- O **primeiro endereço** cadastrado vira automaticamente o principal.
- Ao definir outro endereço como principal, o anterior é desmarcado na mesma transação.

### Exclusão de endereço
- Se for o **único** endereço E existir pedido com status `PENDING/PREPARING/SHIPPED` → **excluir é bloqueado** (HTTP 409).
- Se for o principal e há outros endereços → o mais recente é **promovido a principal automaticamente** após a exclusão.

### Limites e validações
- Máximo de **5 endereços por usuário**.
- **CEP** validado via integração com ViaCEP server-side (com fail-open em caso de timeout — não bloqueia o cadastro por indisponibilidade do serviço externo).
- **UF** restrita a uma whitelist das 27 unidades federativas.
- Campos obrigatórios: CEP, Rua, Número, Bairro, Cidade, UF. Complemento é opcional.

---

## 🐶 Regras de Pets

- **Ownership:** todo pet pertence a um único tutor e só pode ser visualizado/editado por ele.
- **Espécie** padronizada em enum: `DOG`, `CAT`, `OTHER`.
- **Peso:** entre 0 e 200 kg (não inclui 0).
- **Data de nascimento:** não pode ser no futuro.
- **Limite de 10 pets por tutor.**
- **Exclusão bloqueada (409)** se houver agendamento (`Appointment`) com status `PENDING` ou `CONFIRMED` E data de início no futuro. Agendamentos concluídos ou cancelados não bloqueiam — preserva-se o histórico mas permite limpeza.

---

## ❤️ Regras de Favoritos

- Favoritos são **polimórficos** — o mesmo recurso de "favoritar" cobre produtos, hotéis e pet sitters.
- **Idempotência:** favoritar o mesmo item duas vezes não cria duplicatas (constraint `UNIQUE(user_id, target_type, target_id)`).
- Só usuários **autenticados** podem favoritar — anônimos recebem prompt para login.
- Quando o alvo (produto ou provider) é deletado, o favorito fica órfão e é **filtrado silenciosamente** nas listagens (não bloqueia, não erra).
- Para HOTEL/SITTER, o backend valida que o `target_id` aponta para um `Provider` cujo `user.role_id` corresponde ao tipo declarado (HOTEL=3, SITTER=4).

---

## 🛒 Fluxo de Compras (Marketplace e Carrinho)

### Carrinho persistente
- **Anônimo:** itens vivem no `localStorage` do navegador (chave `petplus_anon_cart`).
- **Autenticado:** itens vivem no servidor (tabelas `carts` e `cart_items`).
- **Transição:** ao logar, se há carrinho anônimo, dispara `POST /cart/merge` automaticamente — somando quantidades dos itens em comum e respeitando estoque.

### Adição e quantidade
- Só produtos com `status = ACTIVE` e `stock_quantity > 0` podem ser adicionados.
- **Cap automático:** se a quantidade pedida (após somar com o que já está no carrinho) excede `min(99, stock_quantity)`, o backend ajusta para o teto e devolve um warning `STOCK_CAPPED` na resposta.
- **Limite de 50 SKUs distintos** por carrinho (ao atingir, novas adições retornam 409).
- **Limite de 99 unidades** por item.

### Preço (snapshot)
- Ao adicionar um produto, o preço atual é **congelado** no `unit_price_snapshot` do item.
- Ao listar o carrinho, comparamos com o preço atual do produto:
  - Se mudou, o item recebe `price_changed: true` e o cliente pode mostrar aviso visual ao usuário.
- **Cálculo de totais é sempre feito no servidor.** O frontend nunca envia totais.

### Expiração e cleanup
- Carrinhos inativos por mais de **30 dias** são esvaziados automaticamente no próximo `GET /cart` (lazy cleanup), com warning `CART_EXPIRED`.
- Não há job cron rodando; cleanup é sob demanda.

### Estoque e pagamento
- **Produtos:** O estoque é decrementado apenas após a confirmação do pagamento (fluxo de checkout — fora do escopo deste documento).
- **Serviços (agendamentos):** Requerem uma data de início e fim. O status inicial é sempre `PENDING` até que o prestador aceite o serviço.
- **Política multi-lojista:** atualmente um único carrinho aceita produtos de N lojistas; a separação em pedidos distintos é decisão de checkout (a definir).
