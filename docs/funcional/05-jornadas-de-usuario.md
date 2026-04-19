# 05. Jornadas e Fluxos de Navegação

Este documento descreve os fluxos de navegação e as jornadas principais para os cinco perfis de usuários da plataforma Pet+. O objetivo é mapear a experiência do usuário desde o acesso inicial até a conclusão de suas tarefas principais.

---

## 🛡️ 1. Fluxo do Administrador (Admin Master)
**Objetivo:** Gerenciar a plataforma, moderar parceiros e garantir a qualidade dos serviços.

1.  **Acesso:** Login via `/auth/login`.
2.  **Dashboard:** Visualização de indicadores gerais (total de usuários, parceiros pendentes).
3.  **Moderação:** Navegação para a lista de "Parceiros Pendentes".
4.  **Revisão:** Análise detalhada de perfil (fotos, biografia, respostas do quiz).
5.  **Ação:** Aprovação ou Rejeição do cadastro.
6.  **Gestão:** Monitoramento de usuários ativos e relatórios de atividades.

---

## 🛒 2. Fluxo do Lojista
**Objetivo:** Gerenciar catálogo de produtos e processar vendas.

1.  **Acesso:** Cadastro ou Login via `/auth/register` (Role: Lojista).
2.  **Onboarding Comercial:** Preenchimento de dados da loja (Endereço, CNPJ, Contato).
3.  **Dashboard:** Resumo de vendas e status de estoque.
4.  **Inventário:** Adição de novos produtos (Nome, Preço, Categoria, Foto).
5.  **Pedidos:** Visualização e atualização de status de pedidos recebidos.
6.  **Configurações:** Edição de perfil comercial e dados de conta.

---

## 🏨 3. Fluxo do Hotel
**Objetivo:** Gerenciar disponibilidade de vagas e reservas de hospedagem/daycare.

1.  **Acesso:** Login no painel de parceiros.
2.  **Configuração de Vagas:** Definição da capacidade máxima e tipos de pets aceitos.
3.  **Calendário:** Gestão de disponibilidade e datas bloqueadas.
4.  **Reservas:** Visualização de solicitações de tutores.
5.  **Check-in/Out:** Controle de entrada e saída dos animais.
6.  **Perfil:** Atualização da vitrine com fotos das instalações e serviços oferecidos.

---

## 🐕 4. Fluxo do Pet Sitter / Passeador
**Objetivo:** Oferecer serviços de cuidado e passeio, gerenciando sua agenda.

1.  **Acesso:** Cadastro inicial e seleção da modalidade de serviço.
2.  **Onboarding Técnico:** Preenchimento do quiz de experiência e envio de fotos do ambiente/cuidados.
3.  **Status:** Aguarda aprovação do Admin (Perfil fica como PENDENTE).
4.  **Dashboard (Pós-Aprovação):** Gestão de agenda e definição de taxas por serviço.
5.  **Atendimento:** Recebimento de solicitações de passeio ou visita.
6.  **Histórico:** Acompanhamento de serviços realizados e avaliações recebidas.

---

## 👤 5. Fluxo do Tutor (Cliente Final)
**Objetivo:** Encontrar serviços/produtos de qualidade para seus pets.

1.  **Acesso:** Login ou navegação como convidado na Landing Page.
2.  **Perfil Pet:** Cadastro dos animais (Nome, Espécie, Raça, Idade).
3.  **Busca:** Pesquisa por serviços (Hotéis, Sitters) ou produtos através de filtros e localização.
4.  **Seleção:** Visualização dos detalhes do parceiro (Avaliações, Preços, Galeria).
5.  **Ação:** 
    *   **E-commerce:** Adiciona produtos ao carrinho e finaliza compra.
    *   **Serviços:** Solicita reserva ou agendamento para uma data específica.
6.  **Acompanhamento:** Gestão de pedidos e reservas no painel "Meus Agendamentos".
