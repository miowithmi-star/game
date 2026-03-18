// ================================================
// Pixel Pet — Mio   |   v1.3   |   2026
// ================================================

// ----------------------
// Глобальные переменные
// ----------------------
let petType = localStorage.getItem('petType') || '';
let hunger = parseFloat(localStorage.getItem('hunger')) || 50;
let happiness = parseFloat(localStorage.getItem('happiness')) || 50;
let cleanliness = parseFloat(localStorage.getItem('cleanliness')) || 50;
let coins = parseInt(localStorage.getItem('coins')) || 0;
let hasCrown = localStorage.getItem('hasCrown') === 'true';
let flowerLevel = parseInt(localStorage.getItem('flowerLevel')) || 1;

// Физические скорости (импульсы)
let hungerVelocity = 0;
let happinessVelocity = 0;
let cleanlinessVelocity = 0;

// Временные бусты
let foodBoostTimer = 0;         // секунды буста счастья после еды
let lastFightTime = 0;          // защита от спама кнопки драки

// Константы и настройки
const PHYSICS_TICK = 200;       // мс
const DECAY_INTERVAL = 3000;    // мс
const FIGHT_COOLDOWN = 4000;    // мс между драками

// Спрайты и имена
const petSprites = {
  GOLEM: 'https://i.imgur.com/8yZ0K9L.png',
  RAT:   'https://i.imgur.com/7kPqM3x.png',
  SLIME: 'https://i.imgur.com/2vN8j4R.png'
};

const petNames = {
  GOLEM: 'Голем',
  RAT:   'Крыса',
  SLIME: 'Слайм'
};

// Звуки
const winSound = document.getElementById('winSound');
const loseSound = document.getElementById('loseSound');
const feedSound = document.getElementById('feedSound');

// ----------------------
// Сохранение / загрузка
// ----------------------
function saveGame() {
  try {
    localStorage.setItem('petType', petType);
    localStorage.setItem('hunger', hunger.toFixed(1));
    localStorage.setItem('happiness', happiness.toFixed(1));
    localStorage.setItem('cleanliness', cleanliness.toFixed(1));
    localStorage.setItem('coins', coins);
    localStorage.setItem('hasCrown', hasCrown);
    localStorage.setItem('flowerLevel', flowerLevel);
  } catch (e) {
    console.warn('Ошибка сохранения:', e);
  }
}

function resetProgress() {
  if (!confirm('Ты точно хочешь начать всё сначала? Прогресс будет полностью удалён.')) return;

  localStorage.clear();
  location.reload();
}

// ----------------------
// Запуск игры
// ----------------------
function startGame(type) {
  if (!petType) {
    petType = type;
    saveGame();
  }

  const choice = document.getElementById('choice-screen');
  const game = document.getElementById('game-screen');

  choice.classList.add('hidden');
  game.classList.remove('hidden');

  document.getElementById('pet').src = petSprites[petType];
  document.getElementById('petName').textContent = petNames[petType];

  if (hasCrown) {
    document.getElementById('crown').classList.add('visible');
  }

  updateUI();
  log(`Привет! Я ${petNames[petType]}! Очень рад тебя видеть\~ 🌟`, 'welcome');

  // Запускаем циклы
  setInterval(physicsTick, PHYSICS_TICK);
  setInterval(lifeDecay, DECAY_INTERVAL);
}

// ----------------------
// Физика (каждые 200 мс)
// ----------------------
function physicsTick() {
  // Применяем импульсы
  hunger += hungerVelocity * (PHYSICS_TICK / 1000);
  happiness += happinessVelocity * (PHYSICS_TICK / 1000);
  cleanliness += cleanlinessVelocity * (PHYSICS_TICK / 1000);

  // Затухание импульсов (трение)
  hungerVelocity *= 0.925;
  happinessVelocity *= 0.925;
  cleanlinessVelocity *= 0.925;

  // Пассив от короны
  if (hasCrown && Math.random() < 0.018) {
    happinessVelocity += 0.9;
  }

  // Буст от еды
  if (foodBoostTimer > 0) {
    happinessVelocity += 0.65;
    foodBoostTimer -= PHYSICS_TICK / 1000;
  }

  // Ограничения
  hunger = Math.max(0, Math.min(100, hunger));
  happiness = Math.max(0, Math.min(100, happiness));
  cleanliness = Math.max(0, Math.min(100, cleanliness));

  updateUI();
  checkGameOver();
}

// ----------------------
// Медленный распад жизни
// ----------------------
function lifeDecay() {
  const decay = {
    GOLEM: { hunger: 0.28, happy: -0.55, clean: -0.45 },
    RAT:   { hunger: 0.65, happy: -0.70, clean: -1.05 },
    SLIME: { hunger: 0.85, happy: -0.40, clean: -0.55 }
  }[petType] || { hunger: 0.6, happy: -0.6, clean: -0.6 };

  hungerVelocity += decay.hunger;
  happinessVelocity += decay.happy;
  cleanlinessVelocity += decay.clean;

  saveGame();
}

// ----------------------
// Обновление интерфейса
// ----------------------
function updateUI() {
  const hungerFill = document.querySelector('#hunger .fill');
  const happyFill  = document.querySelector('#happy .fill');
  const cleanFill  = document.querySelector('#clean .fill');

  hungerFill.style.width = hunger + '%';
  happyFill.style.width  = happiness + '%';
  cleanFill.style.width  = cleanliness + '%';

  document.getElementById('coins').textContent = `✧ ${coins} монет ✧`;

  const pet = document.getElementById('pet');
  const amplitude = (happiness / 100) * 70 + 20;
  pet.style.setProperty('--jump-amplitude', amplitude + 'px');

  if (happiness > 35) {
    pet.classList.add('jump');
  } else {
    pet.classList.remove('jump');
  }
}

// ----------------------
// Логи с цветами и временем
// ----------------------
function log(message, type = 'normal') {
  const logEl = document.getElementById('log');
  const now = new Date().toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

  const colors = {
    welcome:  '#66ffcc',
    success:  '#00ff9d',
    warning:  '#ff9933',
    danger:   '#ff3366',
    crown:    '#ffd700',
    normal:   '#b090e0'
  };

  const color = colors[type] || colors.normal;

  logEl.innerHTML = `
    <span style="color:#555">[${now}]</span>
    <span style="color:\( {color}"> \){message}</span><br>
  ` + logEl.innerHTML;

  // Ограничение количества строк
  if (logEl.children.length > 14) {
    logEl.removeChild(logEl.lastChild);
  }

  logEl.scrollTop = logEl.scrollHeight;
}

// ----------------------
// Действия игрока
// ----------------------
function feed() {
  hungerVelocity -= 8.5 + Math.random() * 5;
  happinessVelocity += 2.2;
  foodBoostTimer = 9 + Math.random() * 4;
  feedSound.currentTime = 0;
  feedSound.play().catch(() => {});
  log('Ням-ням! Энергия взлетела! 🍰', 'success');
  updateUI();
  saveGame();
}

function play() {
  happinessVelocity += 5.5 + Math.random() * 4;
  hungerVelocity += 2.8;
  cleanlinessVelocity -= 2.2;
  log('Йухууу! Самое весёлое время! 🎈', 'success');
  updateUI();
  saveGame();
}

function clean() {
  cleanlinessVelocity += 11 + Math.random() * 5;
  happinessVelocity += 1.8;
  log('Теперь я сияю чистотой и пахну цветами\~ ✨', 'success');
  updateUI();
  saveGame();
}

function fight() {
  const now = Date.now();
  if (now - lastFightTime < FIGHT_COOLDOWN) {
    log(`Подожди ${Math.ceil((FIGHT_COOLDOWN - (now - lastFightTime))/1000)} сек... Цветочек ещё не оправился!`, 'warning');
    return;
  }
  lastFightTime = now;

  log(`Битва со Злым Цветочком (уровень ${flowerLevel}) началась... 🌸⚔️`, 'normal');

  const critChance = petType === 'GOLEM' ? 0.38 : petType === 'RAT' ? 0.16 : 0.09;
  const dodgeChance = petType === 'RAT' ? 0.32 : 0.12;
  const regenAmount = petType === 'SLIME' ? 13 : 5;

  let playerPower = happiness / 100 + (hasCrown ? 0.28 : 0);
  let enemyPower = 0.48 + flowerLevel * 0.17;

  let win = false;

  // Уклонение
  if (Math.random() < dodgeChance) {
    log('Уклонение! Цветочек промазал мимо!', 'success');
  }
  // Крит
  else if (Math.random() < critChance) {
    log('КРИТИЧЕСКИЙ УДАР! 💥', 'crown');
    playerPower *= 2.6;
  }

  if (playerPower > enemyPower + Math.random() * 0.45) {
    win = true;
  }

  if (win) {
    const reward = 38 + Math.floor(Math.random() * 70) + flowerLevel * 12;
    coins += reward;
    happinessVelocity += 7;
    winSound.currentTime = 0;
    winSound.play().catch(() => {});

    if (!hasCrown) {
      hasCrown = true;
      document.getElementById('crown').classList.add('visible');
      log(`ПОБЕДА! +${reward} монет + ЗОЛОТАЯ КОРОНА 👑`, 'crown');
    } else {
      log(`ПОБЕДА! +${reward} монет 👑`, 'success');
    }

    flowerLevel++;
  } else {
    happinessVelocity -= 10 + flowerLevel * 2.2;
    cleanlinessVelocity -= 7;
    loseSound.currentTime = 0;
    loseSound.play().catch(() => {});
    log('Злой Цветочек оказался сильнее... 😞', 'danger');
  }

  updateUI();
  saveGame();
}

function checkGameOver() {
  if (hunger >= 99.5 || happiness <= 0.5) {
    log('Твой питомец убежал искать новый дом... Game Over 💔', 'danger');
    document.querySelectorAll('button:not(#reset-btn)').forEach(b => b.disabled = true);
  }
}

// Автозапуск
if (petType) {
  startGame(petType);
      }
