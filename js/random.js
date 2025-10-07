document.addEventListener("DOMContentLoaded", () => {
  const minInput = document.getElementById("minInput");
  const maxInput = document.getElementById("maxInput");
  const generateBtn = document.getElementById("generateBtn");
  const resultNumber = document.getElementById("resultNumber");
  const langSelect = document.getElementById("langSelect");
  const backBtn = document.getElementById("backBtn");
  const title = document.getElementById("title");
  const tipText = document.getElementById("tipText");

  // --- Локализация ---
  const translations = {
    eng: {
      title: "🎲 Random Number",
      back: "← Back",
      min: "Min",
      max: "Max",
      generate: "Generate",
      tip: "Enter two numbers — the generator will pick a random value between them.",
    },
    ua: {
      title: "🎲 Випадкове число",
      back: "← Назад",
      min: "Мін.",
      max: "Макс.",
      generate: "Згенерувати",
      tip: "Введіть два числа — генератор вибере випадкове значення між ними.",
    },
    ru: {
      title: "🎲 Случайное число",
      back: "← Назад",
      min: "Мин.",
      max: "Макс.",
      generate: "Сгенерировать",
      tip: "Введите два числа — генератор выберет случайное значение между ними.",
    },
    ja: {
      title: "🎲 ランダム数字",
      back: "← 戻る",
      min: "最小",
      max: "最大",
      generate: "生成",
      tip: "2つの数字を入力すると、その間のランダムな値が生成されます。",
    },
  };

  // --- Функция смены языка ---
  function applyLanguage(lang) {
    const t = translations[lang];
    title.textContent = t.title;
    backBtn.textContent = t.back;
    minInput.placeholder = t.min;
    maxInput.placeholder = t.max;
    generateBtn.textContent = t.generate;
    tipText.textContent = t.tip;
  }

  // --- Загрузка языка из localStorage ---
  const savedLang = localStorage.getItem("language") || "eng";
  langSelect.value = savedLang;
  applyLanguage(savedLang);

  // --- Изменение языка ---
  langSelect.addEventListener("change", () => {
    const newLang = langSelect.value;
    localStorage.setItem("language", newLang);
    applyLanguage(newLang);
  });

  // --- Кнопка назад ---
  backBtn.addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // --- Генерация числа ---
  generateBtn.addEventListener("click", () => {
    const min = parseInt(minInput.value);
    const max = parseInt(maxInput.value);

    if (isNaN(min) || isNaN(max) || min > max) {
      resultNumber.textContent = "⚠️";
      soundError.play();
      return;
    }

    const random = Math.floor(Math.random() * (max - min + 1)) + min;
    resultNumber.textContent = random;

    // Анимация результата
    resultNumber.style.transition = "transform 0.3s ease";
    resultNumber.style.transform = "scale(1.4)";
    setTimeout(() => {
      resultNumber.style.transform = "scale(1)";
    }, 300);

    soundSuccess.play();
  });
});

  // --- Генерация иконки ---
  document.addEventListener("DOMContentLoaded", () => {
    const canvas = document.getElementById('iconCanvas');
    const ctx = canvas.getContext('2d');

    // Нарисуем простой круг с градиентом (можно заменить на что угодно)
    const gradient = ctx.createRadialGradient(32, 32, 5, 32, 32, 32);
    gradient.addColorStop(0, '#7c3aed');
    gradient.addColorStop(1, '#06b6d4');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 30, 0, Math.PI * 2);
    ctx.fill();

    // Нарисуем Font Awesome иконку сверху
    ctx.fillStyle = '#fff';
    ctx.font = '32px "Font Awesome 6 Free"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\uf0c8', 32, 32); // пример: квадратная иконка

    // Создадим dataURL и добавим как фавикон
    const favicon = document.createElement('link');
    favicon.rel = 'icon';
    favicon.type = 'image/png';
    favicon.href = canvas.toDataURL('image/png');
    document.head.appendChild(favicon);
});