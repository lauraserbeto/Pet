/* ═══════════════════════════════════════════════════════════════
   PET+ PITCH DECK — Navigation + Speaker Notes
   Vanilla JS, no dependencies.
   ═══════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const deck = document.getElementById('deck');
  const stage = document.getElementById('stage');
  const slides = Array.from(document.querySelectorAll('.slide'));
  const progressFill = document.getElementById('progress-fill');
  const counterCurrent = document.getElementById('counter-current');
  const counterTotal = document.getElementById('counter-total');
  const speakerOverlay = document.getElementById('speaker-overlay');
  const spTitle = document.getElementById('sp-title');
  const spMeta = document.getElementById('sp-meta');
  const spBody = document.getElementById('sp-body');

  let current = 0;
  let speakerVisible = false;

  // ─────────────────────────────────────────────
  //  Stage scale-to-fit (mantém 1920x1080 lógico)
  // ─────────────────────────────────────────────
  function fitStage() {
    const sw = stage.offsetWidth;  // 1920
    const sh = stage.offsetHeight; // 1080
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    const scale = Math.min(ww / sw, wh / sh);
    // Centralizar via translate(-50%,-50%) combinado com scale na mesma
    // propriedade — evita que o flexbox use a largura original (1920px)
    // e desalinhe o stage quando o viewport é menor que o stage base.
    stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  window.addEventListener('resize', fitStage);
  fitStage();

  // ─────────────────────────────────────────────
  //  Slide control
  // ─────────────────────────────────────────────
  // O #counter-current existe uma única vez no DOM (dentro de .global-counter,
  // no nível do .stage — não duplicado em cada slide) e é atualizado AQUI a
  // cada chamada de show(). Capturas com latência podem registrar o counter
  // antes do textContent ser atualizado, mas no browser ao vivo a atualização
  // é síncrona. Verificado via screenshots em slides 01/02/03/05/08/12.
  function show(idx) {
    if (idx < 0 || idx >= slides.length) return;
    slides.forEach((s, i) => s.classList.toggle('active', i === idx));
    current = idx;
    counterCurrent.textContent = String(idx + 1).padStart(2, '0');
    progressFill.style.width = `${((idx + 1) / slides.length) * 100}%`;
    if (speakerVisible) renderSpeakerNotes(idx);
    history.replaceState(null, '', `#${idx + 1}`);
  }

  function next() { show(Math.min(current + 1, slides.length - 1)); }
  function prev() { show(Math.max(current - 1, 0)); }

  counterTotal.textContent = String(slides.length).padStart(2, '0');

  // Initial slide from hash
  const initial = parseInt(location.hash.slice(1)) || 1;
  show(Math.min(Math.max(initial - 1, 0), slides.length - 1));

  // ─────────────────────────────────────────────
  //  Keyboard
  // ─────────────────────────────────────────────
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      show(0);
    } else if (e.key === 'End') {
      show(slides.length - 1);
    } else if (e.key === 'f' || e.key === 'F') {
      toggleFullscreen();
    } else if (e.key === 's' || e.key === 'S') {
      toggleSpeaker();
    } else if (e.key === 'Escape') {
      if (document.fullscreenElement) document.exitFullscreen();
      if (speakerVisible) toggleSpeaker();
    } else if (/^[0-9]$/.test(e.key)) {
      const n = parseInt(e.key);
      if (n === 0 && slides.length >= 10) show(9);
      else if (n >= 1) show(Math.min(n - 1, slides.length - 1));
    }
  });

  // ─────────────────────────────────────────────
  //  Touch (swipe esquerda/direita)
  // ─────────────────────────────────────────────
  let touchStartX = null;
  let touchStartY = null;

  deck.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  deck.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next(); else prev();
    }
    touchStartX = null;
  });

  // ─────────────────────────────────────────────
  //  Click esquerda/direita do deck (auxiliar)
  // ─────────────────────────────────────────────
  deck.addEventListener('click', (e) => {
    // só dispara em clique direto no fundo, não nos controles
    if (e.target.closest('.slide') || e.target.closest('button')) return;
    const x = e.clientX;
    if (x > window.innerWidth / 2) next(); else prev();
  });

  // ─────────────────────────────────────────────
  //  Fullscreen
  // ─────────────────────────────────────────────
  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }

  // ─────────────────────────────────────────────
  //  Speaker notes
  // ─────────────────────────────────────────────
  function toggleSpeaker() {
    speakerVisible = !speakerVisible;
    speakerOverlay.classList.toggle('visible', speakerVisible);
    if (speakerVisible) renderSpeakerNotes(current);
  }

  function renderSpeakerNotes(idx) {
    const note = window.SPEAKER_NOTES[idx];
    if (!note) {
      spTitle.textContent = '—';
      spMeta.innerHTML = '';
      spBody.innerHTML = '';
      return;
    }
    spTitle.textContent = `Slide ${idx + 1}: ${note.title}`;
    spMeta.innerHTML = `
      <span class="speaker">🎤 ${note.speaker}</span>
      <span>⏱ ${note.duration}</span>
    `;
    const items = note.bullets.map(b => `<li>${b}</li>`).join('');
    const transition = note.transition
      ? `<li class="transition">↳ ${note.transition}</li>`
      : '';
    spBody.innerHTML = `<ul>${items}${transition}</ul>`;
  }
})();
