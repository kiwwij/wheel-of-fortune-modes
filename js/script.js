/* script.js — Wheel of Fortune
   Поддержка 4 языков (eng, ua, ru, ja)
   Сохранение языка и вариантов в localStorage
   Правильный подсчёт выбранного сектора (указатель сверху ▼)
   Режим "выбывания" (удаление выпавшего варианта через модал)
   Звуки для вращения и результата
   Генерация фавиконки через canvas
   Окно выбора режимов
*/

/* Обёртка, чтобы не засорять глобальную область видимости */
(() => {

  // ---------- Переводы ----------
  const translations = {
    eng: {
      title: "Wheel of Fortune",
      inputPlaceholder: "Enter an option...",
      addButton: "Add",
      spinButton: "Spin",
      resetButton: "Reset",
      removeAndContinue: "Remove & Continue",
      close: "Close",
      modalTitle: "",
      optionsCount: (n) => `${n} option${n !== 1 ? 's' : ''}`,
      tip: "",
      defaultOptions: ["Prize 1", "Prize 2", "Prize 3", "Prize 4", "Prize 5", "Prize 6"],
      modesButton: "Modes",
      modesTitle: "Choose Mode",
      modeRandom: "Random Number 🎲",
      modeCoin: "Heads or Tails 🪙"
    },
    ua: {
      title: "Колесо Фортуни",
      inputPlaceholder: "Введіть варіант...",
      addButton: "Додати",
      spinButton: "Крутити",
      resetButton: "Скинути",
      removeAndContinue: "Видалити & Продовжити",
      close: "Закрити",
      resultTitle: "",
      optionsCount: (n) => `${n} варіант${n%10===1 && n%100!==11 ? '' : (n%10>=2 && n%10<=4 && !(n%100>=12 && n%100<=14) ? 'и' : 'ів')}`,
      tip: "",
      defaultOptions: ["Приз 1", "Приз 2", "Приз 3", "Приз 4", "Приз 5", "Приз 6"],
      modesButton: "Режими",
      modesTitle: "Оберіть режим",
      modeRandom: "Випадкове число 🎲",
      modeCoin: "Орёл або решка 🪙"
    },
    ru: {
      title: "Колесо Фортуны",
      inputPlaceholder: "Введите вариант...",
      addButton: "Добавить",
      spinButton: "Крутить",
      resetButton: "Сброс",
      removeAndContinue: "Удалить & Продолжить",
      close: "Закрыть",
      resultTitle: "",
      optionsCount: (n) => `${n} вариант${n !== 1 ? 'ов' : ''}`,
      tip: "",
      defaultOptions: ["Приз 1", "Приз 2", "Приз 3", "Приз 4", "Приз 5", "Приз 6"],
      modesButton: "Режимы",
      modesTitle: "Выберите режим",
      modeRandom: "Случайное число 🎲",
      modeCoin: "Орёл или решка 🪙"
    },
    ja: {
      title: "運命のルーレット",
      inputPlaceholder: "オプションを入力...",
      addButton: "追加",
      spinButton: "スピン",
      resetButton: "リセット",
      removeAndContinue: "削除して続行",
      close: "閉じる",
      resultTitle: "",
      optionsCount: (n) => `${n} 個のオプション`,
      tip: "",
      defaultOptions: ["賞品1", "賞品2", "賞品3", "賞品4", "賞品5", "賞品6"],
      modesButton: "モード",
      modesTitle: "モードを選択",
      modeRandom: "ランダムな数字 🎲",
      modeCoin: "表か裏か 🪙"
    }
  };

  // ---------- DOM элементы ----------
  const canvas = document.getElementById('wheelCanvas');
  const ctx = canvas.getContext('2d');
  const wheelContainer = document.getElementById('wheelContainer');
  const addBtn = document.getElementById('addBtn');
  const optionInput = document.getElementById('optionInput');
  const optionsList = document.getElementById('optionsList');
  const spinBtn = document.getElementById('spinBtn');
  const resetBtn = document.getElementById('resetBtn');
  const overlay = document.getElementById('overlay');
  const modalResult = document.getElementById('modalResult');
  const removeContinueBtn = document.getElementById('removeContinue');
  const closeModalBtn = document.getElementById('closeModal');
  const langSelect = document.getElementById('langSelect');
  const titleEl = document.getElementById('title');
  const countChip = document.getElementById('countChip');
  const resultTitleEl = document.getElementById('resultTitle');
  const tipText = document.getElementById('tipText');

  // ---------- Аудио (если есть файлы в корне) ----------
  const spinSound = new Audio('spin.mp3'); // пока отсутствует
  spinSound.loop = true;
  const resultSound = new Audio('result.mp3');

  // ---------- Ключи localStorage и состояние ----------
  const LANG_KEY = 'wheel_lang_v1';
  const OPTIONS_KEY = 'wheel_options_v1';
  let currentLang = localStorage.getItem(LANG_KEY) || 'eng';
  let options = loadOptions() || translations[currentLang].defaultOptions.slice();
  let rotation = 0; // угол, в радианах
  let isSpinning = false;
  let lastSelectedIndex = -1;

  // ---------- Подгонка canvas под контейнер ----------
  function fitCanvas() {
    const rect = wheelContainer.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }
  window.addEventListener('resize', fitCanvas);

  // ---------- Вспомогательные: сохранение/загрузка ----------
  function saveLanguage(lang) { localStorage.setItem(LANG_KEY, lang); }
  function saveOptions() { try { localStorage.setItem(OPTIONS_KEY, JSON.stringify(options)); } catch (e) {} }
  function loadOptions() {
    try {
      const raw = localStorage.getItem(OPTIONS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  }

  // ---------- Применение перевода (обновление UI) ----------
  function applyLanguage() {
    const t = translations[currentLang];
    // заголовки и плейсхолдер
    if (titleEl) titleEl.textContent = t.title;
    if (optionInput) optionInput.placeholder = t.inputPlaceholder;
    if (addBtn) addBtn.textContent = t.addButton;
    if (spinBtn) spinBtn.textContent = t.spinButton;
    if (resetBtn) resetBtn.textContent = t.resetButton;
    if (removeContinueBtn) removeContinueBtn.textContent = t.removeAndContinue;
    if (closeModalBtn) closeModalBtn.textContent = t.close;
    if (resultTitleEl) resultTitleEl.textContent = t.resultTitle;
    if (countChip) countChip.textContent = t.optionsCount(options.length);
    if (tipText) tipText.textContent = t.tip;

    // обновляем окно режимов (если есть)
    const modesBtn = document.getElementById('modesBtn');
    const modesTitle = document.getElementById('modesTitle');
    const modeButtons = document.querySelectorAll('#modesOverlay .modal-actions button');
    if (modesBtn) modesBtn.textContent = t.modesButton;
    if (modesTitle) modesTitle.textContent = t.modesTitle;
    if (modeButtons.length >= 3) {
      modeButtons[0].textContent = t.modeRandom;
      modeButtons[1].textContent = t.modeCoin;
      modeButtons[2].textContent = t.close;
    }

    if (langSelect) langSelect.value = currentLang;
  }

  // ---------- Рисование колеса ----------
  function draw() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(cx, cy) - 4;
    const n = Math.max(1, options.length);
    const sector = (Math.PI * 2) / n;

    // сектора
    for (let i = 0; i < n; i++) {
      const start = -Math.PI / 2 + i * sector + rotation;
      const end = start + sector;
      const hue = (i * (360 / n)) % 360;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, start, end, false);
      ctx.closePath();
      ctx.fillStyle = `hsl(${hue} 78% 52%)`;
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.stroke();

      // текст в секторе (перенос при необходимости)
      ctx.save();
      ctx.translate(cx, cy);
      const angle = start + sector / 2;
      ctx.rotate(angle);
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.font = 'bold 14px Inter, Arial, sans-serif';
      drawWrappedText(ctx, options[i] || '', r - 14);
      ctx.restore();
    }

    // внешний круг
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.stroke();
  }

  // вспомогательная функция для многострочного текста вдоль радиуса
  function drawWrappedText(ctx, text, radius) {
    const maxWidth = radius - 8;
    const words = String(text).split(/\s+/).reverse();
    let line = '';
    const lines = [];
    while (words.length) {
      const w = words.pop();
      const test = line ? (line + ' ' + w) : w;
      const m = ctx.measureText(test).width;
      if (m > maxWidth && line) {
        lines.push(line);
        line = w;
      } else {
        line = test;
      }
    }
    if (line) lines.push(line);
    const maxLines = 3;
    const startY = -((lines.length - 1) * 12) - 6;
    for (let i = 0; i < Math.min(lines.length, maxLines); i++) {
      ctx.fillText(lines[i], radius - 10, startY + i * 18);
    }
  }

  // ---------- UI: список опций ----------
  function refreshList() {
    optionsList.innerHTML = '';
    options.forEach((opt, idx) => {
      const row = document.createElement('div');
      row.className = 'item';
      const label = document.createElement('div');
      label.className = 'label';
      label.textContent = opt;
      const del = document.createElement('button');
      del.className = 'btn';
      del.textContent = '✕';
      del.title = 'Remove';
      del.style.background = 'transparent';
      // удаление варианта
      del.addEventListener('click', () => {
        options.splice(idx, 1);
        saveOptions();
        applyLanguage(); // обновляет countChip
        refreshList();
        draw();
      });
      row.appendChild(label);
      row.appendChild(del);
      optionsList.appendChild(row);
    });
    countChip.textContent = translations[currentLang].optionsCount(options.length);
  }

  // ---------- Поиск сектора, который под указателем (вверху) ----------
  function getSectorIndexAtPointer(rot) {
    const n = Math.max(1, options.length);
    const sector = (Math.PI * 2) / n;
    const pointerAngle = -Math.PI / 2; // указатель сверху
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < n; i++) {
      let center = -Math.PI / 2 + (i + 0.5) * sector + rot;
      center = normalizeAngle(center);
      const p = normalizeAngle(pointerAngle);
      let diff = Math.abs(center - p);
      if (diff > Math.PI) diff = 2 * Math.PI - diff;
      if (diff < bestDiff) { bestDiff = diff; best = i; }
    }
    return best;
  }
  function normalizeAngle(a) {
    a = (a + Math.PI) % (2 * Math.PI);
    if (a < 0) a += 2 * Math.PI;
    return a - Math.PI;
  }

  // ---------- Вращение колеса (анимация + звук) ----------
  function spin() {
    if (isSpinning || options.length === 0) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // запуск звука вращения (если доступен)
    spinSound.currentTime = 0;
    spinSound.play().catch(() => {});

    const n = options.length;
    const sector = (Math.PI * 2) / n;
    const targetIndex = Math.floor(Math.random() * n);
    const f0 = - (targetIndex + 0.5) * sector;
    const extraRot = Math.floor(Math.random() * 4) + 4; // 4..7 дополнительных кругов
    const kBase = Math.ceil((rotation - f0) / (2 * Math.PI));
    const k = kBase + extraRot;
    const endRotation = f0 + k * (2 * Math.PI);

    const startRotation = rotation;
    const duration = 4500 + Math.floor(Math.random() * 800);
    const startTime = performance.now();

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(t);
      rotation = startRotation + (endRotation - startRotation) * eased;
      draw();
      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        isSpinning = false;
        spinBtn.disabled = false;
        // остановка звука вращения
        spinSound.pause();
        spinSound.currentTime = 0;

        // нормализуем угол и вычисляем выбранный сектор
        rotation = rotation % (2 * Math.PI);
        const selected = getSectorIndexAtPointer(rotation);
        lastSelectedIndex = selected;

        // проигрываем звук результата и показываем модал
        resultSound.currentTime = 0;
        resultSound.play().catch(() => {});
        showResult(selected);
      }
    }
    requestAnimationFrame(frame);
  }

  // ---------- Показ результата в модальном окне ----------
  function showResult(index) {
    modalResult.textContent = options[index] ?? '—';
    overlay.classList.remove('hidden');
    overlay.setAttribute('aria-hidden', 'false');
  }
  function closeModal() {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // ---------- События UI ----------
  // Добавление варианта
  addBtn.addEventListener('click', () => {
    const v = optionInput.value.trim();
    if (!v) return;
    options.push(v);
    optionInput.value = '';
    saveOptions();
    refreshList();
    draw();
  });
  // Enter в инпуте = добавить
  optionInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addBtn.click(); });

  // Кнопка "Крутить"
  spinBtn.addEventListener('click', spin);

  // Сброс к дефолтным вариантам текущего языка
  resetBtn.addEventListener('click', () => {
    options = translations[currentLang].defaultOptions.slice();
    rotation = 0;
    saveOptions();
    refreshList();
    draw();
  });

  // Удалить выпавший вариант и продолжить
  removeContinueBtn.addEventListener('click', () => {
    if (lastSelectedIndex >= 0 && lastSelectedIndex < options.length) {
      options.splice(lastSelectedIndex, 1);
      saveOptions();
      lastSelectedIndex = -1;
      refreshList();
      draw();
      closeModal();
    } else {
      closeModal();
    }
  });

  // Закрыть модал
  closeModalBtn.addEventListener('click', closeModal);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });

  // Переключение языка
  langSelect.addEventListener('change', (e) => {
    currentLang = e.target.value;
    saveLanguage(currentLang);
    applyLanguage();
    // если опций в localStorage нет — поставить дефолтные текущего языка
    if (!localStorage.getItem(OPTIONS_KEY)) {
      options = translations[currentLang].defaultOptions.slice();
      saveOptions();
    }
    refreshList();
    draw();
  });

  // Клик по указателю тоже запускает вращение
  const pointerEl = document.querySelector('.pointer');
  if (pointerEl) pointerEl.addEventListener('click', spin);

  // Пробел запускает спин, но НЕ если фокус в input/textarea
  document.addEventListener('keydown', (e) => {
    const activeEl = document.activeElement;
    const ignoreTags = ['INPUT', 'TEXTAREA'];
    if (ignoreTags.includes(activeEl.tagName)) return; // игнорируем если ввод
    if (e.code === 'Space') {
      e.preventDefault();
      spin();
    }
  });

  // ---------- Инициализация ----------
  function init() {
    langSelect.value = currentLang;
    applyLanguage();
    refreshList();
    fitCanvas();
    // начальное рисование
    requestAnimationFrame(draw);
  }
  init();

})(); // конец IIFE

// ---------- Генерация фавиконки через canvas ----------
function createFavicon() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  const cx = 32;
  const cy = 32;
  const r = 30;
  const segments = 8;

  // Рисуем радужное колесо в миниатюре
  for (let i = 0; i < segments; i++) {
    const start = (i * 2 * Math.PI) / segments;
    const end = ((i + 1) * 2 * Math.PI) / segments;
    const hue = (i * 360 / segments) % 360;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
    ctx.fill();
  }

  // Блестящая точка в центре
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 10);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, 10, 0, 2 * Math.PI);
  ctx.fill();

  // Создаём или обновляем <link rel="icon">
  const faviconURL = canvas.toDataURL('image/png');
  let link = document.querySelector("link[rel*='icon']");
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.type = 'image/png';
  link.href = faviconURL;
}
window.addEventListener('load', createFavicon);

// ---------- Окно выбора режимов ----------
const modesBtn = document.getElementById('modesBtn');
const modesOverlay = document.getElementById('modesOverlay');
const closeModesBtn = document.getElementById('closeModes');

if (modesBtn && modesOverlay) {
  modesBtn.addEventListener('click', () => {
    modesOverlay.classList.remove('hidden');
    modesOverlay.setAttribute('aria-hidden', 'false');
  });
}
if (closeModesBtn && modesOverlay) {
  closeModesBtn.addEventListener('click', () => {
    modesOverlay.classList.add('hidden');
    modesOverlay.setAttribute('aria-hidden', 'true');
  });
  // закрываем кликом по затемнению
  modesOverlay.addEventListener('click', (e) => {
    if (e.target === modesOverlay) {
      modesOverlay.classList.add('hidden');
      modesOverlay.setAttribute('aria-hidden', 'true');
    }
  });
}