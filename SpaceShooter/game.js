// === Canvas and drawing context ===
const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

// === Game state variables ===
let score = 0;                // Current score
let level = 1;                // Current level
let powerUpType = "None";     // Currently active power-up
let isHeroAlive = true;       // Is the hero alive?
let bulletIndex = 0;          // Index for bullet reuse
let isPaused = false;         // Is the game paused?
let gameStarted = false;      // Has the game started?

// === Keyboard input tracking ===
const keys = { ArrowUp: false, ArrowDown: false, ArrowLeft: false, ArrowRight: false, Space: false };

// === Load images ===
const heroImage = new Image(); heroImage.src = "img/cute_ship.png";
const asteroidImage = new Image(); asteroidImage.src = "img/asteroid.png";
const shieldImage = new Image(); shieldImage.src = "img/shield.png";
const shieldPowerupImage = new Image(); shieldPowerupImage.src = "img/shield.png";
const slowPowerupImage = new Image(); slowPowerupImage.src = "img/slowmo.png";

// === Load sounds ===
const shootSound = new Audio("sounds/shoot.mp3");
const explosionSound = new Audio("sounds/explosion.mp3");
const powerupSound = new Audio("sounds/powerup.mp3");

// === Base sprite object structure ===
const spriteObject = { x: 0, y: 0, width: 50, height: 50 };

// === Hero object creation ===
const hero = Object.create(spriteObject);
hero.x = 50;
hero.y = 260;
hero.width = 70;
hero.height = 30;
hero.vx = 0;
hero.vy = 0;
hero.shield = false; // Whether shield is active

// === Bullets pool (reused for performance) ===
const bullets = Array.from({ length: 150 }, () => ({
  ...spriteObject, x: -10, y: -10, width: 6, height: 3, vx: 0, face: 0
}));

// === Arrays for game entities ===
let enemies = [];
let powerups = [];
let stars = [];
let activePowerUps = []; // Tracks power-ups currently affecting the game

// === Create multiple enemies ===
function createEnemies(num) {
  return Array.from({ length: num }, () => {
    const size = Math.floor(Math.random() * 30) + 20;
    return {
      ...spriteObject,
      x: Math.random() * 300 + 900, // Offscreen spawn
      y: Math.random() * 580,
      width: size,
      height: size,
      vx: -Math.random() * 1 - 0.4, // Moves left
      face: 1
    };
  });
}

// === Create starfield background ===
function createStars(num) {
  return Array.from({ length: num }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    radius: Math.random() * 2 + 1,
    speed: Math.random() * 1 + 0.5
  }));
}

// === Game initialization/reset ===
function init() {
  enemies = createEnemies(20);
  stars = createStars(100);
  powerups = [];
  activePowerUps = [];
  score = 0;
  level = 1;
  bulletIndex = 0;
  isHeroAlive = true;
  powerUpType = "None";
  hero.shield = false;
  gameStarted = true;
  isPaused = false;
  document.getElementById("menu").style.display = "none";
  document.getElementById("hud").style.display = "block";
}

// === Random power-up spawner ===
function spawnPowerUp() {
  if (Math.random() < 0.01) { // 1% chance per frame
    const type = Math.random() < 0.5 ? "shield" : "slow";
    powerups.push({
      x: canvas.width,
      y: Math.random() * canvas.height,
      width: 50,
      height: 50,
      vx: -2,
      type
    });
  }
}

// === Update power-up durations and effects ===
function updatePowerUps() {
  const now = Date.now();
  activePowerUps = activePowerUps.filter(p => {
    if (now - p.startTime >= 5000) { // Power-up expires after 5 seconds
      if (p.type === "slow") enemies.forEach(e => e.vx *= 2);
      if (p.type === "shield") hero.shield = false;
      powerUpType = "None";
      return false;
    }
    return true;
  });
}

// === Main game loop ===
function update() {
  requestAnimationFrame(update); // Loop via animation frame

  if (!gameStarted || isPaused) return; // Do nothing if paused or not started

  updatePowerUps(); // Handle active power-up effects

  // === Clear screen ===
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // === Move stars to simulate background motion ===
  stars.forEach(star => {
    star.x -= star.speed;
    if (star.x < 0) {
      star.x = canvas.width;
      star.y = Math.random() * canvas.height;
    }
  });

  // === Move hero based on input ===
  hero.vx = keys.ArrowRight ? 4 : keys.ArrowLeft ? -4 : 0;
  hero.vy = keys.ArrowDown ? 4 : keys.ArrowUp ? -4 : 0;
  hero.x = Math.max(0, Math.min(hero.x + hero.vx, canvas.width - hero.width));
  hero.y = Math.max(0, Math.min(hero.y + hero.vy, canvas.height - hero.height));

  // === Shooting bullets ===
  if (keys.Space && bulletIndex < bullets.length) {
    const b = bullets[bulletIndex++];
    b.vx = 8;
    b.x = hero.x + hero.width;
    b.y = hero.y + hero.height / 2;
    b.face = 1;
    shootSound.currentTime = 0;
    shootSound.play();
    keys.Space = false;
  }

  // === Move bullets ===
  bullets.forEach(b => {
    if (b.face === 1) {
      b.x += b.vx;
      if (b.x > canvas.width) b.face = 0;
    }
  });

  // === Move enemies ===
  enemies.forEach(e => {
    if (e.face === 1) {
      e.x += e.vx;
      if (e.x < -e.width) {
        e.x = Math.random() * 300 + 900;
        e.y = Math.random() * canvas.height;
        e.face = 1;
      }
    }
  });

  // === Move and handle power-ups ===
  spawnPowerUp();
  powerups.forEach(p => p.x += p.vx);

  // === Collision detection (hero vs enemies) ===
  enemies.forEach(e => {
    if (
      e.face === 1 &&
      hero.x + hero.width > e.x && hero.x < e.x + e.width &&
      hero.y + hero.height > e.y && hero.y < e.y + e.height
    ) {
      if (!hero.shield) {
        isHeroAlive = false;
        explosionSound.play();
      }
    }

    // === Collision detection (bullets vs enemies) ===
    bullets.forEach(b => {
      if (
        b.face === 1 &&
        b.x + b.width > e.x && b.x < e.x + e.width &&
        b.y + b.height > e.y && b.y < e.y + e.height
      ) {
        e.face = 0;
        b.face = 0;
        explosionSound.play();
        score += 10;

        // Level up every 100 points
        if (score % 100 === 0) {
          level++;
          enemies = enemies.concat(createEnemies(5));
        }
      }
    });
  });

  // === Power-up pickup detection ===
  powerups = powerups.filter(p => {
    if (
      hero.x + hero.width > p.x && hero.x < p.x + p.width &&
      hero.y + hero.height > p.y && hero.y < p.y + p.height
    ) {
      powerUpType = p.type;
      powerupSound.play();
      if (p.type === "shield") hero.shield = true;
      if (p.type === "slow") enemies.forEach(e => e.vx *= 0.5);
      activePowerUps.push({ type: p.type, startTime: Date.now() });
      return false;
    }
    return p.x > -p.width;
  });

  // === Draw stars ===
  ctx.fillStyle = "white";
  stars.forEach(star => {
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    ctx.fill();
  });

  // === Draw hero ===
  if (isHeroAlive) ctx.drawImage(heroImage, hero.x, hero.y, hero.width, hero.height);
  if (hero.shield) ctx.drawImage(shieldImage, hero.x - 5, hero.y - 5, hero.width + 10, hero.height + 10);

  // === Draw bullets ===
  ctx.fillStyle = "yellow";
  bullets.forEach(b => {
    if (b.face === 1) ctx.fillRect(b.x, b.y, b.width, b.height);
  });

  // === Draw enemies ===
  enemies.forEach(e => {
    if (e.face === 1) ctx.drawImage(asteroidImage, e.x, e.y, e.width, e.height);
  });

  // === Draw power-ups ===
  powerups.forEach(p => {
    const img = p.type === "shield" ? shieldPowerupImage : slowPowerupImage;
    ctx.drawImage(img, p.x, p.y, p.width, p.height);
  });

  // === Game Over screen ===
  if (!isHeroAlive) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "red";
    ctx.font = "48px Arial";
    ctx.fillText("GAME OVER", canvas.width / 2 - 140, canvas.height / 2);
    return;
  }

  // === Update UI text (HUD) ===
  document.getElementById("score").textContent = `Score: ${score}`;
  document.getElementById("level").textContent = `Level: ${level}`;
  document.getElementById("powerup").textContent = `Power-up: ${powerUpType}`;
}

// === Keyboard input listeners ===
window.addEventListener("keydown", e => {
  if (e.code in keys) keys[e.code] = true;
});
window.addEventListener("keyup", e => {
  if (e.code in keys) keys[e.code] = false;
});

// === Start game button ===
document.getElementById("startBtn").addEventListener("click", () => {
  init();
});

// === Pause/Resume toggle button ===
document.getElementById("pauseBtn").addEventListener("click", () => {
  isPaused = !isPaused;
  document.getElementById("pauseBtn").textContent = isPaused ? "Resume" : "Pause";
});

// === Game loop starts when window is loaded ===
window.onload = () => {
  requestAnimationFrame(update);
};
/* Stuff to add later on:
1. Save high score
2. Different level - different UI
3. Different enemie behaviours */