// Bill Wiegert
// CMPT304
// Assignment #2
// 03-09-2020

const PELLET_DUR = 60000;
const PM_WIDTH = 50;
const PELLET_WIDTH = 25;
const STEP = 2; // PX per move
const SPEED = 1; // MS of delay between moves
const EXTRA_PELLETS = 15;
const DECAY_RATE = .97;
const DIRECTIONS = {
  "left": { x: -1, y: 0 },
  "right": { x: 1, y: 0 },
  "up": { x: 0, y: -1 },
  "down": { x: 0, y: 1 }
};

let pelletTime = 1;
let score = 0;

// Ensure DOM content is loaded before attempting to manipulate it
document.addEventListener("DOMContentLoaded", function(event) {
  const FIELD = document.querySelector("#field");
  const PIE_MAN_DOM = document.querySelector("#pie-man");
  const SCORE_DOM = document.querySelectorAll(".score");
  const GAME_OVER = document.querySelector("#game-over");
  let pieMan = new PieMan(PIE_MAN_DOM);
  let pellets = [];
  pellets.push(new Pellet(pelletTime));
  window.pieMan = pieMan;
  window.pellets = pellets;

  // Listen for key presses
  document.addEventListener('keydown', handleKeypress);
  let tick = setInterval(update, 50);

  // Change direction on keypresses
  function handleKeypress(event) {
    switch (event.code) {
      case 'KeyW':
      case 'ArrowUp':
        pieMan.changeDir("up");
        break;
      case 'KeyA':
      case 'ArrowLeft':
        pieMan.changeDir("left");
        break;
      case 'KeyS':
      case 'ArrowDown':
        pieMan.changeDir("down");
        break;
      case 'KeyD':
      case 'ArrowRight':
        pieMan.changeDir("right");
        break;
    }
    pieMan.startMoving();
  }

  // Handle collision detection and game ending
  function update() {
    if (pellets.length == 0) {
      gameOver();
      return;
    }

    pellets.forEach((pellet, i) => {
      // Prune any pellets that despawned
      if (pellet.dead) {
        pellets.splice(i, 1);
      } else

      // Check for collision
      if (Math.abs((pieMan.pos.x + PM_WIDTH/2) - (pellet.pos.x + PELLET_WIDTH/2)) < PM_WIDTH/2 + PELLET_WIDTH/2
        && Math.abs((pieMan.pos.y + PM_WIDTH/2) - (pellet.pos.y + PELLET_WIDTH/2)) < PM_WIDTH/2 + PELLET_WIDTH/2) {
          pellet.consume();
          pelletTime *= DECAY_RATE; // Decay pellet lifespan
          pellets[i] = new Pellet(pelletTime); // Replace consumed pellet with a new one
          for (let i = 0; i < EXTRA_PELLETS; i++) {
            pellets.push(new Pellet(pelletTime)); // Add 2nd new pellet
          }
          score++; // Increase score
          SCORE_DOM.forEach(el => {
            el.innerHTML = score;
          });
        }
    });
  }

  // End of game actions
  function gameOver() {
    clearInterval(tick);
    console.log(`Game Over, score: ${score}`);
    GAME_OVER.style.display = "block";
  }
});

class PieMan {
  constructor(domElement) {
    this.domElement = domElement;
    this.pos = { x: window.innerWidth / 2, y: window.innerHeight/2 };
    this.dir = { x: 0, y: 0 }; // Direction of movement
    this.moving = false;
  }

  // Increase pos by direction times step amount
  move() {
    let newPos = {};
    newPos.x = this.pos.x + (this.dir.x * STEP);
    newPos.y = this.pos.y + (this.dir.y * STEP);

    this.pos = this.inBounds(newPos) ? newPos : this.inBounds(this.pos) ? this.pos : this.rescueMe();

    this.domElement.style.left = `${this.pos.x}px`;
    this.domElement.style.top = `${this.pos.y}px`;
  }

  // Check if position is within the window
  inBounds(pos) {
    return pos.x >= 0 && pos.y >= 0 &&
      pos.x + PM_WIDTH <= window.innerWidth && pos.y + PM_WIDTH <= window.innerHeight;
  }

  // Move pieman back inside the window if he ends up outside of it (window must have resized)
  rescueMe() {
    return {
      x: this.pos.x > window.innerWidth - PM_WIDTH ? this.pos.x - (this.pos.x - window.innerWidth) - PM_WIDTH : this.pos.x,
      y: this.pos.y > window.innerHeight - PM_WIDTH ? this.pos.y - (this.pos.y - window.innerHeight) - PM_WIDTH : this.pos.y
    };
  }

  // Begin moving every 5ms
  startMoving() {
    if (!this.moving) {
      this.moving = setInterval(() => this.move(), SPEED);
      this.startChomping();
    }
  }

  // Change direction on keypress
  changeDir(dir) {
    this.dir = DIRECTIONS[dir];
    Object.keys(DIRECTIONS).forEach(key => {
      this.toggleClass(key, false);
    });

    this.toggleClass(dir, true);
  }

  // Alter between open and closed mouth
  chomp() {
    this.toggleClass("open");
  }

  startChomping() {
    this.chomping = setInterval(() => this.chomp(), 150);
  }

  stopChomping() {
    clearInterval(this.chomping);
    this.toggleClass("open", true);
  }

  // Helper function to toggle classes of domElement
  toggleClass(className, force) {
    this.domElement.classList.toggle(className, force);
  }
}

class Pellet {
  constructor(lifespan = 1) {
    this.lifespan = PELLET_DUR * lifespan + 1000;
    this.spawn();
  }

  // Randomly generate pellet in the window
  spawn() {
    this.pos = {
      x: Math.floor(Math.random() * (window.innerWidth - PELLET_WIDTH)),
      y: Math.floor(Math.random() * (window.innerHeight - PELLET_WIDTH))
    }
    let pellet = document.createElement("DIV");
    pellet.classList.add("pellet");
    pellet.style.left = `${this.pos.x}px`;
    pellet.style.top = `${this.pos.y}px`;
    pellet.style.backgroundColor = `rgb(${Math.random() * 256} ${Math.random()*256} ${Math.random()*256})`;

    this.domElement = pellet;
    document.querySelector("#field").appendChild(pellet);

    this.timer = setTimeout(() => this.despawn(), this.lifespan);
    this.dead = false;
  }

  // Remove upon collision with pieman
  consume() {
    this.domElement.parentNode.removeChild(this.domElement);
    this.dead = true;
    clearInterval(this.timer);
  }

  // Remove when lifespan ends
  despawn() {
    this.domElement.parentNode.removeChild(this.domElement);
    this.dead = true;
  }
}
