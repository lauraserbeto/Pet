# 02. Perfis de Usuário (Roles)

O sistema Pet+ opera com um modelo de permissão baseado em papéis (RBAC). Cada `role_id` possui acessos e responsabilidades específicas.

## 1. Admin Master (`role_id: 1`)
- **Responsabilidades:** Gestão total da plataforma.
- **Poderes:** Aprovação/Rejeição de parceiros, visualização de logs, gestão de categorias globais.
- **Fluxo Principal:** Monitoramento do Dashboard Admin e processamento da fila de aprovação de novos parceiros.

## 2. Lojista (`role_id: 2`)
- **Responsabilidades:** Fornecimento de produtos físicos (alimentos, brinquedos, acessórios).
- **Poderes:** Gestão de inventário (Produtos), SKU, precificação e acompanhamento de pedidos.
- **Vitrine:** Aparece na seção "Shopping" do app.

## 3. Hotel (`role_id: 3`)
- **Responsabilidades:** Oferecer hospedagem e daycare em local físico próprio.
- **Poderes:** Configurar diárias, animais permitidos, amenidades e fotos das instalações.
- **Vitrine:** Aparece na seção "Hotéis" do app.

## 4. Pet Sitter / Passeador (`role_id: 4`)
- **Responsabilidades:** Cuidados domiciliares e passeios.
- **Poderes:** Configurar taxas por hora, tipos de serviço prestados (Sitting vs Walking) e agenda.
- **Vitrine:** Aparece na seção "Pet Sitters" do app.

## 5. Tutor (`role_id: 5`)
- **Responsabilidades:** Usuário final, dono de pet.
- **Poderes:** Cadastro de seus animais (Pets), gestão de endereços, compra de produtos e agendamento de serviços.
- **Vitrine:** Visão pública e área do cliente.
