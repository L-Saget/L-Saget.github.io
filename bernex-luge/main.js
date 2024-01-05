title = "Bernex luge";

description = `
[Tap any] Jump
`;

characters = [];

options = {
  theme: "shapeDark", // shapeDark, crt, shape, pixel, simple
  isPlayingBgm: false,
  isReplayEnabled: true,
  seed: 302,
};

/**
 * @type  { Snow [] }
 */
let snows;

/**
 * @typedef { object } Snow - A decorative floating object in the background
 * @property { Vector } pos - The current position of the object
 * @property { number } speed - The downwards floating speed of this object
 */

/** @type {{height: number, angle: number, va: number, x: number}[]} */
let waves;
/** @type {Vector[]} */
let points;
/** @type {{x: number, vx: number}[]} */
let mines;
let nextMineDist;
/**
 * @type {{pos: Vector, pp: Vector, vel: Vector, angle: number,
 * state: "ski" | "jump"
 * }}
 */
let ship;
let jumpX;

function update() {
  if (!ticks) {
    initGame();
  }
  let scr = 0.1 * difficulty;
  if (ship.pos.x > 50) {
    scr += (ship.pos.x - 50) * 0.1;
  }

  waves.forEach((w, i) => {
    w.x -= scr;
    if (w.x < -20) {
      w.x += 140;
      w.height = rnd(10, 30);
      w.angle = rnd(PI * 2);
      w.va = rnd(0.0001, 0.0004);
    }
    w.angle += w.va;
    points[i * 4].set(w.x, 60 + sin(w.angle) * w.height);
  });
  color("black");
  points.forEach((p, i) => {
    const im = i % 4;
    if (im !== 0) {
      let pp = points[floor(i / 4) * 4];
      let np = points[(floor(i / 4) + 1) * 4];
      const r = [0.2, 0.5, 0.7][im - 1];
      p.set(pp.x + 5 * im, pp.y * (1 - r) + np.y * r);
    }
    let pp = points[wrap(i - 1, 0, points.length)];
    if (pp.x < p.x) {
      line(pp, p);
    }
  });
  nextMineDist -= scr;
  if (nextMineDist < 0) {
    mines.push({x: 103, vx: 0});
    nextMineDist = rnd(200, 420) / sqrt(difficulty);
  }
  color("red");
  remove(mines, (m) => {
    m.x -= scr;
    const [pp, np] = getPoints(m.x);
    if (np == null) {
      return true;
    }
    const oy = np.y - pp.y;
    m.vx += oy * 0.001;
    m.vx *= 0.9;
    m.x += m.vx * sqrt(difficulty);
    const r = (m.x - pp.x) / (np.x - pp.x);
    text("c", m.x, pp.y + oy * r - 5);
    return m.x < -3;
  });
  let sa;
  if (ship.state === "ski") {
    const [pp, np] = getPoints(ship.pos.x);
    if (np != null) {
      const oy = np.y - pp.y;
      ship.vel.x += oy * 0.002;
      ship.vel.x *= 0.925;
      ship.vel.x += 0.035;
      ship.pos.x += ship.vel.x;
      const r = (ship.pos.x - pp.x) / (np.x - pp.x);
      ship.pos.y = pp.y + oy * r;
      sa = pp.angleTo(np);
    }
    if (input.isJustPressed) {
      jumpX = ship.pos.x;
      ship.vel.x = (ship.pos.x - ship.pp.x) * 2;
      ship.vel.y = (ship.pos.y - ship.pp.y) * 5;
      ship.vel.addWithAngle(sa - PI / 2, 1);
      if (ship.vel.y > -1) {
        ship.vel.y = -1;
      }
      ship.pos.add(ship.vel);
      ship.state = "jump";
    }
  } else {
    jumpX -= scr;
    ship.vel.x += 0.005;
    ship.vel.y += input.isPressed ? 0.02 : 0.09;
    ship.vel.mul(0.99);
    ship.pos.add(ship.vel);
    sa = ship.vel.angle;
  }
  if (ship.state === "jump") {
    snows.forEach((snow,i) => {
      // Move the snow to the left
      snow.pos.x -= i%4 ? ship.vel.x*0.5 : ship.vel.x;
      snow.pos.y -= ship.vel.y<0 ?ship.vel.y*0.2:0;
      // Wrap the snow's x position within the screen bounds
      snow.pos.wrap(0, 100, 0, 150);
    });
  }
  ship.pos.x -= scr;
  ship.pos.clamp(5, 95, 5, 95);
  ship.pp.set(ship.pos);
  ship.angle += wrap(sa - ship.angle, -PI, PI) * 0.1;
  sa = ship.angle;
  const p = vec(ship.pos);
  p.addWithAngle(sa - PI * 0.5, 2);
  color("red");
  bar(p, 3, 2, sa);
  p.addWithAngle(sa - PI * 0.4, 2);
  color("yellow");
  bar(p, 4, 2, sa);
  p.addWithAngle(sa - PI * 0.6, 2);
  const c = bar(p, 1, 2, sa).isColliding;
  if (ship.state === "jump" && c.rect.black) {
    const d = ship.pos.x - jumpX;
    if (d > 0) {
      addScore(ceil(sqrt(d * d) + ship.vel.x), ship.pos);
    }
    color("black");
    particle(ship.pos.x,ship.pos.y,ship.vel.y*5,rnd(1,(ship.vel.y+ship.vel.x)/2));
    color("light_black");
    particle(ship.pos.x,ship.pos.y,ship.vel.y1,(ship.vel.y+ship.vel.x)/4);
    color("light_red");
    particle(ship.pos.x,ship.pos.y,ship.vel.y/2,(ship.vel.y+ship.vel.x)/4);
    ship.state = "ski";
    ship.vel.x *= 0.5;
  }
  if (c.text["c"]) {
    end();

  }
  snows.forEach((snow, i) => {
    // Move the snow downwards
    snow.pos.y += snow.speed;
    // Bring the snow back to top once it's past the bottom of the screen
    snow.pos.wrap(0, 100, 0, 150);
    color("light_black");
    // Draw the snow as a square of size 1
    g = i%4 ? box(snow.pos, 1) : box(snow.pos, 2);
    if(i%4 && g.isColliding.rect.black) {
      snow.pos.y = 150;
    }
  });

  /**
   * Retrieve points for a given x value.
   *
   * @param {number} x
   * @returns An array of two vectors (previous and next)
   */
  function getPoints(x) {
    let previousPoint;
    let nextPoint;
    for (let i = 0; i < points.length; i++) {
      previousPoint = points[wrap(i - 1, 0, points.length)];
      nextPoint = points[i];
      if (previousPoint.x > nextPoint.x) {
        continue;
      }
      if (previousPoint.x <= x && x < nextPoint.x) {
        return [previousPoint, nextPoint];
      }
    }

    return [undefined, undefined];
  }
}


function initGame () {
  waves = times(7, (i) => {
    return {
      height: rnd(10, 20),
      angle: (i % 2) * PI + rnds(PI / 4),
      va: rnd(0.0001, 0.0003),
      x: i * 20 - 20,
    };
  });
  points = times(25, (i) => vec());
  mines = [];
  nextMineDist = 200;
  ship = {
    pos: vec(40, 60),
    pp: vec(40, 60),
    vel: vec(),
    angle: 0,
    state: "ski",
  };
  snows = times(40, () => {
    // Random number generator function
    // rnd( min, max )
    const posX = rnd(0, 100);
    const posY = rnd(0, 150);
    // An object of type Snow with appropriate properties
    return {
      // Creates a Vector
      pos: vec(posX, posY),
      // More RNG
      speed: rnd(0.2, 0.8)
    };
  });
}
