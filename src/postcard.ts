import { drawFriend, drawStar, ellipse, roundRect, starPath } from "./art";
import { drawSnack } from "./picnicArt";
import { LEVELS, type FriendId, type Save } from "./levels";

/** Render locally so no player data or screenshots leave the browser. */
export async function createPostcard(save: Save, picnic = false): Promise<Blob> {
  await Promise.all([
    document.fonts.load('500 64px "DynaPuff"'),
    document.fonts.load('600 24px "Nunito"'),
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 1000;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("Your browser could not create the postcard.");
  c.fillStyle = "#f5efdf";
  c.fillRect(0, 0, 1600, 1000);
  roundRect(c, 32, 32, 1536, 936, 32, "#fffbef", "#c8d0b4");
  c.save();
  c.beginPath();
  c.roundRect(48, 48, 1504, 904, 24);
  c.clip();
  ellipse(c, 1260, 235, 125, 125, "#fff0be");
  ellipse(c, 260, 990, 670, 420, "#e3e8ce");
  ellipse(c, 1290, 1030, 760, 450, "#cfddbf");
  ellipse(c, 810, 1100, 1000, 390, "#b7cbb0");
  for (let i = 0; i < 24; i++) {
    const x = 100 + (i * 193) % 1400;
    const y = 650 + (i * 83) % 220;
    c.strokeStyle = "#8d9f78";
    c.lineWidth = 3;
    c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 24); c.stroke();
    for (let p = 0; p < 5; p++) {
      const a = p * Math.PI * 2 / 5;
      ellipse(c, x + Math.cos(a) * 7, y + Math.sin(a) * 7, 5, 5, i % 2 ? "#e8bda8" : "#fff2ca");
    }
    ellipse(c, x, y, 4, 4, "#d1ad69");
  }
  c.restore();
  const text = (s: string, x: number, y: number, size: number, title = false, color = "#53634c") => {
    c.fillStyle = color;
    c.font = `${title ? 500 : 600} ${size}px "${title ? "DynaPuff" : "Nunito"}", sans-serif`;
    c.fillText(s, x, y);
  };
  text("A LITTLE MEMORY FROM HOLD MY PAW", 100, 112, 22);
  text(picnic ? "A picnic worth the journey." : "Nobody left behind.", 100, 222, picnic ? 52 : 64, true);
  text(picnic ? "Every firefly found. Every little tummy full." : "I brought four little friends home.", 104, 278, 28);
  text(picnic ? "No more storms today. Just crumbs and each other." : "And when my light faded, they carried me.", 104, 320, 25, false, "#7c826a");
  c.save();
  c.translate(1365, 158); c.rotate(0.13);
  c.setLineDash([8, 7]);
  roundRect(c, -82, -74, 164, 148, 12, "#faf4df", "#94a383");
  c.setLineDash([]);
  drawStar(c, 0, -10, 36, 0);
  c.textAlign = "center";
  text(picnic ? "SECRET PICNIC" : "SAFELY HOME", 0, 55, 16);
  c.restore();
  const friends: FriendId[] = ["mochi", "pippin", "boba", "puff"];
  c.strokeStyle = "#b79d71"; c.lineWidth = 5;
  c.beginPath(); c.moveTo(420, 580);
  c.bezierCurveTo(620, 635, 980, 635, 1180, 580); c.stroke();
  if (picnic) {
    roundRect(c, 295, 575, 1010, 125, 22, "#f5dfd1", "#c49f8e");
    c.save(); c.beginPath(); c.roundRect(295, 575, 1010, 125, 22); c.clip();
    c.fillStyle = "#d9a49655";
    for (let x = 295; x < 1305; x += 60) c.fillRect(x, 575, 30, 125);
    for (let y = 575; y < 700; y += 60) c.fillRect(295, y, 1010, 30);
    c.restore();
  }
  friends.forEach((id, i) => {
    const x = 440 + i * 240;
    drawFriend(c, id, x, 535, 2.7, 0);
    c.textAlign = "center";
    if (picnic) drawSnack(c, id, x, 650, 1.2);
    else text(id[0].toUpperCase() + id.slice(1), x, 665, 26, true);
  });
  drawStar(c, 800, 418, 43, 0);
  c.textAlign = "center";
  const lights = Object.values(save.best).reduce((sum, best) => sum + best.lights, 0);
  const stars = Object.values(save.best).reduce((sum, best) => sum + best.stars, 0);
  const total = LEVELS.reduce((sum, level) => sum + level.lights.length, 0);
  roundRect(c, 360, 728, 880, 112, 26, "#fff9e9", "#a9bb99");
  text(`${lights} / ${total} fireflies`, 590, 776, 30, true);
  text("BEST ACROSS YOUR CHAPTERS", 590, 810, 14);
  text(`${stars} / 9 stars`, 1010, 776, 30, true);
  text("FOUR FRIENDS, FOREVER", 1010, 810, 14);
  starPath(c, 800, 786, 14, "#d8b367");
  text("hold-my-paw.vercel.app", 800, 902, 24);
  text("A little adventure by Mallika Suri", 800, 933, 17);
  return new Promise((resolve, reject) => canvas.toBlob(
    (blob) => blob ? resolve(blob) : reject(new Error("Your browser could not save the postcard.")),
    "image/png",
  ));
}
