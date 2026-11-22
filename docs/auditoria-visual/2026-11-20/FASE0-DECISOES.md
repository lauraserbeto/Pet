# Auditoria visual — Fase 0: decisões

Decididas por Laura em 20/11/2026, a partir das opções do [relatório](index.html). Nenhuma foi implementada ainda; cada uma indica a fase em que entra.

## G03 — Contraste da cor primária → **Laranja escuro**

- Botões com texto (variante `default` do `Button`, CTAs e item ativo do `Sidebar`): fundo `--color-primary-700` (#b35602) com texto branco = **4,94:1**; hover em `--color-primary-800`.
- Links de texto: `--color-primary-700` sobre branco = 4,94:1 (hoje `primary-600` = 3,40:1).
- `--color-primary-500` (#f58b05) continua como cor de marca em ícones, ilustrações, destaques sem texto e fundos decorativos.
- Não altera os tokens; muda o uso. Atualizar `docs/design-system.md` com a justificativa (WCAG 2.1 AA 1.4.3).
- Entra na **Fase 2** (fundações), junto com G01/G02/G04/G05.

## G12 — Regra de visibilidade do perfil → **Mínimo + recomendados**

- Decide a visibilidade a regra atual da vitrine (`ProviderController#isProfileComplete`): descrição, telefone, cidade, CEP, ao menos 1 imagem (Hotel) e serviço ativo, além do papel/status já exigidos.
- Foto de perfil, horário de funcionamento, animais aceitos, comodidades e 3 imagens de galeria passam a **recomendados**: aparecem como sugestões, sem bloquear e sem o texto “não está visível”.
- Implementação: uma única fonte da regra no backend, usada pela vitrine e por `/providers/completeness`, que passa a devolver `required` (bloqueante) e `recommended` separadamente; o banner do `DashboardLayout` só mostra “não visível” quando houver item `required` faltando.
- Nenhum parceiro hoje visível sai da vitrine.
- Entra na **Fase 3**.

## G20 — Textos promocionais → **Remover**

- Remover: parcelamento “10x sem juros”, “Frete Rápido / Entrega garantida”, “Ambiente 100% blindado” (detalhe do produto); “+150k agendamentos”, “98% eficiência”, lembretes por WhatsApp, aba “Clínicas & Vets” e promessas de repasse (página de parceiros); revisar a landing com o mesmo critério.
- O painel ilustrativo de `/partners` permanece com o rótulo “Exemplo”.
- Entra na **Fase 4**.

## G07 — Configurações da plataforma → **Planejar backend**

- A tela informativa da Fase 1 permanece até existir backend (só Admin, sem ações simuladas).
- Abrir planejamento próprio para configurações reais: modelo e migration, endpoint restrito a Admin com validação, trilha de auditoria (quem alterou, quando, valor anterior) e definição de quais regras serão de fato configuráveis — por exemplo, aprovação automática exige revisar o fluxo de aprovação; taxas exigem split/repasse, hoje fora do escopo.
- Fora da Sprint atual; não entra nas Fases 2–5 deste plano.
