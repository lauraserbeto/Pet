# Sprints — Pet+

Planejamento de desenvolvimento em **6 sprints** (25/ago → 08/nov/2026), **4 pessoas**, **1 task principal por pessoa por semana**.

> 📄 Comece pelo documento-guia: [`docs/PLANO-DESENVOLVIMENTO.md`](../docs/PLANO-DESENVOLVIMENTO.md) — contexto atual, decisões de negócio, convenções e ambiente.
>
> Cada pasta de sprint tem um `README.md` (objetivo + marco + ordem das tasks) e **um arquivo por task**, autossuficiente (contexto, passos, arquivos, critério de aceite, testes e armadilhas).

## Como usar
1. Leia o `PLANO-DESENVOLVIMENTO.md` uma vez.
2. Pegue sua task da semana no board (Trello/Notion) e abra o `.md` correspondente aqui.
3. Crie a branch `feat/<ID>-descricao`, respeite a coluna **Depende de**, e abra PR (ninguém commita direto na `main`).
4. Marque como pronto só quando o **Critério de aceite** e o **DoD** estiverem atendidos.

## Trilhas
- **R1** Backend · Comércio · **R2** Backend · Plataforma · **R3** Frontend · Transacional · **R4** Frontend · Painéis & QA

## Sprints e marcos

| Sprint | Semanas | Período | Marco | Foco |
|---|---|---|---|---|
| [0 — Fundação](Sprint-0-Fundacao) | 1 | 25–31/ago | **M0** | Carrinho, banco versionado, segredos, honestidade dos mocks |
| [1 — Pedidos & Segurança](Sprint-1-Pedidos-e-Seguranca) | 2–3 | 01–14/set | **M1** | Pedidos no backend, vazamentos, `status` enum |
| [2 — Checkout & E-mail/Recusa](Sprint-2-Checkout-Email-Recusa) | 4–5 | 15–28/set | **M2** | Compra ponta a ponta, Resend, recusa/reenvio |
| [3 — Serviços & Agendamento](Sprint-3-Servicos-Agendamento) | 6–7 | 29/set–12/out | **M3** | Serviços/agendamento no backend, gate de produto |
| [4 — Agendamento & Avaliações](Sprint-4-Agendamento-Avaliacoes) | 8–9 | 13–26/out | **M4** | Agendamento ponta a ponta, avaliações no backend |
| [5 — Fechamento](Sprint-5-Fechamento) | 10–11 | 27/out–08/nov | **M5** | Avaliações no front, dashboards reais, QA de release |

## Mapa das tasks

| Sprint | Tasks |
|---|---|
| 0 | `PED-0` `INF-0` `CAR-0` `UX-0` |
| 1 | `PED-1` `SEC-1` `CHK-1` `CFG-1` `PED-2` `STA-1` `PRD-1` `QA-1` |
| 2 | `PAG-1` `EML-1` `CHK-2` `UX-2` `AGD-1` `REC-1` `PED-F` `REC-2` |
| 3 | `AGD-2` `SRV-1` `CHK-3` `SRV-F1` `PGT-1`⭐ `PRD-2` `SRV-Fpub` `SRV-F2` |
| 4 | `PAG-2` `AVL-1` `BKG-1` `SCH-1` `STO-1`⭐ `AVL-2` `BKG-2` `SCH-2` |
| 5 | `INF-2` `DSH-1` `AVL-F1` `QA-2` `SEC-2` `DSH-2` `AVL-F2` `QA-3` |

⭐ = opcional (pode migrar para o próximo semestre sem afetar o essencial).

## Legenda de status (nos arquivos)
✅ completo · ⚠️ parcial · ❌ ausente · 🔧 precisa correção
