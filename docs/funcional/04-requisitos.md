# 04. Requisitos do Sistema

Este documento detalha os Requisitos Funcionais (RF) e Não Funcionais (RNF) do ecossistema Pet+, servindo como guia para o desenvolvimento e validação das funcionalidades da plataforma.

---

## 🎯 Requisitos Funcionais (RF)

Os requisitos funcionais descrevem as ações e comportamentos que o sistema deve executar para atender às necessidades dos usuários.

| ID | Requisito | Descrição | Prioridade |
|:---|:---|:---|:---|
| **RF-001** | Cadastro de Usuários | Permitir o registro de Tutores e Parceiros (Lojistas, Hotéis, Pet Sitters). | Alta |
| **RF-002** | Autenticação e Acesso | Sistema de Login/Logout seguro utilizando e-mail e senha com geração de token JWT. | Alta |
| **RF-003** | Redirecionamento de Role | Direcionar automaticamente o usuário para seu painel específico (Admin, Parceiro ou Tutor) após o login. | Alta |
| **RF-004** | Gestão de Pets | Permitir que o Tutor realize o CRUD (Criar, Ler, Atualizar, Deletar) de seus animais de estimação. | Alta |
| **RF-005** | Gestão de Endereços | Permitir que o Tutor gerencie múltiplos endereços vinculados à sua conta. | Alta |
| **RF-006** | Edição de Perfil | Possibilitar a atualização de dados pessoais e fotos de perfil para todos os usuários. | Média |
| **RF-007** | Alteração de Senha | Funcionalidade para troca de senha de acesso mediante validação da senha atual. | Média |
| **RF-008** | Onboarding de Parceiro | Fluxo específico para Pet Sitters preencherem experiência, fotos e responderem ao quiz de avaliação. | Alta |
| **RF-009** | Moderação de Parceiros | Interface para o Administrador aprovar ou rejeitar novos cadastros de parceiros (Status PENDENTE). | Alta |
| **RF-010** | Revisão de Candidaturas | Permitir que o Administrador visualize os detalhes do onboarding (fotos/respostas) para tomada de decisão. | Alta |
| **RF-011** | Painel do Parceiro | Dashboard com métricas de vendas, agendamentos, produtos e configurações comerciais. | Alta |
| **RF-012** | Status de Onboarding | Exibir para o parceiro o estado atual de sua conta (PENDENTE, EM_REVISAO, APROVADO, REJEITADO). | Média |
| **RF-013** | Vitrine de Produtos | Interface de Marketplace para listagem e filtragem de produtos disponíveis para compra. | Média |
| **RF-014** | Carrinho de Compras | Sistema de persistência de itens selecionados para compra ou agendamento (Context API). | Média |
| **RF-015** | Perfil Comercial | Permitir que parceiros editem informações públicas da loja/serviço (descrição, contato, horário). | Média |

---

## 🛠️ Requisitos Não Funcionais (RNF)

Os requisitos não funcionais definem os critérios de qualidade, desempenho e restrições técnicas do sistema.

| ID | Categoria | Descrição | Prioridade |
|:---|:---|:---|:---|
| **RNF-001** | Segurança | Proteção de rotas via JWT e criptografia de senhas com `bcryptjs` (salt 10). | Alta |
| **RNF-002** | Responsividade | Interface adaptável para dispositivos móveis, tablets e desktops (Mobile-first) usando Tailwind CSS 4. | Alta |
| **RNF-003** | Usabilidade | Interface intuitiva utilizando componentes Radix UI e feedbacks visuais instantâneos (Sonner/Toasts). | Alta |
| **RNF-004** | Disponibilidade | Hospedagem resiliente (Vercel para Frontend e Railway para Backend) com entrega contínua. | Alta |
| **RNF-005** | Arquitetura | Código organizado em camadas lógicas (Controllers, UseCases, Repositories) para fácil manutenção. | Média |
| **RNF-006** | Escalabilidade | Uso de banco de dados relacional (PostgreSQL) com Prisma ORM e autenticação Stateless. | Média |
