# Pet+ — Apresentação Projeto Integrador VI

Apresentação de pitch da plataforma **Pet+**, em HTML/CSS/JS puro.  
Funciona offline, sem build, sem dependências.

---

## 🚀 Como abrir

### Opção 1 — Duplo-clique (mais simples)
Navegue até `pitch/index.html` no Finder e dê duplo-clique. Abre direto no navegador padrão.

### Opção 2 — Servidor local (recomendado para evitar restrições file://)
```bash
cd pitch
python3 -m http.server 8000
# depois abra http://localhost:8000
```

### Opção 3 — Linha de comando (macOS)
```bash
open /Users/marcelfilho/Pet/pitch/index.html
```

---

## ⌨️ Atalhos do teclado

| Tecla              | Ação                                     |
| ------------------ | ---------------------------------------- |
| `→` `Espaço` `PgDn`| Próximo slide                            |
| `←` `PgUp`         | Slide anterior                           |
| `Home`             | Primeiro slide                           |
| `End`              | Último slide                             |
| `1–9`              | Pular direto para o slide (1 a 9)        |
| `0`                | Slide 10                                 |
| `F`                | Entrar/sair de fullscreen                |
| `S`                | Mostrar/esconder notas do apresentador   |
| `Esc`              | Sair de fullscreen / fechar notas        |

**Touch (mobile/tablet):** arraste para esquerda/direita para navegar.  
**Clique** no lado esquerdo/direito do fundo escuro também navega.

---

## 🎤 Modo Apresentador (Speaker Notes)

Pressione `S` em qualquer slide. Um overlay sobe na parte inferior com:

- **Speaker designado** (Marcel, Laura ou Layssa)
- **Cronometragem sugerida**
- **3–5 talking points** em linguagem natural
- **Frase de transição** para o próximo slide

Pressione `S` de novo (ou `Esc`) para esconder.

### Dica de apresentação
- Em monitores duplos: abra a apresentação numa tela em fullscreen (`F`) e mantenha outra janela com este README aberta como cola.
- Ou: ative o modo apresentador (`S`) no monitor onde só você vê (laptop) enquanto o projetor mostra a tela principal.

---

## 🖨️ Exportar para PDF

1. Abra a apresentação no Chrome ou Edge.
2. Use `Cmd+P` (macOS) ou `Ctrl+P` (Windows).
3. Configure:
   - **Destino:** "Salvar como PDF"
   - **Layout:** Paisagem
   - **Tamanho do papel:** A3 ou personalizado 1920×1080
   - **Margens:** Nenhuma
   - **Opções:** marque "Gráficos em segundo plano"
4. Cada slide vira uma página.

O CSS já tem regras `@media print` que removem o contador e a barra de progresso na exportação.

---

## ⏱ Cronometragem total

Pensada para uma janela de **10–12 minutos** (com folga para arguição depois).

| #  | Slide                                  | Tempo | Speaker  |
| -- | -------------------------------------- | ----- | -------- |
| 01 | Capa                                   | ~30s  | Marcel   |
| 02 | Problema                               | ~60s  | Laura    |
| 03 | Solução                                | ~45s  | Laura    |
| 04 | Perfis (5 jornadas)                    | ~45s  | Layssa   |
| 05 | Demo · Vitrine                         | ~90s  | Marcel   |
| 06 | Demo · Hotéis e Pet Sitters            | ~90s  | Marcel   |
| 07 | Demo · Carrinho                        | ~75s  | Laura    |
| 08 | Demo · Dashboard do parceiro           | ~90s  | Layssa   |
| 09 | Confiança · Admin + Escola de Heróis   | ~75s  | Layssa   |
| 10 | Diferenciais                           | ~75s  | Marcel   |
| 11 | Status, Roadmap e Modelo               | ~75s  | Laura    |
| 12 | Fechamento                             | ~20s  | Trio     |
|    | **Total**                              | **~10min50s** |  |

---

## 📁 Estrutura de arquivos

```
pitch/
├── index.html                  # apresentação inteira em um arquivo
├── README.md                   # este arquivo
├── assets/
│   ├── logo.png                # logo Pet+ (copiado de frontend/public/icon.png)
│   └── screenshots/            # vazio — slides usam reprodução HTML/CSS
├── styles/
│   └── main.css                # design system + estilos dos 12 slides
└── scripts/
    ├── navigation.js           # navegação por teclado/touch, fullscreen, escala
    └── speaker-notes.js        # talking points por slide
```

---

## 🎨 Design system

Extraído diretamente de `frontend/src/styles/theme.css`:

- **Primária (laranja Pet+):** `#f97316` (500) com escala 50–900
- **Secundária (teal):** `#14b8a6`
- **Tipografia:** `Nunito` (display, 600–800) + `Inter` (body, 400–700)
- **Acentos do produto:** azul `#3699D2`, laranja `#F58B05`, verde `#10B981`, indigo `#6366F1` (mesmas cores usadas nos gráficos do dashboard real)

Todas as telas demonstradas (vitrine, carrinho, dashboard, admin) são **reproduções HTML/CSS pixel-coerentes** com o produto em `petplus.vercel.app`.

---

## 🛠️ Stack

- HTML5 + CSS3 + JavaScript vanilla
- Zero dependências, zero build
- Ícones inline (Lucide-style SVG sprite)
- Fontes via Google Fonts (com fallback `system-ui` se offline)
- Funciona em qualquer navegador moderno (Chrome, Safari, Firefox, Edge)

---

## ⚙️ Personalização rápida

- **Trocar talking points:** edite `scripts/speaker-notes.js`
- **Ajustar paleta:** veja as variáveis no topo de `styles/main.css`
- **Substituir telas por screenshots reais:** coloque PNGs em `assets/screenshots/` e troque os blocos `.browser-mock` ou `.dashboard-mock` por `<img>` apontando para os arquivos
