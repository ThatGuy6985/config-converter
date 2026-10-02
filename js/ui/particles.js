export class ParticleDriftBackground {
  constructor(canvasId = 'particle-drift-canvas') {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.mode = document.documentElement.getAttribute('data-theme') || 'dark';
    this.width = 0;
    this.height = 0;
    this.nodes = [];
    this.beams = [];
    this.chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ@#$%&*()'.split('');
    this.mouse = { x: -1000, y: -1000 };
    this.animId = null;
    this.isReducedMotion = false;

    this.checkReducedMotion();
    this.init();
  }

  checkReducedMotion() {
    this.isReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  init() {
    this.resize();
    this.initParticles();
    this.bindEvents();
    if (!this.isReducedMotion) {
      this.start();
    } else {
      this.drawFrame();
    }
  }

  setMode(mode) {
    this.mode = mode;
    this.drawFrame();
  }

  resize() {
    if (!this.canvas) return;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
  }

  initParticles() {
    const nodeCount = Math.min(75, Math.max(25, Math.round(this.width / 24)));
    const beamCount = Math.min(20, Math.max(8, Math.round(this.width / 90)));

    this.nodes = Array.from({ length: nodeCount }).map(() => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      vy: Math.random() * 0.35 + 0.1,
      char: this.chars[Math.floor(Math.random() * this.chars.length)]
    }));

    this.beams = Array.from({ length: beamCount }).map(() => ({
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      length: Math.random() * 110 + 50,
      speed: Math.random() * 3.5 + 1.8,
      opacity: Math.random() * 0.35 + 0.2
    }));
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.initParticles();
    }, { passive: true });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    }, { passive: true });

    window.addEventListener('mouseout', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    }, { passive: true });

    if (window.matchMedia) {
      window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
        if (this.isReducedMotion) {
          this.stop();
          this.drawFrame();
        } else {
          this.start();
        }
      });
    }
  }

  start() {
    if (this.animId || this.isReducedMotion) return;
    const loop = () => {
      this.drawFrame();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  drawFrame() {
    const { ctx, width, height, mode, mouse } = this;
    if (!ctx || width === 0 || height === 0) return;

    ctx.clearRect(0, 0, width, height);

    const isLight = mode === 'light';

    const beamColor = isLight ? '37, 99, 235' : '96, 165, 250';
    const lineColor = isLight ? '36, 48, 68' : '156, 163, 175';
    const charColor = isLight ? 'rgba(36, 48, 68, 0.3)' : 'rgba(156, 163, 175, 0.35)';
    const activeColor = isLight ? '#2563EB' : '#60A5FA';
    const proximityAlpha = isLight ? 0.12 : 0.12;

    for (let i = 0; i < this.beams.length; i++) {
      const b = this.beams[i];
      if (!this.isReducedMotion) {
        b.y -= b.speed;
        if (b.y + b.length < 0) {
          b.y = height + 80;
          b.x = Math.random() * width;
        }
      }

      const grad = ctx.createLinearGradient(b.x, b.y, b.x, b.y + b.length);
      grad.addColorStop(0, `rgba(${beamColor}, ${b.opacity})`);
      grad.addColorStop(1, 'transparent');

      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x, b.y + b.length);
      ctx.stroke();
    }

    ctx.lineWidth = 0.5;
    const nodeLen = this.nodes.length;
    for (let i = 0; i < nodeLen; i++) {
      const n1 = this.nodes[i];
      for (let j = i + 1; j < nodeLen; j++) {
        const n2 = this.nodes[j];
        const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y);
        if (dist < 110) {
          ctx.strokeStyle = `rgba(${lineColor}, ${proximityAlpha * (1 - dist / 110)})`;
          ctx.beginPath();
          ctx.moveTo(n1.x, n1.y);
          ctx.lineTo(n2.x, n2.y);
          ctx.stroke();
        }
      }
    }

    ctx.font = '11px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < nodeLen; i++) {
      const n = this.nodes[i];
      if (!this.isReducedMotion) {
        n.y += n.vy;
        if (n.y > height + 20) {
          n.y = -20;
          n.x = Math.random() * width;
        }
      }

      const mouseDist = Math.hypot(mouse.x - n.x, mouse.y - n.y);

      if (mouseDist < 160 && Math.random() > 0.96) {
        n.char = this.chars[Math.floor(Math.random() * this.chars.length)];
      }

      if (mouseDist < 160) {
        ctx.strokeStyle = `rgba(${beamColor}, ${0.35 * (1 - mouseDist / 160)})`;
        ctx.beginPath();
        ctx.moveTo(n.x, n.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }

      ctx.fillStyle = mouseDist < 160 ? activeColor : charColor;
      ctx.fillText(n.char, n.x, n.y);
    }
  }
}

export function initParticleDrift() {
  if (typeof window !== 'undefined') {
    window.ParticleDriftBg = new ParticleDriftBackground('particle-drift-canvas');
  }
}
