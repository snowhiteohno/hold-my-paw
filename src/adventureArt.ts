import {
  drawFriend,
  drawPerch,
  ellipse,
  flower,
  line,
  path,
  roundRect,
  type Ctx,
} from "./art";
import {
  encounterAnchor,
  HOME,
  type Encounter,
  type EncounterState,
} from "./adventure";
import { FRIENDS } from "./levels";

export function drawHeart(
  c: Ctx,
  x: number,
  y: number,
  size: number,
  color = "#dfaa8e",
) {
  c.save();
  c.translate(x, y);
  c.scale(size / 20, size / 20);
  path(
    c,
    "M0 16 C-31 -2 -18 -25 0 -10 C18 -25 31 -2 0 16 Z",
    color,
    "#b78f76",
    1.1,
  );
  c.restore();
}
export function drawEncounter(
  c: Ctx,
  e: Encounter,
  s: EncounterState,
  t: number,
  helping: boolean,
) {
  const a = encounterAnchor(e),
    open = s.cleared || s.openFor > 0,
    archY = e.friend === "puff" ? 255 : e.y;
  c.save();
  // A braided, flowering trellis; its opening visibly unfurls when a friend helps.
  for (const side of [-1, 1]) {
    c.beginPath();
    c.moveTo(e.x + side * 35, 45);
    c.bezierCurveTo(
      e.x + side * 80,
      archY - 145,
      e.x + side * (open ? 115 : 22),
      archY - 90,
      e.x + side * (open ? 100 : 22),
      archY,
    );
    c.bezierCurveTo(
      e.x + side * (open ? 115 : 22),
      archY + 145,
      e.x + side * 60,
      590,
      e.x + side * 35,
      690,
    );
    c.strokeStyle = "#6f9272";
    c.lineWidth = 8;
    c.stroke();
    c.strokeStyle = "#b4c49b";
    c.lineWidth = 3;
    c.stroke();
    for (let i = 0; i < 12; i++) {
      const yy = 70 + i * 53;
      const near = Math.abs(yy - archY) < 140;
      const xx = e.x + side * (near ? (open ? 105 : 28) : 45);
      c.save();
      c.translate(xx, yy);
      c.rotate(side * (0.35 + Math.sin(i) * 0.2));
      ellipse(c, side * 10, 0, 22, 9, i % 2 ? "#9eb889" : "#bdd0a0", "#7e9f78");
      c.restore();
      if (i % 3 === 1)
        flower(c, xx, yy, 0.42, e.friend === "puff" ? "#f2dda6" : "#edb4a0", t);
    }
  }
  if (!open) {
    for (let i = 0; i < 6; i++)
      line(c, e.x - 34, 70 + i * 105, e.x + 34, 175 + i * 105, "#8fa98299", 2);
  }
  if (e.friend === "pippin" && !open) {
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      ellipse(
        c,
        e.x + Math.cos(angle) * 37,
        archY + Math.sin(angle) * 37,
        30,
        20,
        "#e6b598",
        "#b5957b",
      );
    }
    ellipse(c, e.x, archY, 20, 20, "#e9d29d", "#aa9e75");
  }
  if (e.friend === "mochi" && !s.cleared) {
    ellipse(c, e.x - 20, archY, 12, 17, "#e7c77f", "#a8915e");
    ellipse(c, e.x + 2, archY, 12, 17, "#e7c77f", "#a8915e");
    if (helping) {
      c.beginPath();
      c.moveTo(a.x + 25, a.y + 40);
      c.quadraticCurveTo(a.x + 70, a.y + 90, e.x - 20, archY);
      c.strokeStyle = "#d2ae7d";
      c.lineWidth = 5;
      c.stroke();
      drawHeart(c, e.x - 11, archY - 33, 8);
    }
  }
  if (!s.cleared) {
    c.beginPath();
    c.arc(a.x, a.y, 64, 0, Math.PI * 2);
    c.fillStyle = helping ? "#fff1bd42" : "#fff8e525";
    c.fill();
    c.strokeStyle = helping ? "#d0b275" : "#9fb18b";
    c.lineWidth = 2;
    c.setLineDash([4, 6]);
    c.stroke();
    c.setLineDash([]);
    c.beginPath();
    c.arc(a.x, a.y, 69, -Math.PI / 2, -Math.PI / 2 + s.progress * Math.PI * 2);
    c.strokeStyle = "#d4b56e";
    c.lineWidth = 4;
    c.stroke();
    drawFriend(c, e.friend, a.x, a.y + 100, 0.45, t, 0);
    roundRect(c, a.x - 66, a.y + 123, 132, 25, 12, "#fcf8e9e8", "#c6c9aa");
    c.font = "500 10px Nunito";
    c.textAlign = "center";
    c.fillStyle = "#748262";
    c.fillText(
      s.openFor > 0
        ? "GO, LITTLE FRIEND!"
        : `${FRIENDS[e.friend].name} · hold E`,
      a.x,
      a.y + 139,
    );
    if (e.friend === "puff" && s.openFor > 0) {
      for (let i = 0; i < 6; i++) {
        const yy = archY + 130 - ((t * 95 + i * 48) % 220);
        line(
          c,
          e.x - 80 + i * 12,
          yy,
          e.x - 80 + i * 12,
          yy - 20,
          "#f4e6b488",
          2,
        );
      }
    }
  } else {
    drawHeart(c, e.x, archY - 110, 10, "#bccba2");
  }
  c.restore();
}
export function drawPaperBoat(
  c: Ctx,
  x: number,
  y: number,
  t: number,
  boarded = false,
) {
  c.save();
  c.translate(x, y);
  c.rotate(Math.sin(t * 1.8) * 0.035);
  ellipse(c, 0, 62, 129, 12, "#e0ead433");
  ellipse(c, 0, 69, 150, 3, "#e2e8d355");
  path(c, "M-132 5 L-61 72 L75 72 L137 5 L0 34 Z", "#f5e9cb", "#a59a7d", 2);
  path(c, "M-132 5 L0 34 L-25 70 L-61 72 Z", "#e0d3b4", "#a59a7d", 1);
  path(c, "M137 5 L0 34 L-25 70 L75 72 Z", "#eadbb9", "#a59a7d", 1);
  path(c, "M-87 15 L-7 -68 L69 20 L0 34 Z", "#fff4d9", "#a59a7d", 2);
  path(c, "M-7 -68 L-7 31 L69 20 Z", "#e9dabb", "#b4a78b", 1);
  line(c, -104, 29, -55, 58, "#c6b895", 1);
  line(c, 112, 30, 73, 59, "#c6b895", 1);
  drawHeart(c, 44, 48, 8, "#cba78a");
  if (!boarded) {
    c.beginPath();
    c.ellipse(0, -33, 94, 49, 0, 0, Math.PI * 2);
    c.setLineDash([5, 7]);
    c.strokeStyle = "#fff3c3aa";
    c.lineWidth = 2;
    c.stroke();
    c.setLineDash([]);
  }
  c.restore();
}
export function drawHome(c: Ctx, t: number) {
  const { x, y } = HOME;
  c.save();
  c.translate(x, y);
  path(
    c,
    "M-190 115 Q-90 185 -40 176 L0 220 L35 173 Q122 183 190 115 Z",
    "#a6b294",
    "#82947c",
    2,
  );
  ellipse(c, 0, 115, 190, 29, "#c2cda8", "#9eaf8c");
  drawPerch(c, { x: 0, y: 90, kind: "house", scale: 1.4 }, t);
  for (let i = 0; i < 7; i++) {
    const xx = (i - 3) * 48;
    flower(c, xx, 118, 0.6 + (i % 2) * 0.2, i % 2 ? "#eec2a4" : "#f1dfac", t);
  }
  line(c, 110, 30, 110, 115, "#a49777", 4);
  roundRect(c, 73, 24, 80, 35, 5, "#efe0be", "#b3a383");
  c.font = "600 12px Nunito";
  c.fillStyle = "#8c9270";
  c.textAlign = "center";
  c.fillText("HOME", 113, 47);
  c.restore();
}
