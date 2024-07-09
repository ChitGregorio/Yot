// helper functions
const PI2 = Math.PI * 2;
const random = (min, max) => Math.random() * (max - min + 1) + min | 0;
const timestamp = _ => new Date().getTime();

// get the canvas element and its context
const canvas = document.getElementById('birthday');
const ctx = canvas.getContext('2d');

// set canvas dimensions
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// container
class Birthday {
  constructor() {
    this.resize();

    // create a lovely place to store the firework
    this.fireworks = [];
    this.counter = 0;

    // bind event listeners
    document.addEventListener('click', (evt) => this.onClick(evt));
    document.addEventListener('touchstart', (evt) => this.onClick(evt));
  }

  resize() {
    this.width = canvas.width = window.innerWidth;
    let center = this.width / 2 | 0;
    this.spawnA = center - center / 4 | 0;
    this.spawnB = center + center / 4 | 0;

    this.height = canvas.height = window.innerHeight;
    this.spawnC = this.height * .1;
    this.spawnD = this.height * .5;
  }

  onClick(evt) {
    let x = evt.clientX || evt.touches && evt.touches[0].pageX;
    let y = evt.clientY || evt.touches && evt.touches[0].pageY;

    let count = random(3, 5);
    for (let i = 0; i < count; i++) {
      this.fireworks.push(new Firework(
        random(this.spawnA, this.spawnB),
        this.height,
        x,
        y,
        random(0, 260),
        random(30, 110)
      ));
    }

    this.counter = -1;
  }

  update(delta) {
    ctx.globalCompositeOperation = 'hard-light';
    ctx.fillStyle = `rgba(20,20,20,${7 * delta})`;
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.globalCompositeOperation = 'lighter';
    for (let firework of this.fireworks) {
      firework.update(delta);
    }

    // if enough time passed... create new new firework
    this.counter += delta * 3; // each second
    if (this.counter >= 1) {
      this.fireworks.push(new Firework(
        random(this.spawnA, this.spawnB),
        this.height,
        random(0, this.width),
        random(this.spawnC, this.spawnD),
        random(0, 360),
        random(30, 110)
      ));
      this.counter = 0;
    }

    // remove the dead fireworks
    this.fireworks = this.fireworks.filter(firework => !firework.dead);
  }
}

// firework class
class Firework {
  constructor(x, y, targetX, targetY, shade, offsprings) {
    this.dead = false;
    this.offsprings = offsprings;

    this.x = x;
    this.y = y;
    this.targetX = targetX;
    this.targetY = targetY;

    this.shade = shade;
    this.history = [];
  }

  update(delta) {
    if (this.dead) return;

    let xDiff = this.targetX - this.x;
    let yDiff = this.targetY - this.y;

    if (Math.abs(xDiff) > 3 || Math.abs(yDiff) > 3) {
      // move towards the target
      this.x += xDiff * 2 * delta;
      this.y += yDiff * 2 * delta;

      // create particles
      let angle = Math.atan2(yDiff, xDiff);
      this.history.push({
        x: this.x,
        y: this.y
      });

      if (this.history.length > 20) {
        this.history.shift();
      }
    } else {
      if (this.offsprings && !this.childFireworks) {
        let max = this.offsprings;
        let count = random(3, max);
        this.childFireworks = [];

        for (let i = 0; i < count; i++) {
          let targetX = this.x + random(-50, 50);
          let targetY = this.y + random(50, 100);
          let shade = this.shade + random(-30, 30);
          let offsprings = random(0, 5);
          this.childFireworks.push(new Firework(this.x, this.y, targetX, targetY, shade, offsprings));
        }
      }

      this.history.shift();
    }

    if (this.history.length === 0) {
      this.dead = true;
    }

    ctx.globalCompositeOperation = 'lighter';
    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsl(${this.shade}, 100%, 60%)`;
    ctx.beginPath();

    for (let i = 0; i < this.history.length; i++) {
      let point = this.history[i];
      let prevPoint = this.history[i - 1];

      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else if (prevPoint) {
        ctx.lineTo(point.x, point.y);
      }
    }

    ctx.stroke();

    if (!this.childFireworks && random(0, 100) < 5) {
      this.dead = true;
    } else if (this.childFireworks) {
      for (let child of this.childFireworks) {
        child.update(delta);
      }

      if (this.childFireworks.every(child => child.dead)) {
        this.dead = true;
      }
    }
  }
}

// setup
let then = timestamp();
const birthday = new Birthday();

// update loop
function loop() {
  requestAnimationFrame(loop);

  let now = timestamp();
  let delta = (now - then) / 1000;
  then = now;

  birthday.update(delta);
}

loop();
