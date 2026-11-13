import gsap from 'gsap';

/**
 * Thunderstorm for the Ball Draw reveal.
 *
 * A bank of silver clouds drifts along the top of the screen, bouncing off the
 * edges. A strike starts at a cloud and random-walks downward in short jagged
 * steps; now and then a thin "root" forks off and wanders away. Everything is
 * silver with a pale-blue glow.
 *
 * Two canvases: the clouds get a CSS blur so they read as a soft fog bank,
 * while the bolts stay sharp on their own layer.
 */

interface Cloud {
  x: number;
  size: number;
  dir: -1 | 1;
  speed: number;
}

/** x1, y1, x2, y2 */
type Segment = [number, number, number, number];

interface Strike {
  trunk: Segment[];
  roots: Segment[];
  born: number;
}

const rand = (n: number) => Math.floor(Math.random() * n);

/** How long a strike stays on screen, ms. */
const STRIKE_LIFE = 460;

/** On, dip, back on, fade — the flicker of a real bolt. */
function flicker(age: number) {
  if (age < 70) return 1;
  if (age < 120) return 0.25;
  if (age < 190) return 1;
  return Math.max(0, 1 - (age - 190) / (STRIKE_LIFE - 190));
}

export function createStorm(cloudCanvas: HTMLCanvasElement, boltCanvas: HTMLCanvasElement) {
  const cloudCtx = cloudCanvas.getContext('2d');
  const boltCtx = boltCanvas.getContext('2d');
  if (!cloudCtx || !boltCtx) return null;

  /** 0 = clear sky, 1 = full cloud bank. Tween this from the timeline. */
  const state = { alpha: 0 };
  let clouds: Cloud[] = [];
  let strikes: Strike[] = [];
  let w = 0;
  let cloudH = 0;
  let dirty = false;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    cloudH = cloudCanvas.clientHeight;
    for (const [canvas, ctx, h] of [
      [cloudCanvas, cloudCtx, cloudH],
      [boltCanvas, boltCtx, window.innerHeight],
    ] as const) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Pack the top edge with clouds at random spacing.
    clouds = [];
    for (let x = 0; x < w; x += rand(10) + 1) {
      clouds.push({ x, size: 8 + rand(30), dir: Math.random() < 0.5 ? -1 : 1, speed: rand(2) + 1 });
    }
    dirty = true;
  };

  /** A thin branch that wanders off the bolt and dies out. */
  const growRoot = (x: number, y: number, into: Segment[]) => {
    let sx = x;
    let sy = y;
    const drift = Math.random() < 0.5 ? -1 : 1;
    for (let i = rand(20); i > 0; i--) {
      const ex = sx + drift * (rand(50) - 15);
      const ey = sy + rand(30);
      into.push([sx, sy, ex, ey]);
      sx = ex;
      sy = ey;
    }
  };

  /** Strike from a cloud down onto (tx, ty). */
  const strike = (tx: number, ty: number) => {
    const trunk: Segment[] = [];
    const roots: Segment[] = [];

    // Start under a cloud somewhere off to one side of the target.
    let sx = Math.min(w, Math.max(0, tx + (Math.random() - 0.5) * w * 0.8));
    let sy = 0;
    while (sy < ty - 30) {
      // Random walk, pulled gently toward the target so the bolt lands on it.
      const pull = (tx - sx) * (0.06 + 0.5 * Math.pow(sy / ty, 3));
      const ex = sx + rand(30) - 15 + pull;
      const ey = sy + 4 + rand(30);
      trunk.push([sx, sy, ex, ey]);
      sx = ex;
      sy = ey;
      if (rand(1000) < 70) growRoot(sx, sy, roots);
    }
    trunk.push([sx, sy, tx, ty]);

    strikes.push({ trunk, roots, born: performance.now() });
  };

  const stroke = (ctx: CanvasRenderingContext2D, segments: Segment[], width: number) => {
    ctx.lineWidth = width;
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of segments) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
  };

  const frame = () => {
    const now = performance.now();
    strikes = strikes.filter((s) => now - s.born < STRIKE_LIFE);
    const active = state.alpha > 0.001 || strikes.length > 0;
    if (!active && !dirty) return;
    dirty = active; // one last clear after the storm passes

    // Clouds: drift, bounce at the edges, and sink in from above as alpha rises.
    cloudCtx.clearRect(0, 0, w, cloudH);
    if (state.alpha > 0.001) {
      cloudCtx.globalAlpha = state.alpha;
      cloudCtx.fillStyle = 'silver';
      const y = -40 * (1 - state.alpha);
      for (const c of clouds) {
        if (c.x <= 0) c.dir = 1;
        else if (c.x >= w) c.dir = -1;
        c.x += c.dir * c.speed;
        cloudCtx.beginPath();
        cloudCtx.arc(c.x, y, c.size, 0, Math.PI * 2);
        cloudCtx.fill();
      }
    }

    boltCtx.clearRect(0, 0, w, window.innerHeight);
    boltCtx.strokeStyle = 'silver';
    boltCtx.lineCap = 'round';
    boltCtx.shadowColor = 'aliceblue';
    boltCtx.shadowBlur = 10;
    for (const s of strikes) {
      boltCtx.globalAlpha = flicker(now - s.born);
      stroke(boltCtx, s.trunk, 3);
      stroke(boltCtx, s.roots, 1);
      // Hot white core down the middle of the trunk.
      boltCtx.strokeStyle = '#fff';
      stroke(boltCtx, s.trunk, 1.2);
      boltCtx.strokeStyle = 'silver';
    }
    boltCtx.globalAlpha = 1;
  };

  resize();
  window.addEventListener('resize', resize);
  gsap.ticker.add(frame);

  return {
    state,
    strike,
    destroy() {
      window.removeEventListener('resize', resize);
      gsap.ticker.remove(frame);
    },
  };
}

export type Storm = NonNullable<ReturnType<typeof createStorm>>;
