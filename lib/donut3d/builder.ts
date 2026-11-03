/*
 * "Build your donut": a YUM-YUM donut drawn live with three.js after the
 * live-3D guide. Every part is built from code (no model files) in real
 * centimetres, lit by a small studio baked into the environment, and the
 * camera eases to a shot for each step. The visitor picks the glaze, the
 * toppings and the packaging; the engine animates each change.
 */
import * as THREE from "three";
import type { Quality } from "./quality";

export type Topping = "sprinkles" | "chocolate" | "white" | "nuts";
export type Packaging = "paper" | "box" | "gift";
export type Step = 0 | 1 | 2;

const R = 3.0; // ring radius, cm (the donut is about 9 cm across)
const TUBE = 1.45;
const SQUASH = 0.74;
const REST_Y = TUBE * SQUASH; // donut resting on y = 0

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const ease = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
const noise = (x: number) =>
  Math.sin(x * 1.7 + 1.3) * 0.5 + Math.sin(x * 3.1 + 0.4) * 0.3 + Math.sin(x * 7.3 + 2.1) * 0.2;

function torusPoint(u: number, v: number, r: number, out = new THREE.Vector3()) {
  const ring = R + r * Math.cos(v);
  return out.set(ring * Math.cos(u), r * Math.sin(v) * SQUASH, ring * Math.sin(u));
}

function grid(U: number, V: number, at: (i: number, j: number) => void) {
  const idx: number[] = [];
  for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) at(i, j);
  for (let i = 0; i < U; i++)
    for (let j = 0; j < V; j++) {
      const a = i * (V + 1) + j;
      const b = (i + 1) * (V + 1) + j;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  return idx;
}

function buildDough() {
  const pos: number[] = [];
  const col: number[] = [];
  const uv: number[] = [];
  const golden = new THREE.Color("#d99a52");
  const band = new THREE.Color("#f6dcae"); // the pale ring where a fried donut floats
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  const idx = grid(160, 64, (i, j) => {
    const u = (i / 160) * Math.PI * 2;
    const v = (j / 64) * Math.PI * 2;
    torusPoint(u, v, TUBE * (1 + 0.012 * noise(u * 3 + v * 2) + 0.006 * noise(u * 7 - v * 5)), p);
    pos.push(p.x, p.y, p.z);
    const b = Math.exp(-Math.pow(Math.sin(v) / 0.16, 2)) * (0.75 + 0.25 * noise(u * 9));
    c.copy(golden).lerp(band, clamp01(b));
    col.push(c.r, c.g, c.b);
    // About 19 cm around the ring and 9 cm around the tube: the pore texture
    // repeats so that its specks stay the same size in both directions.
    uv.push((i / 160) * 8, (j / 64) * 4);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** The glaze: the top of the torus, a little thicker, with drips over both edges. */
function buildGlaze(lite: boolean) {
  const pos: number[] = [];
  const spread: number[] = [];
  const p = new THREE.Vector3();
  const U = lite ? 160 : 240;
  const V = lite ? 40 : 56;
  const idx = grid(U, V, (i, j) => {
    const u = (i / U) * Math.PI * 2;
    const drip = Math.pow(Math.max(0, Math.sin(u * 3 + 1.1) * Math.sin(u * 7 + 0.3)), 2);
    const dOut = 0.22 + 0.55 * drip + 0.06 * noise(u * 11);
    const dIn = 0.12 + 0.18 * Math.pow(Math.max(0, Math.sin(u * 5 + 2.0)), 3) + 0.04 * noise(u * 9);
    const t = j / V;
    const v = -dOut + t * (Math.PI + dOut + dIn);
    torusPoint(u, v, (TUBE + 0.07) * (1 + 0.02 * Math.sin(t * Math.PI)), p);
    pos.push(p.x, p.y, p.z);
    spread.push(
      Math.abs(v - Math.PI / 2) / (Math.PI / 2 + Math.max(dOut, dIn)) + 0.04 * noise(u * 13 + 2),
    );
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("aSpread", new THREE.Float32BufferAttribute(spread, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A zigzag of chocolate lying on the glaze; `phase` sets it apart from the second one. */
function buildDrizzle(phase: number, turns: number, lite: boolean) {
  const pts: THREE.Vector3[] = [];
  for (let k = 0; k < 200; k++) {
    const u = (k / 200) * Math.PI * 2;
    const v = Math.PI / 2 + 0.72 * Math.sin(u * turns + phase) + 0.04 * noise(u * 17 + phase);
    pts.push(torusPoint(u, v, TUBE + 0.1));
  }
  return new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts, true),
    lite ? 600 : 1000,
    0.042,
    lite ? 6 : 8,
    true,
  );
}

type Bit = {
  base: THREE.Vector3;
  normal: THREE.Vector3;
  quat: THREE.Quaternion;
  delay: number;
  scale: number;
};

function scatter(count: number, seed0: number, spreadV: number): Bit[] {
  const out: Bit[] = [];
  const Y = new THREE.Vector3(0, 1, 0);
  let seed = seed0;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < count; k++) {
    const u = rnd() * Math.PI * 2;
    const v = Math.PI / 2 + (rnd() - 0.5) * spreadV;
    const base = torusPoint(u, v, TUBE + 0.15);
    const normal = base
      .clone()
      .sub(new THREE.Vector3(R * Math.cos(u), 0, R * Math.sin(u)))
      .normalize();
    const dir = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).cross(normal).normalize();
    out.push({
      base,
      normal,
      quat: new THREE.Quaternion().setFromUnitVectors(Y, dir),
      delay: rnd(),
      scale: 0.7 + rnd() * 0.6,
    });
  }
  return out;
}

/** A tiny photo studio: dark room, an off-axis softbox, two strip lights, a warm bounce. */
function studioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.add(
    new THREE.Mesh(
      new THREE.BoxGeometry(60, 60, 60),
      new THREE.MeshBasicMaterial({ color: "#1c0a16", side: THREE.BackSide }),
    ),
  );
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
  panel(22, 14, [-22, 22, 20], 5);
  panel(2.4, 34, [30, 6, 12], 7);
  panel(2.4, 30, [-28, 4, -14], 4);
  panel(30, 8, [0, -22, 0], 1.2, "#ffb3cf");
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

/** YUM-YUM paper: off-white with a light print of the logo. */
function paperTexture(logo: HTMLImageElement | null) {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d")!;
  g.fillStyle = "#fbf6ef";
  g.fillRect(0, 0, 512, 512);
  if (logo) {
    g.globalAlpha = 0.1;
    for (let y = 0; y < 4; y++)
      for (let x = 0; x < 4; x++)
        g.drawImage(logo, x * 128 + (y % 2) * 64 + 24, y * 128 + 24, 80, 80);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement | null>((res) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => res(null);
    img.src = src;
  });

type Shot = { frame: number; elev: number; lookY: number };

/** Fine pores of fried dough, as a tiling bump map. */
function poreTexture() {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, N, N);
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 1400; k++) {
    const x = rnd() * N;
    const y = rnd() * N;
    const r = 0.6 + rnd() * 1.6;
    g.fillStyle = `rgba(0,0,0,${0.25 + rnd() * 0.35})`;
    // Draw across the edges too, so the tile repeats without a seam.
    for (const dx of [-N, 0, N])
      for (const dy of [-N, 0, N]) {
        g.beginPath();
        g.arc(x + dx, y + dy, r, 0, Math.PI * 2);
        g.fill();
      }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/**
 * A soft shadow drawn into a texture: a ring for the donut (darker under the
 * dough, lighter in the hole) or a rounded square for the box.
 */
function shadowTexture(kind: "ring" | "square") {
  const N = 256;
  const c = document.createElement("canvas");
  c.width = c.height = N;
  const g = c.getContext("2d")!;
  if (kind === "ring") {
    const grad = g.createRadialGradient(N / 2, N / 2, 0, N / 2, N / 2, N / 2);
    grad.addColorStop(0, "rgba(0,0,0,0.12)");
    grad.addColorStop(0.27, "rgba(0,0,0,0.3)");
    grad.addColorStop(0.52, "rgba(0,0,0,0.62)");
    grad.addColorStop(0.74, "rgba(0,0,0,0.3)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, N, N);
  } else {
    // Blur through shadowBlur, which every browser supports on a canvas.
    g.shadowColor = "rgba(0,0,0,0.75)";
    g.shadowBlur = 26;
    g.shadowOffsetX = N * 2;
    g.fillRect(-N * 2 + N * 0.16, N * 0.16, N * 0.68, N * 0.68);
  }
  return new THREE.CanvasTexture(c);
}

function shadowPlane(kind: "ring" | "square", size: number) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(size, size),
    new THREE.MeshBasicMaterial({
      map: shadowTexture(kind),
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.renderOrder = 1;
  return m;
}

type Tune = {
  maxDpr: number;
  antialias: boolean;
  lite: boolean;
  sprinkles: number;
  nuts: number;
};

function tune(quality: Quality, phone: boolean, deviceDpr: number): Tune {
  // Never above the screen itself; a phone at 2x looks as sharp as at 3x here.
  const cap = (n: number) => Math.min(deviceDpr, n);
  if (quality === "high")
    return { maxDpr: cap(2), antialias: true, lite: false, sprinkles: 230, nuts: 130 };
  if (quality === "medium")
    return {
      maxDpr: cap(phone ? 1.6 : 1.75),
      antialias: true,
      lite: false,
      sprinkles: phone ? 170 : 200,
      nuts: phone ? 90 : 110,
    };
  return { maxDpr: cap(1.25), antialias: false, lite: true, sprinkles: 130, nuts: 70 };
}

export type EngineStats = {
  fps: number;
  frameMs: number;
  dpr: number;
  quality: Quality;
  calls: number;
  triangles: number;
};

export class DonutBuilder {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(32, 1, 0.1, 300);
  private donut = new THREE.Group();
  private glazeMat: THREE.MeshPhysicalMaterial;
  private coverUniform = { value: 1 };
  private drizzles: Record<"chocolate" | "white", THREE.Mesh>;
  private bits: Record<"sprinkles" | "nuts", { mesh: THREE.InstancedMesh; list: Bit[] }>;
  private paper: THREE.Mesh;
  private box = new THREE.Group();
  private tray: THREE.Mesh[] = [];
  private lid = new THREE.Group();
  private lidTop!: THREE.Mesh;
  private lidFace!: THREE.Material;
  private ribbon = new THREE.Group();
  private cardMat: THREE.MeshPhysicalMaterial;
  private giftMat: THREE.MeshPhysicalMaterial;
  private raf = 0;
  private last = 0;
  private running = false;
  private looping = false;
  private readonly calm: boolean;
  private readonly quality: Quality;
  private dpr: number;
  private readonly minDpr: number;
  private readonly maxDpr: number;
  private frameTimes: number[] = [];
  private workTimes: number[] = [];
  private stepsDown = 0;
  private goodWindows = 0;
  private lastStats = { fps: 0, frameMs: 0 };
  private donutShadow: THREE.Mesh;
  private boxShadow: THREE.Mesh;
  private listeners = new AbortController();
  private envOverride: string | null = null;
  private spin = 0;
  private lastTouch = 0;
  private idleOnly = false;
  private readonly idleFrameMs: number;

  // Targets set by the UI, and the eased values the frame actually draws.
  private step: Step = 0;
  private packaging: Packaging = "paper";
  private toppings = new Set<Topping>();
  private cover = 1;
  private topT: Record<Topping, number> = { sprinkles: 0, chocolate: 0, white: 0, nuts: 0 };
  private pack = { paper: 1, box: 0, lid: 0, gift: 0 };
  private cur: Shot = { frame: 11, elev: 32, lookY: REST_Y };
  private yaw = 0.4;
  private yawVel = 0;
  private dragging = false;
  onDrop?: () => void;
  /** The browser took the GPU away (memory pressure, long time in the background). */
  onContextLost?: () => void;

  constructor(
    private canvas: HTMLCanvasElement,
    opts: { reducedMotion: boolean; phone: boolean; quality: Quality },
  ) {
    this.calm = opts.reducedMotion;
    this.quality = opts.quality;
    const deviceDpr = window.devicePixelRatio || 1;
    const q = tune(opts.quality, opts.phone, deviceDpr);
    const lite = q.lite;
    this.maxDpr = q.maxDpr;
    this.dpr = q.maxDpr;
    this.minDpr = Math.min(deviceDpr, 1);
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: q.antialias,
      alpha: true,
      powerPreference: lite ? "default" : "high-performance",
    });
    this.renderer.setPixelRatio(this.dpr);
    this.idleFrameMs = lite ? 45 : 31;
    this.renderer.setClearColor(0x000000, 0);
    // ?debug=1 also lets the look be compared on a device:
    // &tm=neutral|aces|agx, &env=studio|baked, &envi=0.5 (studio strength), &exp=1.
    const dbg = new URLSearchParams(window.location.search);
    const debugOn = dbg.get("debug") === "1";
    this.envOverride = debugOn ? dbg.get("env") : null;
    const tm = debugOn ? dbg.get("tm") : null;
    // Khronos PBR Neutral keeps the glaze colours true, as product photos should be.
    this.renderer.toneMapping =
      tm === "aces"
        ? THREE.ACESFilmicToneMapping
        : tm === "agx"
          ? THREE.AgXToneMapping
          : THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = Number(dbg.get("exp")) || 1;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.environment = studioEnvironment(this.renderer);

    const signal = this.listeners.signal;
    window.addEventListener("scroll", this.onScroll, { passive: true, signal });
    canvas.addEventListener(
      "webglcontextlost",
      (e) => {
        e.preventDefault(); // ask the browser to give the context back
        this.stop();
        this.onContextLost?.();
      },
      { signal },
    );

    const dough = new THREE.Mesh(
      buildDough(),
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.82,
        bumpMap: lite ? null : poreTexture(),
        bumpScale: 0.6,
        sheen: lite ? 0 : 0.7,
        sheenColor: new THREE.Color("#ffd7a3"),
        sheenRoughness: 0.55,
      }),
    );
    this.glazeMat = new THREE.MeshPhysicalMaterial({
      color: "#4a2414",
      roughness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      side: THREE.DoubleSide,
    });
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
    const glaze = new THREE.Mesh(buildGlaze(lite), this.glazeMat);
    const drizzleMat = (color: string) =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness: 0.28,
        clearcoat: 0.8,
        clearcoatRoughness: 0.15,
      });
    this.drizzles = {
      chocolate: new THREE.Mesh(buildDrizzle(0, 11, lite), drizzleMat("#3b1a10")),
      white: new THREE.Mesh(buildDrizzle(Math.PI / 2, 9, lite), drizzleMat("#f6efe4")),
    };

    const sprinkles = scatter(q.sprinkles, 7, 2.1);
    const sprinkleMesh = new THREE.InstancedMesh(
      new THREE.CapsuleGeometry(0.065, 0.3, lite ? 2 : 4, lite ? 6 : 8),
      new THREE.MeshPhysicalMaterial({ roughness: 0.42, clearcoat: 0.5 }),
      sprinkles.length,
    );
    const palette = ["#ffd84a", "#ffffff", "#5ec6e8", "#7ed957", "#ff7a59", "#b07cff"].map(
      (h) => new THREE.Color(h),
    );
    sprinkles.forEach((_, k) => sprinkleMesh.setColorAt(k, palette[k % palette.length]!));
    const nuts = scatter(q.nuts, 31, 1.6);
    const nutMesh = new THREE.InstancedMesh(
      new THREE.IcosahedronGeometry(0.13, 0),
      new THREE.MeshPhysicalMaterial({ color: "#c79a5e", roughness: 0.7 }),
      nuts.length,
    );
    nuts.forEach((_, k) => nutMesh.setColorAt(k, new THREE.Color(k % 3 ? "#c79a5e" : "#9db25a")));
    this.bits = {
      sprinkles: { mesh: sprinkleMesh, list: sprinkles },
      nuts: { mesh: nutMesh, list: nuts },
    };

    this.donut.add(
      dough,
      glaze,
      this.drizzles.chocolate,
      this.drizzles.white,
      sprinkleMesh,
      nutMesh,
    );
    this.donut.position.y = REST_Y;
    this.scene.add(this.donut);

    // Paper under the donut.
    this.paper = new THREE.Mesh(
      new THREE.PlaneGeometry(13, 13, 1, 1),
      new THREE.MeshPhysicalMaterial({ color: "#ffffff", roughness: 0.9 }),
    );
    this.paper.rotation.x = -Math.PI / 2;
    this.paper.rotation.z = 0.35;
    this.scene.add(this.paper);

    // Soft contact shadows: without them the donut and the box float.
    this.donutShadow = shadowPlane("ring", (R + TUBE) * 2 * 1.3);
    this.boxShadow = shadowPlane("square", 11.5 * 1.5);
    this.scene.add(this.donutShadow, this.boxShadow);

    // The YUM-YUM box: an open tray and a lid hinged at the back.
    this.cardMat = new THREE.MeshPhysicalMaterial({ color: "#fbf8f4", roughness: 0.75 });
    this.giftMat = new THREE.MeshPhysicalMaterial({
      color: "#ff9fc8",
      emissive: new THREE.Color("#8a2350"),
      emissiveIntensity: 0.6,
      roughness: 0.45,
      sheen: lite ? 0 : 0.5,
      sheenColor: new THREE.Color("#ffd3e4"),
    });
    const W = 11.5;
    const H = 4.2;
    const T = 0.18;
    const wall = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), this.cardMat);
      m.position.set(x, y, z);
      this.tray.push(m);
      this.box.add(m);
    };
    wall(W, T, W, 0, T / 2, 0);
    wall(W, H, T, 0, H / 2, W / 2);
    wall(W, H, T, 0, H / 2, -W / 2);
    wall(T, H, W, W / 2, H / 2, 0);
    wall(T, H, W, -W / 2, H / 2, 0);
    const lidTex = new THREE.TextureLoader().load("/images/3d/box-lid.jpg");
    lidTex.colorSpace = THREE.SRGBColorSpace;
    lidTex.anisotropy = lite ? 1 : 4;
    const lidFace = new THREE.MeshPhysicalMaterial({ map: lidTex, roughness: 0.6 });
    this.lidFace = lidFace;
    this.lidTop = new THREE.Mesh(new THREE.BoxGeometry(W + 0.3, T, W + 0.3), [
      this.cardMat,
      this.cardMat,
      lidFace,
      this.cardMat,
      this.cardMat,
      this.cardMat,
    ]);
    this.lidTop.position.set(0, 0, (W + 0.3) / 2); // hinge at the lid's back edge
    this.lid.add(this.lidTop);
    this.lid.position.set(0, H + T / 2, -(W + 0.3) / 2);
    this.box.add(this.lid);

    // Gift: a yellow ribbon across the closed box, and a bow.
    const satin = new THREE.MeshPhysicalMaterial({
      color: "#ffd83a",
      emissive: new THREE.Color("#a87a00"),
      emissiveIntensity: 0.55,
      roughness: 0.4,
      sheen: lite ? 0 : 0.6,
      clearcoat: 0.4,
    });
    const band = (w: number, d: number) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, H + T * 2 + 0.06, d), satin);
      m.position.y = (H + T * 2) / 2;
      this.ribbon.add(m);
    };
    band(1.1, W + 0.42);
    band(W + 0.42, 1.1);
    for (const side of [-1, 1]) {
      const loop = new THREE.Mesh(
        new THREE.TorusGeometry(1.1, 0.3, lite ? 8 : 10, lite ? 24 : 32),
        satin,
      );
      loop.scale.set(1, 0.55, 1);
      loop.position.set(side * 1.05, H + T * 2 + 0.55, 0);
      loop.rotation.set(Math.PI / 2.4, 0, side * 0.5);
      this.ribbon.add(loop);
    }
    this.box.add(this.ribbon);
    this.scene.add(this.box);

    lidTex.onUpdate = () => this.wake();
    void loadImage("/images/brand/logo-240.png").then((img) => {
      (this.paper.material as THREE.MeshPhysicalMaterial).map = paperTexture(img);
      (this.paper.material as THREE.MeshPhysicalMaterial).needsUpdate = true;
      this.wake();
    });

    this.apply(0);
    this.resize();
    const useStudio =
      this.envOverride === "studio" || (opts.quality === "high" && this.envOverride !== "baked");
    if (useStudio) void this.loadStudioHdr();
  }

  /** A real photo studio (Poly Haven, CC0) for crisper, natural highlights; high tier only. */
  private async loadStudioHdr() {
    try {
      const { RGBELoader } = await import("three/examples/jsm/loaders/RGBELoader.js");
      const hdr = await new RGBELoader().loadAsync("/3d/studio.hdr");
      hdr.mapping = THREE.EquirectangularReflectionMapping;
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      const env = pmrem.fromEquirectangular(hdr).texture;
      pmrem.dispose();
      hdr.dispose();
      if (!this.listeners.signal.aborted) {
        this.scene.environment?.dispose();
        this.scene.environment = env;
        this.scene.environmentIntensity = Number(
          new URLSearchParams(window.location.search).get("envi") || 0.5,
        );
        this.wake();
      } else env.dispose();
    } catch {
      // The baked studio stays.
    }
  }

  /** Builds every shader before the first frame, so the first change does not stutter. */
  async ready() {
    const keep = { ...this.topT };
    this.topT = { sprinkles: 1, chocolate: 1, white: 1, nuts: 1 };
    this.pack = { paper: 1, box: 1, lid: 0.5, gift: 1 };
    this.apply(0);
    await this.renderer.compileAsync(this.scene, this.camera);
    this.topT = keep;
    this.pack = { paper: 1, box: 0, lid: 0, gift: 0 };
    this.apply(0);
    this.renderer.render(this.scene, this.camera);
  }

  setStep(step: Step) {
    this.step = step;
    this.touch();
  }
  /** A new glaze is poured again from the top. */
  setGlaze(color: string, roughness = 0.2) {
    this.glazeMat.color.set(color);
    this.glazeMat.roughness = roughness;
    this.cover = this.calm ? 1 : 0;
    this.touch();
  }
  setToppings(list: Topping[]) {
    this.toppings = new Set(list);
    this.touch();
  }
  setPackaging(p: Packaging) {
    this.packaging = p;
    this.touch();
  }
  dragStart() {
    this.dragging = true;
    this.yawVel = 0;
    this.touch();
  }
  dragBy(dxPixels: number) {
    const d = dxPixels * 0.01;
    this.yaw += d;
    this.yawVel = d * 60;
    this.touch();
  }
  dragEnd() {
    this.dragging = false;
    this.touch();
  }

  /** Allowed to draw (on screen, tab visible). Frames are only drawn while something moves. */
  start() {
    if (this.running) return;
    this.running = true;
    this.touch();
  }
  stop() {
    this.running = false;
    this.looping = false;
    cancelAnimationFrame(this.raf);
  }
  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.wake();
  }

  private touch() {
    this.lastTouch = performance.now();
    this.wake();
  }
  private wake() {
    if (!this.running || this.looping) return;
    this.looping = true;
    this.last = performance.now();
    this.frameTimes = [];
    const loop = (now: number) => {
      if (!this.looping) return;
      // Only the slow idle turn left: about 30 frames a second is plenty.
      if (this.idleOnly && now - this.last < this.idleFrameMs) {
        this.raf = requestAnimationFrame(loop);
        return;
      }
      const moving = this.frame(now);
      if (moving) this.raf = requestAnimationFrame(loop);
      else this.looping = false;
    };
    this.raf = requestAnimationFrame(loop);
  }
  /** Draws one frame at time `now`; returns whether anything is still moving. */
  private frame(now: number) {
    const ms = now - this.last;
    this.last = now;
    const t0 = performance.now();
    const moving = this.apply(Math.min(0.05, Math.max(0, ms) / 1000));
    this.adapt(ms, performance.now() - t0);
    return moving;
  }
  /**
   * Some phone browsers (in-app ones especially) stop animation frames while
   * the page scrolls. Scroll events still arrive, so they draw the frame.
   */
  private onScroll = () => {
    if (!this.running || !this.looping) return;
    const now = performance.now();
    if (now - this.last > 90) this.frame(now);
  };
  /**
   * Resolution follows the frame rate both ways. A steady ~30 fps is a cap
   * the phone sets itself (iPhone Low Power Mode), not a struggle, and it
   * is left alone. After three steps down it stops trying to climb back.
   */
  private adapt(ms: number, workMs: number) {
    if (ms <= 0 || ms > 200) return; // first frame, or the tab was away
    this.frameTimes.push(ms);
    this.workTimes.push(workMs);
    if (this.frameTimes.length < 30) return;
    const sorted = [...this.frameTimes].sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1]!;
    const p90 = sorted[Math.floor(sorted.length * 0.9)]!;
    this.lastStats = {
      fps: Math.round(1000 / median),
      frameMs: +(this.workTimes.reduce((a, b) => a + b, 0) / this.workTimes.length).toFixed(1),
    };
    this.frameTimes = [];
    this.workTimes = [];
    const cappedAt30 = median > 31 && median < 36 && p90 < 40;
    let next = this.dpr;
    if (median > 25 && !cappedAt30 && this.dpr > this.minDpr) {
      next = Math.max(this.minDpr, this.dpr - 0.25);
      this.stepsDown++;
      this.goodWindows = 0;
    } else if (median < 19 && this.dpr < this.maxDpr && this.stepsDown < 3) {
      // Two good windows in a row before going up, so it does not flicker.
      if (++this.goodWindows >= 2) {
        next = Math.min(this.maxDpr, this.dpr + 0.25);
        this.goodWindows = 0;
      }
    } else this.goodWindows = 0;
    if (next !== this.dpr) {
      this.dpr = next;
      this.renderer.setPixelRatio(this.dpr);
      this.resize();
    }
  }

  /** For the ?debug=1 overlay. */
  stats(): EngineStats {
    const info = this.renderer.info.render;
    return {
      ...this.lastStats,
      dpr: this.dpr,
      quality: this.quality,
      calls: info.calls,
      triangles: info.triangles,
    };
  }

  dispose() {
    this.stop();
    this.listeners.abort();
    this.scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.geometry.dispose();
        const m = o.material as THREE.Material | THREE.Material[];
        (Array.isArray(m) ? m : [m]).forEach((x) => {
          for (const v of Object.values(x)) if (v instanceof THREE.Texture) v.dispose();
          x.dispose();
        });
      }
    });
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }

  private layoutBits(key: "sprinkles" | "nuts", t: number) {
    const { mesh, list } = this.bits[key];
    const m = new THREE.Matrix4();
    const p = new THREE.Vector3();
    const s = new THREE.Vector3();
    list.forEach((b, k) => {
      // Each piece falls in its turn and lands on the glaze.
      const f = ease((t - b.delay * 0.55) / 0.45);
      p.copy(b.base).addScaledVector(b.normal, (1 - f) * 2.5);
      p.y += (1 - f) * 3.5;
      s.setScalar(f > 0 ? b.scale : 0);
      m.compose(p, b.quat, s);
      mesh.setMatrixAt(k, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.visible = t > 0;
  }

  /** Draws one frame; returns whether anything is still on its way. */
  private apply(dt: number): boolean {
    const step = (cur: number, want: number, rate: number) =>
      this.calm ? want : cur + Math.sign(want - cur) * Math.min(Math.abs(want - cur), dt * rate);

    // Glaze pour.
    this.cover = step(this.cover, 1, 1.5);
    this.coverUniform.value = this.cover * 1.08 - 0.06;

    // Toppings: sprinkles and nuts fall on; drizzles are drawn along their line.
    for (const key of Object.keys(this.topT) as Topping[]) {
      const want = this.toppings.has(key) ? 1 : 0;
      const before = this.topT[key];
      this.topT[key] = step(before, want, want ? 0.9 : 3);
      if (before === this.topT[key] && dt) continue;
      if (key === "sprinkles" || key === "nuts") {
        this.layoutBits(key, this.topT[key]);
        if (want && Math.floor(before * 8) !== Math.floor(this.topT[key] * 8)) this.onDrop?.();
      } else {
        const mesh = this.drizzles[key];
        const total = mesh.geometry.index!.count;
        mesh.geometry.setDrawRange(0, Math.floor((total * ease(this.topT[key])) / 3) * 3);
        mesh.visible = this.topT[key] > 0;
      }
    }

    // Packaging only shows on its own step; before that the donut sits on paper.
    const pk = this.step === 2 ? this.packaging : "paper";
    this.pack.paper = step(this.pack.paper, pk === "paper" ? 1 : 0, 3);
    this.pack.box = step(this.pack.box, pk === "paper" ? 0 : 1, 2.2);
    const lidWant = pk === "paper" ? 0 : this.pack.box > 0.95 ? 1 : 0;
    this.pack.lid = step(this.pack.lid, lidWant, 1.4);
    this.pack.gift = step(this.pack.gift, pk === "gift" && this.pack.lid > 0.98 ? 1 : 0, 2.5);

    this.paper.visible = this.pack.paper > 0.01;
    this.paper.scale.setScalar(0.9 + 0.1 * ease(this.pack.paper));
    (this.paper.material as THREE.MeshPhysicalMaterial).opacity = this.pack.paper;
    (this.paper.material as THREE.MeshPhysicalMaterial).transparent = this.pack.paper < 1;

    // The box rises into place under the donut, the donut settles in, the lid closes.
    this.box.visible = this.pack.box > 0.01;
    this.box.position.y = -6 * (1 - ease(this.pack.box));
    this.donut.position.y = REST_Y + 0.18 * ease(this.pack.box);
    this.donutShadow.position.y = this.donut.position.y - REST_Y + 0.02;
    (this.donutShadow.material as THREE.MeshBasicMaterial).opacity = 0.75;
    const boxShade = this.boxShadow.material as THREE.MeshBasicMaterial;
    boxShade.opacity = 0.7 * ease(this.pack.box);
    this.boxShadow.visible = boxShade.opacity > 0.01;
    this.boxShadow.position.y = 0.01;
    this.lid.rotation.x = -(Math.PI * 0.62) * (1 - ease(this.pack.lid));
    const gift = ease(this.pack.gift);
    this.ribbon.visible = gift > 0.01;
    this.ribbon.scale.set(1, gift, 1);
    const mat = gift > 0.5 ? this.giftMat : this.cardMat;
    for (const m of this.tray) m.material = mat;
    // The printed lid is the real YUM-YUM box; gift wrap covers it in pink paper.
    const faces = this.lidTop.material as THREE.Material[];
    for (const i of [0, 1, 3, 4, 5]) faces[i] = mat;
    faces[2] = gift > 0.5 ? this.giftMat : this.lidFace;

    // Turn: drag with a little momentum, otherwise a slow turn of its own for a
    // while after the last touch; then it eases to a rest and frames stop.
    // A slow turn of its own whenever it is on screen (the loop stops off screen).
    const spinWant = this.calm ? 0 : 0.18;
    this.spin += (spinWant - this.spin) * (1 - Math.exp(-dt * 1.2));
    if (spinWant === 0 && this.spin < 0.002) this.spin = 0;
    if (!this.dragging) {
      this.yawVel *= Math.exp(-dt * 2.5);
      if (Math.abs(this.yawVel) < 0.001) this.yawVel = 0;
      this.yaw += this.yawVel * dt + this.spin * dt;
    }
    this.donut.rotation.y = this.yaw;
    this.box.rotation.y = this.yaw * 0.25;
    this.boxShadow.rotation.z = this.yaw * 0.25;
    this.paper.rotation.z = 0.35 + this.yaw * 0.25;

    // Camera shot for the step, eased every frame; framed by size so it fits any screen.
    const closed = this.pack.lid > 0.5;
    const shot: Shot =
      this.step === 0
        ? { frame: 11.5, elev: 30, lookY: REST_Y }
        : this.step === 1
          ? { frame: 9, elev: 56, lookY: REST_Y }
          : pk === "paper"
            ? { frame: 14, elev: 42, lookY: REST_Y * 0.6 }
            : { frame: 21, elev: closed ? 60 : 46, lookY: 2.2 };
    const k = this.calm ? 1 : 1 - Math.exp(-dt * 3.5);
    for (const key of Object.keys(shot) as (keyof Shot)[])
      this.cur[key] += (shot[key] - this.cur[key]) * k;
    const vfov = THREE.MathUtils.degToRad(this.camera.fov);
    const fitV = this.cur.frame / 2 / Math.tan(vfov / 2);
    const dist = Math.max(fitV, fitV / Math.min(1, this.camera.aspect));
    const el = THREE.MathUtils.degToRad(this.cur.elev);
    this.camera.position.set(0, this.cur.lookY + dist * Math.sin(el), dist * Math.cos(el));
    this.camera.lookAt(0, this.cur.lookY, 0);

    this.renderer.render(this.scene, this.camera);

    const camSettled = (Object.keys(shot) as (keyof Shot)[]).every(
      (key) => Math.abs(shot[key] - this.cur[key]) < 0.01,
    );
    const toppingsSettled = (Object.keys(this.topT) as Topping[]).every(
      (key) => this.topT[key] === (this.toppings.has(key) ? 1 : 0),
    );
    const packSettled =
      this.pack.paper === (pk === "paper" ? 1 : 0) &&
      this.pack.box === (pk === "paper" ? 0 : 1) &&
      this.pack.lid === lidWant &&
      this.pack.gift === (pk === "gift" && this.pack.lid > 0.98 ? 1 : 0);
    const busy =
      this.dragging ||
      this.yawVel !== 0 ||
      this.cover < 1 ||
      !camSettled ||
      !toppingsSettled ||
      !packSettled;
    this.idleOnly = !busy && Math.abs(this.spin - spinWant) < 0.002;
    return (
      this.dragging ||
      this.spin > 0 ||
      spinWant > 0 ||
      this.yawVel !== 0 ||
      this.cover < 1 ||
      !camSettled ||
      !toppingsSettled ||
      !packSettled
    );
  }
}
