# STO-1 — Storage de mídia (Cloudinary) — OPCIONAL

> Sprint 4 · Semana 9 (20–26/out) · Infra · Prioridade Opcional · Esforço M · Responsável R1

## Contexto
> **OPCIONAL — pode migrar de semestre.** Esta task **não bloqueia** o marco M4 e só deve ser puxada se houver folga; caso contrário, fica para um sprint futuro.

Hoje toda mídia é **base64 inline no banco**: `UserController.uploadAvatar` grava a data URL direto em `users.avatar_url` (campo Text) — ver comentário em `UserController.js:86-96` ("armazenamos a string base64 inline") — e as fotos de ambiente do sitter também são base64/urls (`UserController.js:155`). Para suportar isso, `app.js:72-73` eleva `express.json`/`urlencoded` para `limit: '50mb'`, o que incha payloads, banco e memória. A proposta é migrar o upload para **storage externo (Cloudinary)**, guardando apenas a URL, e reduzir o limite do express.

## Objetivo
Migrar o upload de mídia (avatar e fotos de ambiente) para Cloudinary, persistindo a **URL externa** em vez de base64, e **reduzir** o limite de corpo do express.json — mantendo compatibilidade com dados antigos já gravados em base64.

## Escopo / Passos
1. Adicionar dependência e config do Cloudinary no backend (`backend/src/config/`), com credenciais via env (validadas no boot, padrão do INF-0).
2. Criar um serviço de upload (`backend/src/services/`) que recebe o arquivo/base64 e devolve a URL segura do Cloudinary.
3. Ajustar `UserController.uploadAvatar` (e o fluxo de `environment_photos`) para enviar ao Cloudinary e salvar a **URL** em `avatar_url`/campo correspondente.
4. Reduzir `express.json`/`urlencoded` de `50mb` para um valor sensato (ex.: `1mb`–`2mb`) em `app.js:72-73`, agora que binários não trafegam como base64 no JSON.
5. **Compatibilidade:** dados antigos (base64 inline) devem continuar renderizando — não quebrar registros existentes; opcionalmente, script de migração para reprocessar.
6. Documentar as variáveis de ambiente novas no `.env.example`.

## Arquivos envolvidos
- `backend/src/controllers/UserController.js` (`uploadAvatar` ~86-96; `environment_photos` ~155)
- `backend/src/app.js` (limites do body ~72-73)
- `backend/src/config/` (config Cloudinary)
- `backend/src/services/` (serviço de upload)
- `.env.example` / validação de env (padrão INF-0)

## Dependências
- **Depende de:** nenhuma.
- **Bloqueia:** nada (opcional).

## Critério de aceite (Definition of Done)
- Uploads passam a gerar **URL externa** (Cloudinary) persistida no banco, não mais base64.
- Limite do `express.json`/`urlencoded` **reduzido** em relação aos 50mb atuais.
- **Compatibilidade** preservada: registros antigos em base64 continuam exibindo normalmente.
- Novas variáveis de ambiente documentadas no `.env.example`.
- Fica **explícito** que a task é opcional e pode migrar de semestre.

## Testes
- Upload de avatar → resposta contém URL Cloudinary; banco guarda URL, não base64.
- Usuário com avatar antigo em base64 → ainda renderiza.
- Payload acima do novo limite → rejeitado com erro claro (limite reduzido em vigor).
- Boot sem as env do Cloudinary → falha de validação clara (não silenciosa).

## Notas técnicas / armadilhas
- Não vazar `password_hash`/`document` nas respostas ao tocar no `UserController` (o `avatar_url` já é omitido de propósito em alguns selects — ver `UserController.js:179`).
- Credenciais do Cloudinary só via env; nunca commitar segredos.
- Ao reduzir o limite do express, revisar outros fluxos que ainda mandem base64 grande para não quebrá-los antes de migrá-los.
- Mercado Pago/Cloudinary são integrações externas opcionais; manter o SIMULADO/base64 como fallback documentado.
- Não commitar direto na `main` — Pull Request.
