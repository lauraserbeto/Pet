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
- Ter localização (CEP e Cidade) configurada.

### Requisitos Específicos por Categoria
- **Hotel:** 
  - Deve ter taxa diária (`daily_rate`) > 0.
  - Deve ter pelo menos **1 foto** na galeria de imagens.
- **Pet Sitter:**
  - Deve ter taxa por hora (`hourly_rate`) > 0.
  - Deve ter pelo menos **1 papel/serviço** selecionado (Ex: Sitter, Walker).

> **Lógica de Backend:** O endpoint `/api/v1/providers/hotels` (e similares) filtra automaticamente apenas os registros que cumprem `status IN ['APROVADO', 'ATIVO']` **E** passam no validador de completitude.

---

## 🐶 Máquina de Estados de Onboarding (Pet Sitter)

Para Pet Sitters, existe um passo extra de **Avaliação Técnica**:
1. O usuário se cadastra.
2. Preenche o quiz de conhecimentos pet e envia fotos do ambiente/experiência.
3. Cria-se um registro em `sitter_evaluations` com status `PENDING`.
4. O Admin aprova a avaliação -> O status do usuário muda para `APROVADO`.

---

## 🛒 Fluxo de Compras (Marketplace)
- **Produtos:** Carrinho multi-vendedor (futuro) ou por loja. O estoque é decrementado apenas após a confirmação do pagamento.
- **Serviços:** Agendamentos requerem uma data de início e fim. O status inicial é sempre `PENDING` até que o prestador aceite o serviço.
