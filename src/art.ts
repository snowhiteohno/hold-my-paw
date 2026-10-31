import type { FriendId, Level, Perch } from "./levels";
export type Ctx = CanvasRenderingContext2D;
const ink = "#554c42";
export function ellipse(
  c: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: string,
  stroke?: string,
) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function path(
  c: Ctx,
  d: string,
  fill: string,
  stroke?: string,
  width = 2,
) {
  const p = new Path2D(d);
  c.fillStyle = fill;
  c.fill(p);
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = width;
    c.stroke(p);
  }
}
export function line(
  c: Ctx,
  x: number,
  y: number,
  x2: number,
  y2: number,
  color: string,
  w = 2,
) {
  c.beginPath();
  c.moveTo(x, y);
  c.lineTo(x2, y2);
  c.strokeStyle = color;
  c.lineWidth = w;
  c.lineCap = "round";
  c.stroke();
}
export function roundRect(
  c: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: string,
  stroke?: string,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fillStyle = fill;
  c.fill();
  if (stroke) {
    c.strokeStyle = stroke;
    c.lineWidth = 2;
    c.stroke();
  }
}
export function starPath(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  fill: string,
  angle = -Math.PI / 2,
) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = angle + (i * Math.PI) / 5,
      s = i % 2 ? r * 0.48 : r;
    c.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s);
  }
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}
export function drawStar(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  t: number,
  eyes = true,
  glow = true,
) {
  c.save();
  if (glow) {
    const g = c.createRadialGradient(x, y, 2, x, y, r * 3.8);
    g.addColorStop(0, "#fff4b65c");
    g.addColorStop(1, "#fff4b600");
    c.fillStyle = g;
    c.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
  }
  c.translate(x, y);
  c.rotate(Math.sin(t * 2) * 0.07);
  starPath(c, 0, 0, r + 2, "#cba159");
  starPath(c, 0, -1, r, "#ffe8a2");
  starPath(c, -1, -3, r * 0.83, "#fff0bb");
  if (eyes) {
    ellipse(c, -r * 0.2, -1, 1.8, 2.7, ink);
    ellipse(c, r * 0.2, -1, 1.8, 2.7, ink);
    c.beginPath();
    c.arc(0, 2, r * 0.13, 0.1, Math.PI - 0.1);
    c.strokeStyle = ink;
    c.lineWidth = 1.4;
    c.stroke();
    ellipse(c, -r * 0.38, 5, r * 0.12, r * 0.07, "#eeb7a3");
    ellipse(c, r * 0.38, 5, r * 0.12, r * 0.07, "#eeb7a3");
  }
  c.restore();
}
export function drawFriend(
  c: Ctx,
  id: FriendId,
  x: number,
  y: number,
  size = 1,
  t = 0,
  angle = 0,
  expression: "happy" | "worried" | "sleep" = "happy",
) {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(size, size);
  const blink = Math.sin(t * 0.7 + id.length * 2) > 0.995;
  // little feet and gripping paws
  ellipse(
    c,
    -15,
    24,
    9,
    6,
    id === "pippin" ? "#8da979" : id === "puff" ? "#dda562" : "#bb947d",
    ink,
  );
  ellipse(
    c,
    15,
    24,
    9,
    6,
    id === "pippin" ? "#8da979" : id === "puff" ? "#dda562" : "#bb947d",
    ink,
  );
  if (id === "mochi") {
    path(
      c,
      "M-25 -7 Q-36 -19 -29 -40 Q-13 -38 -6 -24 L8 -24 Q20 -42 32 -37 L29 -9 Z",
      "#e6b59a",
      ink,
    );
    path(c, "M-26 -31 L-22 -13 L-12 -23 Z", "#d58d80");
    path(c, "M23 -29 L14 -21 L26 -14 Z", "#d58d80");
    ellipse(c, 0, 6, 30, 27, "#e9bfa3", ink);
    ellipse(c, 0, 9, 22, 19, "#f9dfbd");
    path(c, "M-2 -20 Q-9 -9 -3 -8 Q0 -13 1 -20 Z", "#c58b70");
    path(c, "M7 -19 Q3 -10 8 -8 L12 -16 Z", "#c58b70");
    path(c, "M-23 22 Q0 29 24 20 L24 27 Q0 35 -22 29 Z", "#94a596", ink);
    path(c, "M19 28 L30 39 L20 43 L11 29 Z", "#94a596", ink);
    line(c, -20, 5, -35, 2, "#b58f78", 1.2);
    line(c, -21, 10, -36, 12, "#b58f78", 1.2);
    line(c, 20, 5, 35, 2, "#b58f78", 1.2);
    line(c, 21, 10, 36, 12, "#b58f78", 1.2);
  } else if (id === "pippin") {
    ellipse(c, 0, 5, 31, 27, "#a8bd8d", ink);
    ellipse(c, -18, -18, 13, 13, "#b4c99c", ink);
    ellipse(c, 18, -18, 13, 13, "#b4c99c", ink);
    ellipse(c, 0, 13, 21, 15, "#dfdfb7");
    ellipse(c, -20, 5, 6, 3, "#dca393");
    ellipse(c, 20, 5, 6, 3, "#dca393");
    path(c, "M-25 21 Q0 28 25 20 L24 28 Q0 36 -23 28 Z", "#da9878", ink);
    path(c, "M-16 28 L-26 39 L-13 42 L-8 29 Z", "#da9878", ink);
  } else if (id === "boba") {
    ellipse(c, -22, -22, 9, 10, "#b9977a", ink);
    ellipse(c, 21, -22, 9, 10, "#b9977a", ink);
    ellipse(c, -22, -22, 4, 5, "#d7ad91");
    ellipse(c, 21, -22, 4, 5, "#d7ad91");
    roundRect(c, -32, -23, 64, 53, 23, "#bb9e7c", ink);
    ellipse(c, 0, 10, 23, 16, "#d2b593");
    ellipse(c, -8, 9, 3, 2, "#725d4c");
    ellipse(c, 8, 9, 3, 2, "#725d4c");
    path(
      c,
      "M-27 -19 Q-7 -37 18 -27 L25 -22 Q-9 -21 -27 -19 Z",
      "#b5c29c",
      ink,
    );
    path(c, "M-2 -28 Q4 -42 15 -37 Q15 -25 -2 -28 Z", "#87a37b");
  } else {
    ellipse(c, 0, 5, 28, 27, "#f2d48b", ink);
    path(
      c,
      "M-5 -21 Q-17 -33 -9 -35 Q-5 -26 0 -25 Q-1 -37 7 -34 L10 -24 Z",
      "#f2d48b",
      ink,
    );
    ellipse(c, -17, 14, 8, 13, "#e7c476");
    ellipse(c, 18, 14, 8, 13, "#e7c476");
    path(c, "M-22 23 Q0 29 23 21 L23 29 Q0 35 -22 29 Z", "#a3b9c4", ink);
  }
  const ey = id === "pippin" ? -18 : -3,
    ex = id === "pippin" ? 18 : 12;
  if (blink || expression === "sleep") {
    line(c, -ex - 3, ey, -ex + 3, ey, ink, 2);
    line(c, ex - 3, ey, ex + 3, ey, ink, 2);
  } else {
    ellipse(c, -ex, ey, 2.3, id === "boba" ? 2 : 3.4, ink);
    ellipse(c, ex, ey, 2.3, id === "boba" ? 2 : 3.4, ink);
    ellipse(c, -ex + 0.5, ey - 0.7, 0.6, 0.8, "#fff");
    ellipse(c, ex + 0.5, ey - 0.7, 0.6, 0.8, "#fff");
  }
  if (id === "puff") {
    ellipse(c, 0, 8, 9, 4.5, "#dc9b5b", ink);
    line(c, -7, 8, 7, 8, "#b67a4c", 1);
  } else if (id === "mochi") {
    path(c, "M-3 5 L3 5 L0 8 Z", "#a77068");
    line(c, 0, 8, 0, 11, ink, 1);
    c.beginPath();
    c.arc(-3, 11, 3, 0, Math.PI);
    c.arc(3, 11, 3, 0, Math.PI);
    c.strokeStyle = ink;
    c.lineWidth = 1;
    c.stroke();
  } else {
    c.beginPath();
    c.arc(
      0,
      id === "boba" ? 13 : 2,
      id === "boba" ? 6 : 13,
      expression === "worried" ? Math.PI : 0,
      expression === "worried" ? Math.PI * 2 : Math.PI,
    );
    c.strokeStyle = ink;
    c.lineWidth = 1.6;
    c.stroke();
  }
  if (id !== "pippin") {
    ellipse(c, -21, 7, 5, 2.8, "#dca09199");
    ellipse(c, 21, 7, 5, 2.8, "#dca09199");
  }
  ellipse(
    c,
    -28,
    id === "puff" ? 16 + Math.sin(t * 7) * 5 : 16,
    6,
    8,
    id === "pippin"
      ? "#a8bd8d"
      : id === "puff"
        ? "#eed08b"
        : id === "mochi"
          ? "#e9bfa3"
          : "#bb9e7c",
    ink,
  );
  ellipse(
    c,
    28,
    id === "puff" ? 16 - Math.sin(t * 7) * 5 : 16,
    6,
    8,
    id === "pippin"
      ? "#a8bd8d"
      : id === "puff"
        ? "#eed08b"
        : id === "mochi"
          ? "#e9bfa3"
          : "#bb9e7c",
    ink,
  );
  c.restore();
}
function cloud(c: Ctx, x: number, y: number, s: number, color: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  path(
    c,
    "M-90 20 Q-120 10 -97 -7 Q-79 -20 -57 -11 Q-49 -59 -8 -48 Q18 -48 30 -21 Q69 -36 80 -9 Q109 -5 104 20 Z",
    color,
  );
  c.restore();
}
function bush(c: Ctx, x: number, y: number, s: number, color: string) {
  c.save();
  c.translate(x, y);
  c.scale(s, s);
  path(
    c,
    "M-90 0 Q-99 -35 -65 -39 Q-67 -77 -30 -68 Q-7 -110 22 -64 Q63 -82 68 -43 Q102 -35 96 0 Z",
    color,
  );
  c.restore();
}
export function flower(
  c: Ctx,
  x: number,
  y: number,
  s: number,
  color = "#f0c7b4",
  t = 0,
) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(t + x) * 0.08);
  line(c, 0, 0, 0, -35 * s, "#78937a", 2 * s);
  ellipse(c, -7 * s, -12 * s, 9 * s, 3 * s, "#8fa387");
  for (let i = 0; i < 5; i++) {
    const a = (i * Math.PI * 2) / 5;
    ellipse(
      c,
      Math.cos(a) * 7 * s,
      -35 * s + Math.sin(a) * 7 * s,
      5 * s,
      5 * s,
      color,
    );
  }
  ellipse(c, 0, -35 * s, 3 * s, 3 * s, "#d9ad65");
  c.restore();
}
export function drawPerch(c: Ctx, p: Perch, t: number) {
  c.save();
  c.translate(p.x, p.y);
  c.scale(p.scale ?? 1, p.scale ?? 1);
  if (p.kind !== "leaf" && p.kind !== "house") {
    const base = p.kind === "mushroom" ? 88 : 83;
    path(
      c,
      `M-103 ${base} Q-75 ${base + 38} -27 ${base + 46} L-9 ${base + 69} L13 ${base + 43} Q78 ${base + 37} 103 ${base} Z`,
      "#a4b099",
      "#7f9480",
      1.3,
    );
    ellipse(c, 0, base, 103, 14, "#b8c7a2", "#8ea085");
    for (let i = 0; i < 5; i++) {
      const xx = (i - 2) * 29;
      line(
        c,
        xx,
        base + 12,
        xx + Math.sin(i) * 14,
        base + 28 + (i % 3) * 10,
        "#879b7d",
        1,
      );
    }
    flower(c, -84, base, 0.38, "#edcdb3", t);
    flower(c, 85, base, 0.45, "#ebddb5", t);
  }
  if (p.kind === "cup") {
    ellipse(c, 0, 80, 115, 14, "#526e6c15");
    ellipse(c, 0, 66, 103, 14, "#e6dfc6", "#a6a38d");
    ellipse(c, 0, 62, 87, 10, "#f5edd4");
    c.beginPath();
    c.ellipse(70, 12, 37, 32, 0, 0, Math.PI * 2);
    c.strokeStyle = "#8c9e92";
    c.lineWidth = 15;
    c.stroke();
    c.strokeStyle = "#e8ead6";
    c.lineWidth = 10;
    c.stroke();
    path(
      c,
      "M-78 -25 L-66 39 Q-56 74 0 71 Q56 74 66 39 L78 -25 Z",
      "#e2e6d0",
      "#8c9e92",
      2,
    );
    path(c, "M-62 -9 L-52 37 Q-40 60 -17 61 L-23 -12 Z", "#f5f1dc");
    ellipse(c, 0, -25, 78, 18, "#f4efd9", "#8c9e92");
    ellipse(c, 0, -24, 66, 11, "#8b9b83");
    ellipse(c, 0, -24, 57, 7, "#b2bd9a");
    for (let i = -1; i <= 1; i++) {
      flower(c, i * 28, 39, 0.4, "#cfb1a0", t);
    }
    line(c, 35, -23, 41, 20, "#d2b58b", 1);
    roundRect(c, 31, 17, 20, 27, 3, "#efe1bb", "#b0a589");
    starPath(c, 41, 30, 5, "#a4ad86");
  } else if (p.kind === "mushroom") {
    path(c, "M-23 -8 L-30 79 Q0 100 32 77 L23 -9 Z", "#e9d8b5", "#a7987f");
    path(c, "M-18 5 L-19 72 Q-2 80 3 73 L2 0 Z", "#f4e9cd");
    ellipse(c, 0, 0, 97, 23, "#dcc8a4", "#a7987f");
    path(
      c,
      "M-100 -2 Q-86 -67 -12 -76 Q66 -86 101 -2 Q27 18 -100 -2 Z",
      "#c98d78",
      "#947d6c",
    );
    path(
      c,
      "M-91 -5 Q-71 -57 -17 -66 Q49 -73 80 -17 Q-5 -35 -91 -5 Z",
      "#dba08a",
    );
    ellipse(c, -42, -36, 15, 9, "#f5e4c9");
    ellipse(c, 17, -54, 12, 9, "#f5e4c9");
    ellipse(c, 59, -25, 12, 7, "#f5e4c9");
  } else if (p.kind === "spool") {
    ellipse(c, 0, 78, 78, 14, "#b59e7d", "#8e8068");
    roundRect(c, -57, -5, 114, 80, 10, "#b7be99", "#8e8068");
    for (let i = 0; i < 9; i++)
      line(c, -54, 4 + i * 8, 53, 4 + i * 8, i % 2 ? "#cdd0ad" : "#97a280", 2);
    ellipse(c, 0, -4, 78, 15, "#dac39b", "#8e8068");
    ellipse(c, 0, -7, 17, 6, "#867d67");
    path(
      c,
      "M45 60 Q110 80 92 115 Q80 142 130 120",
      "transparent",
      "#a0ac87",
      4,
    );
  } else if (p.kind === "house") {
    roundRect(c, -64, -98, 128, 130, 13, "#e5c7a2", "#9f927a");
    path(
      c,
      "M-88 -92 L-9 -174 Q0 -185 15 -173 L87 -92 Z",
      "#aa927b",
      "#8c816e",
    );
    path(c, "M-70 -98 L0 -166 L70 -98 Z", "#bea48b");
    roundRect(c, -18, -27, 36, 60, 17, "#7f9586", "#778778");
    ellipse(c, 0, -68, 18, 18, "#f4dfac", "#9c927b");
    line(c, -18, -68, 18, -68, "#9c927b", 3);
    line(c, 0, -86, 0, -50, "#9c927b", 3);
    ellipse(c, 10, 8, 2, 2, "#e4c48f");
    flower(c, -49, 35, 0.7);
    flower(c, 51, 35, 0.65);
  } else {
    path(c, "M-120 10 Q-15 -89 128 5 Q25 72 -120 10 Z", "#a0b59a", "#708f78");
    path(c, "M-108 10 Q0 -2 116 5", "transparent", "#688b74");
  }
  c.restore();
}
export function drawGoal(
  c: Ctx,
  x: number,
  y: number,
  t: number,
  ready: boolean,
) {
  c.save();
  c.translate(x, y + Math.sin(t * 1.3) * 5);
  const glow = c.createRadialGradient(0, 0, 0, 0, 0, 180);
  glow.addColorStop(0, ready ? "#f4e3ac55" : "#fff0c122");
  glow.addColorStop(1, "#fff0c100");
  c.fillStyle = glow;
  c.fillRect(-180, -180, 360, 360);
  line(c, 0, -120, 0, 30, "#8f7f69", 3);
  line(c, -95, -75, -46, 37, "#a5957a", 2);
  line(c, 95, -75, 46, 37, "#a5957a", 2);
  path(
    c,
    "M-113 -76 Q-91 -173 0 -176 Q92 -173 113 -76 Q83 -96 57 -73 Q29 -94 0 -73 Q-31 -94 -58 -73 Q-85 -94 -113 -76 Z",
    "#d6a68b",
    "#a38370",
  );
  path(c, "M0 -176 Q-51 -141 -58 -73 Q-31 -94 0 -73 Z", "#ecd0ac");
  path(c, "M0 -176 Q54 -143 57 -73 Q29 -94 0 -73 Z", "#ecd0ac");
  ellipse(c, 0, -180, 5, 7, "#aa8d70");
  path(c, "M-73 29 Q0 45 73 29 L58 71 Q0 98 -58 71 Z", "#bc9971", "#887c65");
  path(c, "M-66 39 Q0 53 66 39", "transparent", "#e2c396", 4);
  for (let i = -2; i <= 2; i++) line(c, i * 21, 47, i * 18, 78, "#9e835e", 1.5);
  line(c, -52, 64, 52, 64, "#9e835e", 1.5);
  roundRect(c, -30, 47, 60, 24, 4, "#eee0ba");
  c.font = "600 9px Nunito";
  c.textAlign = "center";
  c.fillStyle = "#756c54";
  c.fillText("HOMEBOUND", 0, 62);
  for (let i = 0; i < 4; i++) {
    const a = t * 0.6 + i * 1.6;
    drawStar(c, Math.cos(a) * 135, Math.sin(a) * 65 - 40, 3, t, false, false);
  }
  c.restore();
}
export function drawBell(
  c: Ctx,
  x: number,
  y: number,
  t: number,
  active: boolean,
) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(t * 2) * 0.09);
  const g = c.createRadialGradient(0, 0, 3, 0, 0, 70);
  g.addColorStop(0, active ? "#fff0b977" : "#fff0b933");
  g.addColorStop(1, "#fff0b900");
  c.fillStyle = g;
  c.fillRect(-70, -70, 140, 140);
  line(c, 0, -50, 0, -20, "#8d9c79", 2);
  path(
    c,
    "M-15 12 Q-15 -7 -9 -13 Q0 -22 9 -13 Q15 -7 15 12 L20 17 Q0 24 -20 17 Z",
    active ? "#e9cf85" : "#cabf9b",
    "#9b906f",
  );
  ellipse(c, 0, 19, 5, 4, "#b79d64");
  ellipse(c, -5, -4, 3, 6, "#fff4c9");
  c.restore();
}
export function drawHazard(c: Ctx, x: number, y: number, r: number, t: number) {
  c.save();
  c.translate(x, y);
  c.rotate(t * 1.4);
  for (let i = 0; i < 7; i++) {
    c.rotate((Math.PI * 2) / 7);
    path(
      c,
      `M0 -6 Q${r * 0.2} -${r} ${r * 0.65} -${r * 0.9} Q${r * 0.85} -${r * 0.1} 0 8 Z`,
      "#bc9d8c",
      "#8f8072",
      1.5,
    );
  }
  ellipse(c, 0, 0, r * 0.33, r * 0.33, "#d1bda4", "#8f8072");
  for (let i = 0; i < 5; i++)
    ellipse(
      c,
      Math.cos(i * 2) * r * 0.18,
      Math.sin(i * 2) * r * 0.18,
      2,
      2,
      "#8f8072",
    );
  c.restore();
}
export function drawObstacle(
  c: Ctx,
  x: number,
  y: number,
  r: number,
  t: number,
) {
  const top = y < 300;
  c.save();
  c.translate(x, y);
  const g = c.createLinearGradient(-r, -r, r, r);
  g.addColorStop(0, "#a6b49b");
  g.addColorStop(1, "#6d8b7b");
  ellipse(c, 0, 0, r, r, g as unknown as string, "#6e8975");
  for (let i = 0; i < 5; i++) {
    const angle = i * 1.2 + (top ? 0 : 3),
      px = Math.cos(angle) * r * 0.65,
      py = Math.sin(angle) * r * 0.6;
    ellipse(c, px, py, r * 0.27, r * 0.13, "#bac6a44d");
  }
  if (!top) {
    for (let i = 0; i < 7; i++) {
      let xx = (i - 3) * r * 0.22;
      const yy = -Math.sqrt(r * r - xx * xx);
      flower(
        c,
        xx,
        yy,
        0.55 + (i % 3) * 0.15,
        i % 2 ? "#f0d5ac" : "#e4ad9a",
        t,
      );
    }
  } else {
    for (let i = 0; i < 4; i++) {
      const xx = (i - 1.5) * r * 0.3;
      c.beginPath();
      c.moveTo(xx, r * 0.75);
      c.quadraticCurveTo(xx - 20, r + 35, xx + 10, r + 65 + (i % 2) * 20);
      c.strokeStyle = "#789b7d";
      c.lineWidth = 3;
      c.stroke();
      ellipse(c, xx + 2, r + 28, 11, 5, "#98b38a");
      ellipse(c, xx + 8, r + 50, 10, 5, "#98b38a");
    }
  }
  c.restore();
}
const palettes = {
  morning: {
    sky: "#f5efda",
    bottom: "#dbe7d6",
    mount: "#c5d4bd",
    far: "#d6dfc8",
    tree: "#a6bfa7",
    water: "#a4c7bb",
    deep: "#79aaa5",
    sun: "#fff5d4",
  },
  sunset: {
    sky: "#f4dfcf",
    bottom: "#e7dbbd",
    mount: "#c2bdab",
    far: "#d8cabb",
    tree: "#a6b2a1",
    water: "#b0c4b8",
    deep: "#7ea8a5",
    sun: "#fff2ce",
  },
  storm: {
    sky: "#526c78",
    bottom: "#91a7a1",
    mount: "#69858a",
    far: "#6d8890",
    tree: "#607e7b",
    water: "#6e9898",
    deep: "#476f7e",
    sun: "#e2e4c0",
  },
};
export function drawWorldBackground(
  c: Ctx,
  w: number,
  h: number,
  camera: number,
  t: number,
  theme: Level["theme"],
  reduced = false,
) {
  const p = palettes[theme];
  const sky = c.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, p.sky);
  sky.addColorStop(1, p.bottom);
  c.fillStyle = sky;
  c.fillRect(0, 0, w, h);
  const sunX = w * 0.78 - camera * 0.025;
  const glow = c.createRadialGradient(sunX, 160, 12, sunX, 160, 180);
  glow.addColorStop(0, p.sun + "99");
  glow.addColorStop(1, p.sun + "00");
  c.fillStyle = glow;
  c.fillRect(sunX - 180, -20, 360, 360);
  ellipse(c, sunX, 160, 53, 53, p.sun);
  for (let i = -1; i < 6; i++) {
    cloud(
      c,
      i * 460 - camera * 0.12 + (reduced ? 0 : Math.sin(t * 0.05 + i) * 20),
      110 + (i % 3) * 50,
      0.65 + (i % 2) * 0.2,
      theme === "storm" ? "#9caeac55" : "#fffaf077",
    );
  }
  for (let layer = 0; layer < 3; layer++) {
    const offset = camera * (0.1 + layer * 0.09),
      base = 480 + layer * 70;
    c.beginPath();
    c.moveTo(0, h);
    c.lineTo(0, base);
    for (let x = 0; x <= w + 40; x += 20)
      c.lineTo(
        x,
        base +
          Math.sin((x + offset) / 240 + layer * 3) * 55 +
          Math.sin((x + offset) / 480) * 30,
      );
    c.lineTo(w, h);
    c.closePath();
    c.fillStyle = layer === 0 ? p.far : layer === 1 ? p.mount : p.tree;
    c.fill();
  }
  for (let i = 0; i < 10; i++) {
    const xx = i * 390 - camera * 0.38;
    const x = ((((xx + 200) % (w + 450)) + (w + 450)) % (w + 450)) - 200;
    const y = 540 + Math.sin(i * 7) * 35;
    line(
      c,
      x,
      y - 100,
      x,
      y + 90,
      theme === "storm" ? "#658075" : "#95ab8f",
      5,
    );
    bush(
      c,
      x,
      y - 70,
      0.9 + (i % 3) * 0.25,
      theme === "storm" ? "#7d9580" : "#b8c7a4",
    );
  }
  // quiet distant cottages
  for (let i = 0; i < 4; i++) {
    const xx = i * 740 + 300 - camera * 0.24;
    if (xx > -150 && xx < w + 150) {
      c.save();
      c.globalAlpha = 0.5;
      drawPerch(c, { x: xx, y: 605, kind: "house", scale: 0.32 }, t);
      c.restore();
    }
  }
  const water = c.createLinearGradient(0, 675, 0, h);
  water.addColorStop(0, p.water);
  water.addColorStop(1, p.deep);
  c.fillStyle = water;
  c.fillRect(0, 675, w, h - 675);
  for (let i = 0; i < 32; i++) {
    const y = 685 + ((i * 37) % 130),
      xx =
        ((((i * 163 - camera * 0.5 + t * (reduced ? 0 : 5) * (i % 2 ? 1 : -1)) %
          (w + 120)) +
          w +
          120) %
          (w + 120)) -
        60;
    line(
      c,
      xx,
      y,
      xx + 30 + (i % 4) * 15,
      y,
      i % 3 === 0 ? "#e1e8cb66" : "#e1e8cb25",
      1.5,
    );
  }
  for (let i = 0; i < 9; i++) {
    const xx =
      ((((i * 237 - camera * 0.7) % (w + 150)) + w + 150) % (w + 150)) - 75;
    const yy = 710 + (i % 3) * 31;
    ellipse(c, xx, yy, 28 + (i % 2) * 12, 5, "#729d8b88");
    if (i % 3 === 0) flower(c, xx, yy, 0.35, "#f2d1b5", t);
  }
  if (theme === "storm" && !reduced) {
    c.strokeStyle = "#e0e9df33";
    c.lineWidth = 1;
    for (let i = 0; i < 70; i++) {
      const x = ((i * 131 + t * 110) % (w + 100)) - 50,
        y = (i * 87 + t * 270) % 800;
      line(c, x, y, x - 7, y + 16, "#e0e9df33", 1);
    }
  }
}
export function drawForeground(c: Ctx, w: number, camera: number, t: number) {
  for (let i = 0; i < 12; i++) {
    const x =
      ((((i * 240 - camera * 1.08) % (w + 260)) + w + 260) % (w + 260)) - 130;
    const yy = 820 + (i % 2) * 8;
    for (let j = 0; j < 5; j++) {
      const a = (j - 2) * 0.22 + Math.sin(t * 0.8 + i) * 0.04;
      c.save();
      c.translate(x, yy);
      c.rotate(a);
      ellipse(c, 0, -30, 7, 62, "#476e654d");
      c.restore();
    }
    if (i % 3 === 0) flower(c, x, yy - 20, 0.7, "#ebc5a799", t);
  }
}
export function drawHero(
  c: Ctx,
  w: number,
  h: number,
  t: number,
  reduced = false,
) {
  c.save();
  const scale = Math.max(w / 1400, h / 900);
  c.scale(scale, scale);
  const W = w / scale,
    H = h / scale;
  drawWorldBackground(c, W, H, 0, t, "morning", reduced);
  const x = W * 0.72,
    y = H * 0.63;
  c.save();
  c.translate(x, y);
  c.rotate(-0.08);
  drawPerch(c, { x: 0, y: 55, kind: "cup", scale: 1.75 }, t);
  c.restore();
  drawPerch(c, { x: x - 210, y: y + 135, kind: "mushroom", scale: 0.7 }, t);
  drawPerch(c, { x: x + 180, y: y + 175, kind: "leaf", scale: 1.15 }, t);
  const sway = reduced ? 0 : Math.sin(t) * 6;
  drawFriend(c, "boba", x + 74, y + 13, 1.2, t, 0.06, "sleep");
  drawFriend(c, "pippin", x - 190, y + 65, 1.02, t, -0.15);
  drawFriend(c, "puff", x + 184, y + 131, 1, t, 0.1);
  drawFriend(c, "mochi", x - 53, y + 4, 1.3, t, -0.1);
  c.beginPath();
  c.moveTo(x - 60, y - 25);
  c.bezierCurveTo(
    x - 120,
    y - 60,
    x - 80 + sway,
    y - 130,
    x - 35 + sway,
    y - 170,
  );
  c.strokeStyle = "#c7ab7d";
  c.lineWidth = 2;
  c.setLineDash([3, 5]);
  c.stroke();
  c.setLineDash([]);
  drawStar(c, x - 35 + sway, y - 195, 39, t);
  for (let i = 0; i < 8; i++) {
    let xx = x + Math.sin(i * 2.3) * 280,
      yy = y - 150 + Math.cos(i * 3.1) * 130 + Math.sin(t + i) * 5;
    drawStar(c, xx, yy, 3 + (i % 2) * 2, t, false);
  }
  c.save();
  c.translate(x + 175, y - 185 + sway);
  c.rotate(0.12);
  path(c, "M-22 10 Q0 -9 24 10 L0 17 Z", "#edd7b7", "#ad9d7d");
  line(c, 0, 17, 0, 34, "#b3a188", 1);
  c.restore();
  drawForeground(c, W, 0, t);
  c.restore();
}
