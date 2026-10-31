import { ellipse, path, roundRect, type Ctx } from "./art";
import type { FriendId } from "./levels";

export const PICNIC_SNACKS: Record<FriendId, { name: string; reply: string }> = {
  mochi: { name: "Strawberry mochi", reply: "A tiny treat. A very big thank you." },
  pippin: { name: "Berry skewer", reply: "One for me. One for my next hop!" },
  boba: { name: "Leaf sandwich", reply: "I knew there would be snacks." },
  puff: { name: "Sunflower biscuit", reply: "Crumbs for everyone!" },
};
export function drawSnack(c: Ctx, id: FriendId, x: number, y: number, scale = 1) {
  c.save(); c.translate(x, y); c.scale(scale, scale);
  if (id === "mochi") {
    ellipse(c, 0, 8, 26, 8, "#dfc7ac");
    roundRect(c, -24, -16, 48, 29, 15, "#edb9b6", "#a67e6c");
    path(c, "M-8 -16 Q-11 -31 0 -29 Q11 -31 8 -16 Z", "#cb7972", "#a67e6c");
    path(c, "M-8 -28 L-2 -33 L1 -29 L7 -33 L8 -27 Z", "#91a875");
  } else if (id === "pippin") {
    c.strokeStyle = "#aa875c"; c.lineWidth = 4;
    c.beginPath(); c.moveTo(-28, 22); c.lineTo(25, -25); c.stroke();
    [[-15, 10], [0, -3], [15, -16]].forEach(([a,b]) => {
      ellipse(c, a, b, 11, 11, "#a793b4", "#796b73");
      ellipse(c, a-3, b-3, 3, 3, "#ddcde4");
    });
  } else if (id === "boba") {
    path(c, "M-27 14 L0 -24 L29 14 Z", "#e4c897", "#9e8968");
    path(c, "M-23 11 Q-13 0 -5 10 Q3 -1 11 8 Q21 0 26 12 L22 20 L-23 20 Z", "#8fa575");
    path(c, "M-25 17 L0 -17 L27 17 Z", "#f4deac", "#9e8968");
  } else {
    for (let i=0;i<8;i++) {
      const a=i*Math.PI/4;
      ellipse(c, Math.cos(a)*17, Math.sin(a)*17, 10, 10, "#e5bd70", "#ad8b59");
    }
    ellipse(c, 0, 0, 14, 14, "#f5d995", "#ad8b59");
    ellipse(c, -5, -2, 1.7, 2, "#79654b"); ellipse(c, 5, -2, 1.7, 2, "#79654b");
  }
  c.restore();
}
