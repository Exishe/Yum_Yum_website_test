/*
 * A YUM-YUM donut drawn live with three.js, after the "live 3D" build guide:
 * every part is built from code (no model files), lit by a small studio baked
 * into the environment, and filmed by a camera that follows a scroll cue list.
 * Units are centimetres: the donut is about 9 cm across.
 */
import * as THREE from "three";

export type PartId = "dough" | "glaze" | "drizzle" | "sprinkles";
export type Anchor = { id: PartId; x: number; y: number; visible: boolean };
export type FrameInfo = { cover: number; sprinkles: number; anchors: Anchor[]; explode: number };

const R = 3.0; // ring radius
const TUBE = 1.45; // tube radius
const SQUASH = 0.74; // donuts are flatter than a torus

type Shot = {
  frame: number;
  elev: number;
  az: number;
  explode: number;
  offsetX: number;
  lookY: number;
};
type Cue = { at: number; shot: Shot; timeScale: number };

// Five beats: hero, close-up on the glaze, apart, around, back together.
const CUES: Cue[] = [
  {
    at: 0.0,
    shot: { frame: 10.5, elev: 38, az: 0, explode: 0, offsetX: -0.2, lookY: 0 },
    timeScale: 1,
  },
  {
    at: 0.25,
    shot: { frame: 4.2, elev: 24, az: 30, explode: 0, offsetX: -0.08, lookY: 0.9 },
    timeScale: 1 / 6,
  },
  {
    at: 0.5,
    shot: { frame: 15.5, elev: 14, az: 50, explode: 1, offsetX: -0.1, lookY: 2.8 },
    timeScale: 1,
  },
  {
    at: 0.75,
    shot: { frame: 15.5, elev: 22, az: 230, explode: 1, offsetX: -0.12, lookY: 2.8 },
    timeScale: 1,
  },
  {
    at: 1.0,
    shot: { frame: 10.5, elev: 62, az: 360, explode: 0, offsetX: -0.14, lookY: 0 },
    timeScale: 1,
  },
];

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);

function shotAt(p: number): { shot: Shot; timeScale: number } {
  let i = 0;
  while (i < CUES.length - 2 && p > CUES[i + 1]!.at) i++;
  const a = CUES[i]!;
  const b = CUES[i + 1]!;
  const t = smooth(clamp01((p - a.at) / (b.at - a.at)));
  const mix = (x: number, y: number) => x + (y - x) * t;
  const s: Shot = {
    frame: mix(a.shot.frame, b.shot.frame),
    elev: mix(a.shot.elev, b.shot.elev),
    az: mix(a.shot.az, b.shot.az),
    explode: mix(a.shot.explode, b.shot.explode),
    offsetX: mix(a.shot.offsetX, b.shot.offsetX),
    lookY: mix(a.shot.lookY, b.shot.lookY),
  };
  return { shot: s, timeScale: mix(a.timeScale, b.timeScale) };
}

/** Point on the (flattened) torus surface at ring angle u and tube angle v, tube radius r. */
function torusPoint(u: number, v: number, r: number, out = new THREE.Vector3()) {
  const ring = R + r * Math.cos(v);
  return out.set(ring * Math.cos(u), r * Math.sin(v) * SQUASH, ring * Math.sin(u));
}

// Small deterministic noise so every build looks the same.
function noise(x: number) {
  return (
    Math.sin(x * 1.7 + 1.3) * 0.5 + Math.sin(x * 3.1 + 0.4) * 0.3 + Math.sin(x * 7.3 + 2.1) * 0.2
  );
}

function buildDough() {
  const U = 160;
  const V = 64;
  const pos: number[] = [];
  const col: number[] = [];
  const idx: number[] = [];
  const golden = new THREE.Color("#d99a52");
  const band = new THREE.Color("#f6dcae"); // the pale ring where a fried donut floats
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  for (let i = 0; i <= U; i++) {
    const u = (i / U) * Math.PI * 2;
    for (let j = 0; j <= V; j++) {
      const v = (j / V) * Math.PI * 2;
      // A gentle, irregular surface; not ridges.
      const bump = 1 + 0.012 * noise(u * 3 + v * 2) + 0.006 * noise(u * 7 - v * 5);
      torusPoint(u, v, TUBE * bump, p);
      pos.push(p.x, p.y, p.z);
      const b = Math.exp(-Math.pow(Math.sin(v) / 0.16, 2)) * (0.75 + 0.25 * noise(u * 9));
      c.copy(golden).lerp(band, clamp01(b));
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j;
      const b = (i + 1) * (V + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The glaze: the top of the torus, a little thicker, with drips over both edges. */
function buildGlaze() {
  const U = 240;
  const V = 56;
  const r = TUBE + 0.07;
  const pos: number[] = [];
  const spread: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= U; i++) {
    const u = (i / U) * Math.PI * 2;
    // Drips: a few long ones, many short ones.
    const drip = Math.pow(Math.max(0, Math.sin(u * 3 + 1.1) * Math.sin(u * 7 + 0.3)), 2);
    const dOut = 0.22 + 0.55 * drip + 0.06 * noise(u * 11);
    const dIn = 0.12 + 0.18 * Math.pow(Math.max(0, Math.sin(u * 5 + 2.0)), 3) + 0.04 * noise(u * 9);
    for (let j = 0; j <= V; j++) {
      const t = j / V;
      const v = -dOut + t * (Math.PI + dOut + dIn);
      const lip = 1 + 0.02 * Math.sin(t * Math.PI); // a slightly domed top
      torusPoint(u, v, r * lip, p);
      pos.push(p.x, p.y, p.z);
      const half = Math.PI / 2 + Math.max(dOut, dIn);
      spread.push(Math.abs(v - Math.PI / 2) / half + 0.04 * noise(u * 13 + 2));
    }
  }
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j;
      const b = (i + 1) * (V + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aSpread", new THREE.Float32BufferAttribute(spread, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function buildDrizzle() {
  const pts: THREE.Vector3[] = [];
  const N = 180;
  for (let k = 0; k < N; k++) {
    const u = (k / N) * Math.PI * 2;
    const v = Math.PI / 2 + 0.72 * Math.sin(u * 11) + 0.04 * noise(u * 17);
    pts.push(torusPoint(u, v, TUBE + 0.1)); // lies on the glaze
  }
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 900, 0.042, 8, true);
}

type Sprinkle = {
  base: THREE.Vector3;
  normal: THREE.Vector3;
  quat: THREE.Quaternion;
  delay: number;
};

function placeSprinkles(count: number): Sprinkle[] {
  const out: Sprinkle[] = [];
  const Y = new THREE.Vector3(0, 1, 0);
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < count; k++) {
    const u = rnd() * Math.PI * 2;
    const v = Math.PI / 2 + (rnd() - 0.5) * 2.1;
    const base = torusPoint(u, v, TUBE + 0.17);
    const centre = new THREE.Vector3(R * Math.cos(u), 0, R * Math.sin(u));
    const normal = base.clone().sub(centre).normalize();
    const tangent = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5)
      .cross(normal)
      .normalize();
    out.push({
      base,
      normal,
      quat: new THREE.Quaternion().setFromUnitVectors(Y, tangent),
      delay: rnd(),
    });
  }
  return out;
}

/** A tiny photo studio: dark room, one off-axis softbox, two strip lights, a warm bounce. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  const room = new THREE.Mesh(
    new THREE.BoxGeometry(60, 60, 60),
    new THREE.MeshBasicMaterial({ color: "#14070f", side: THREE.BackSide }),
  );
  studio.add(room);
  const panel = (
    w: number,
    h: number,
    pos: [number, number, number],
    power: number,
    tint = "#ffffff",
  ) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(tint).multiplyScalar(power),
        side: THREE.DoubleSide,
      }),
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    studio.add(m);
  };
  panel(22, 14, [-22, 20, 20], 5); // key softbox
  panel(2.4, 34, [30, 4, 12], 7); // strip, edge line
  panel(2.4, 30, [-28, 2, -14], 4); // second strip
  panel(30, 8, [0, -22, 0], 1.2, "#ffb3cf"); // warm pink bounce from below
  const pmrem = new THREE.PMREMGenerator(renderer);
  const tex = pmrem.fromScene(studio, 0.035).texture;
  pmrem.dispose();
  studio.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  return tex;
}

export class DonutEngine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);
  private donut = new THREE.Group();
  private parts: Record<PartId, { obj: THREE.Object3D; lift: number; order: number }>;
  private glazeMat: THREE.MeshPhysicalMaterial;
  private drizzleMat: THREE.MeshPhysicalMaterial;
  private coverUniform = { value: 0 };
  private sprinkles: Sprinkle[];
  private sprinkleMesh: THREE.InstancedMesh;
  private raf = 0;
  private last = 0;
  private time = 0;
  private running = false;
  private cur: Shot = { ...CUES[0]!.shot };
  private progress = 0;
  private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
  private holding = false;
  private cover = 0;
  private sprinkleT = 0;
  private fps: number[] = [];
  private dpr: number;
  private readonly calm: boolean;
  onFrame?: (info: FrameInfo) => void;

  constructor(
    private canvas: HTMLCanvasElement,
    opts: { reducedMotion: boolean; phone: boolean },
  ) {
    this.calm = opts.reducedMotion;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.dpr = Math.min(window.devicePixelRatio || 1, opts.phone ? 1.75 : 2);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.environment = studioEnvironment(this.renderer);

    const dough = new THREE.Mesh(
      buildDough(),
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.82,
        sheen: 0.7,
        sheenColor: new THREE.Color("#ffd7a3"),
        sheenRoughness: 0.55,
      }),
    );

    this.glazeMat = new THREE.MeshPhysicalMaterial({
      color: "#f2649e",
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      ior: 1.45,
      side: THREE.DoubleSide,
    });
    // The glaze is poured: fragments further from the top than `cover` are not drawn yet.
    this.glazeMat.onBeforeCompile = (shader) => {
      shader.uniforms.uCover = this.coverUniform;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nattribute float aSpread;\nvarying float vSpread;",
        )
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSpread = aSpread;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uCover;\nvarying float vSpread;",
        )
        .replace(
          "#include <clipping_planes_fragment>",
          "#include <clipping_planes_fragment>\nif (vSpread > uCover) discard;",
        );
    };
    const glaze = new THREE.Mesh(buildGlaze(), this.glazeMat);

    this.drizzleMat = new THREE.MeshPhysicalMaterial({
      color: "#3b1a10",
      roughness: 0.28,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
    });
    const drizzle = new THREE.Mesh(buildDrizzle(), this.drizzleMat);

    this.sprinkles = placeSprinkles(opts.phone ? 170 : 240);
    this.sprinkleMesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.065, 0.3, 4, 8),
      new THREE.MeshPhysicalMaterial({ roughness: 0.42, clearcoat: 0.5 }),
      this.sprinkles.length,
    );
    const palette = ["#ffd84a", "#ffffff", "#5ec6e8", "#7ed957", "#ff7a59", "#b07cff"].map(
      (h) => new THREE.Color(h),
    );
    this.sprinkles.forEach((_, k) => this.sprinkleMesh.setColorAt(k, palette[k % palette.length]!));

    this.parts = {
      dough: { obj: dough, lift: 0, order: 0.1 },
      glaze: { obj: glaze, lift: 2.3, order: 0.4 },
      drizzle: { obj: drizzle, lift: 4.0, order: 0.7 },
      sprinkles: { obj: this.sprinkleMesh, lift: 5.7, order: 1 },
    };
    for (const p of Object.values(this.parts)) this.donut.add(p.obj);
    this.scene.add(this.donut);
    this.layoutSprinkles();
    this.resize();
  }

  /** Builds every shader before the first frame, so the first scroll does not stutter. */
  async ready() {
    this.coverUniform.value = 1;
    this.layoutSprinkles();
    await this.renderer.compileAsync(this.scene, this.camera);
    this.coverUniform.value = this.cover * 1.08 - 0.06;
    this.layoutSprinkles();
    this.renderer.render(this.scene, this.camera);
  }

  setProgress(p: number) {
    this.progress = clamp01(p);
  }
  /** Pointer in -1..1; it turns the studio, as if walking round a lit product. */
  setPointer(x: number, y: number) {
    this.pointer.x = x;
    this.pointer.y = y;
  }
  setHolding(h: boolean) {
    this.holding = h;
  }
  setGlaze(color: string, drizzle: string) {
    this.glazeMat.color.set(color);
    this.drizzleMat.color.set(drizzle);
  }
  /** Shows the finished donut at once (reduced motion, or once poured). */
  finish() {
    this.cover = 1;
    this.sprinkleT = 1;
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      this.tick(Math.min(0.05, (now - this.last) / 1000), now);
      this.last = now;
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  dispose() {
    this.stop();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        (o.material as THREE.Material).dispose();
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }

  private layoutSprinkles() {
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3(1, 1, 1);
    const zero = new THREE.Vector3(0, 0, 0);
    this.sprinkles.forEach((sp, k) => {
      // Each sprinkle falls in its turn and lands on the glaze.
      const t = ease((this.sprinkleT - sp.delay * 0.6) / 0.4);
      p.copy(sp.base).addScaledVector(sp.normal, (1 - t) * 3.5);
      p.y += (1 - t) * 4;
      m.compose(p, sp.quat, t > 0 ? s : zero);
      this.sprinkleMesh.setMatrixAt(k, m);
    });
    this.sprinkleMesh.instanceMatrix.needsUpdate = true;
  }

  private tick(dt: number, now: number) {
    const { shot, timeScale } = shotAt(this.progress);
    // One clock for everything that moves; the close-up slows it right down.
    this.time += dt * (this.calm ? 0 : timeScale);

    // Pour: holding pours; scrolling on finishes it so the story never waits.
    const want = this.holding || this.progress > 0.12 ? 1 : this.cover;
    if (this.cover < want) this.cover = Math.min(want, this.cover + dt * (this.calm ? 10 : 0.55));
    if (this.cover > 0.9 && this.sprinkleT < 1) {
      this.sprinkleT = Math.min(1, this.sprinkleT + dt * (this.calm ? 10 : 0.7));
      this.layoutSprinkles();
    }
    // Mapped so 0 hides every fragment (the drip noise dips a little below 0) and 1 shows all.
    this.coverUniform.value = this.cover * 1.08 - 0.06;
    // The chocolate goes on once the glaze is down.
    this.parts.drizzle.obj.visible = this.cover > 0.97;

    // Ease toward the cue, every frame.
    const k = this.calm ? 1 : 1 - Math.exp(-dt * 4);
    for (const key of Object.keys(shot) as (keyof Shot)[])
      this.cur[key] += (shot[key] - this.cur[key]) * k;
    this.pointer.sx += (this.pointer.x - this.pointer.sx) * (1 - Math.exp(-dt * 3));
    this.pointer.sy += (this.pointer.y - this.pointer.sy) * (1 - Math.exp(-dt * 3));

    // Explode: top parts leave first and come back last.
    const e = this.cur.explode;
    for (const p of Object.values(this.parts)) {
      const delay = (1 - p.order) * 0.42;
      p.obj.position.y = p.lift * ease((e - delay) / 0.58);
    }

    this.donut.rotation.y = this.time * 0.25;
    this.donut.rotation.x = -this.pointer.sy * 0.12;
    this.donut.rotation.z = this.pointer.sx * 0.08;
    this.scene.environmentRotation.set(this.pointer.sy * 0.45, -this.pointer.sx * 0.8, 0);

    // Frame by size: "fit N cm on screen", so the same cue works on a phone and a monitor.
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const fitV = this.cur.frame / 2 / Math.tan(vfov / 2);
    const fitH = fitV / Math.min(1, this.camera.aspect);
    const dist = Math.max(fitV, fitH);
    const el = THREE.MathUtils.degToRad(this.cur.elev);
    const az = THREE.MathUtils.degToRad(this.cur.az);
    const target = new THREE.Vector3(0, this.cur.lookY, 0);
    this.camera.position.set(
      target.x + dist * Math.cos(el) * Math.sin(az),
      target.y + dist * Math.sin(el),
      target.z + dist * Math.cos(el) * Math.cos(az),
    );
    this.camera.lookAt(target);
    // Side placement only where there is room beside the text.
    this.camera.filmOffset = this.camera.aspect > 1.1 ? this.cur.offsetX * 35 : 0;
    this.camera.updateProjectionMatrix();

    this.renderer.render(this.scene, this.camera);
    this.adapt(dt, now);

    if (this.onFrame) {
      const w = this.canvas.clientWidth;
      const h = this.canvas.clientHeight;
      const v = new THREE.Vector3();
      const anchors = (Object.keys(this.parts) as PartId[]).map((id) => {
        const part = this.parts[id];
        // The outer edge of each layer, on the side facing the camera's right.
        v.set(R + TUBE + 0.2, part.obj.position.y + (id === "dough" ? 0 : 0.9), 0);
        v.applyEuler(new THREE.Euler(0, az + Math.PI / 2, 0));
        v.project(this.camera);
        return { id, x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h, visible: v.z < 1 };
      });
      this.onFrame({ cover: this.cover, sprinkles: this.sprinkleT, anchors, explode: e });
    }
  }

  // Adaptive quality: if frames drop under 40 fps, step the resolution down.
  private adapt(dt: number, now: number) {
    this.fps.push(1 / Math.max(dt, 1e-3));
    if (this.fps.length < 60) return;
    const avg = this.fps.reduce((a, b) => a + b, 0) / this.fps.length;
    this.fps = [];
    if (avg < 40 && this.dpr > 1) {
      this.dpr = Math.max(1, this.dpr - 0.25);
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    }
    void now;
  }
}
