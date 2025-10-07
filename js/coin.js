// js/coin.js — улучшенная анимация монеты
document.addEventListener('DOMContentLoaded', () => {
  const langSelect = document.getElementById('langSelect');
  const flipBtn = document.getElementById('flipBtn');
  const resetBtn = document.getElementById('resetBtn');
  const resultText = document.getElementById('resultText');
  const footerText = document.getElementById('footerText'); // may be null
  const coin = document.getElementById('coin');
  const backBtn = document.getElementById('backBtn');

  const flipSound = document.getElementById('flipSound');
  const resultSound = document.getElementById('resultSound');

  if (!flipBtn || !resetBtn || !coin || !langSelect) {
    console.error('coin.js: required elements missing. Check IDs: flipBtn, resetBtn, coin, langSelect');
    return;
  }

  // локализация
  let currentLang = localStorage.getItem('lang') || 'eng';
  const texts = {
    eng: { title: '🪙 Coin Flip', flip: 'Flip', reset: 'Reset', heads: 'Heads', tails: 'Tails', footer: 'Good luck!' },
    ua:  { title: 'Підкинь монету', flip: 'Підкинути', reset: 'Скинути', heads: 'Орел', tails: 'Решка', footer: 'Удачі!' },
    ru:  { title: 'Орёл и решка', flip: 'Бросить', reset: 'Сбросить', heads: 'Орёл', tails: 'Решка', footer: 'Удачи!' },
    ja:  { title: 'コインを投げる', flip: '投げる', reset: 'リセット', heads: '表', tails: '裏', footer: '頑張って!' }
  };

  function setLanguage(lang) {
    currentLang = texts[lang] ? lang : 'eng';
    localStorage.setItem('lang', currentLang);
    const t = texts[currentLang];
    const titleEl = document.getElementById('title');
    if (titleEl) titleEl.textContent = t.title;
    const flipText = document.getElementById('flipText');
    if (flipText) flipText.textContent = t.flip;
    const resetText = document.getElementById('resetText');
    if (resetText) resetText.textContent = t.reset;
    if (footerText) footerText.textContent = t.footer;
    if (langSelect) langSelect.value = currentLang;
  }
  setLanguage(currentLang);
  langSelect.addEventListener('change', (e) => setLanguage(e.target.value));

  // state
  let isFlipping = false;
  let totalDeg = 0; // накопленное вращение в градусах

  const normalize360 = (d) => ((d % 360) + 360) % 360;

  function safePlay(audioEl) {
    if (!audioEl) return;
    try { audioEl.currentTime = 0; audioEl.play().catch(()=>{}); } catch (e) {}
  }

  flipBtn.addEventListener('click', () => {
    if (isFlipping) return;
    isFlipping = true;

    // очистим текст результата
    if (resultText) resultText.textContent = '';

    // звук вращения
    safePlay(flipSound);

    // результат
    const isHeads = Math.random() < 0.5;

    // текущая ориентация (0..359)
    const currentModulo = normalize360(totalDeg);
    const desiredModulo = isHeads ? 0 : 180;
    const deltaModulo = (desiredModulo - currentModulo + 360) % 360;

    // сколько дополнительных полных оборотов (делаем немного вариативности)
    const extraFullTurns = Math.floor(Math.random() * 5) + 6; // 6..10 full turns
    const delta = extraFullTurns * 360 + deltaModulo;

    // длительность пропорциональна количеству оборотов (но в разумных пределах)
    const duration = Math.min(3600, 900 + Math.floor(extraFullTurns * 200) + Math.floor(Math.random() * 600));

    totalDeg += delta; // целевой абсолютный угол для transform

    // применяем переход и целевой transform (через RAF для надежности)
    coin.style.willChange = 'transform';
    coin.style.transition = `transform ${duration}ms cubic-bezier(.22,.9,.32,1)`;

    // force layout then run transform
    // (requestAnimationFrame гарантирует браузеру прочитку предыдущих стилей)
    requestAnimationFrame(() => {
      coin.style.transform = `rotateY(${totalDeg}deg)`;
    });

    // Обработчик завершения анимации (однократно)
    const onEnd = (e) => {
      if (e.propertyName !== 'transform') return;
      // нормализуем totalDeg, чтобы числа не росли бесконечно
      totalDeg = normalize360(totalDeg);

      // тонкая "закрутка/успокоение" — небольшой nudge (необязательно)
      // тут можно добавить небольшой визуальный отскок, но осторожно:
      // coin.style.transition = 'transform 300ms ease-out';
      // coin.style.transform = `rotateY(${totalDeg + 6}deg)`;
      // setTimeout(()=> coin.style.transform = `rotateY(${totalDeg}deg)`, 300);

      // звук результата и текст
      safePlay(resultSound);
      if (resultText) {
        resultText.textContent = isHeads ? texts[currentLang].heads : texts[currentLang].tails;
        resultText.classList.add('pulse');
        setTimeout(() => resultText.classList.remove('pulse'), 600);
      }
      isFlipping = false;
      coin.removeEventListener('transitionend', onEnd);
    };

    coin.addEventListener('transitionend', onEnd);
  });

  // Reset: аккуратно вернуть монету в исходное положение
  resetBtn.addEventListener('click', () => {
    // обрываем текущую анимацию и возвращаемся к 0
    coin.style.transition = 'transform 400ms ease';
    totalDeg = 0;
    // применяем через RAF
    requestAnimationFrame(() => {
      coin.style.transform = 'rotateY(0deg)';
    });
    if (resultText) resultText.textContent = '';
    isFlipping = false;
  });

  // Back
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      window.location.href = 'index.html';
    });
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('iconCanvas');
  const ctx = canvas.getContext('2d');

  // --- Градиентный круг ---
  const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
  gradient.addColorStop(0, '#7c3aed'); // фиолетовый
  gradient.addColorStop(1, '#06b6d4'); // голубой
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  // --- Нарисовать эмоджи монеты поверх ---
  ctx.font = '32px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('🪙', 32, 32);

  // --- Создаём favicon ---
  const favicon = document.createElement('link');
  favicon.rel = 'icon';
  favicon.type = 'image/png';
  favicon.href = canvas.toDataURL('image/png');
  document.head.appendChild(favicon);
});