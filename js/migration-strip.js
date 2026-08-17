/* ═══════════════════════════════════════════════════════════════════════════ */
/*                       GÖÇ ŞERİDİ ARAYÜZÜ                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

import {
  getMigrantQueue,
  getArrivalDuration,
  onChange,
} from "./game-state.js";

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                      GÖÇ ŞERİDİ OLUŞTURUCU                               */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Göç Şeridi Bileşeni ─────────────────── */

export function createMigrationStrip() {
  const el = document.createElement("div");
  el.className = "migration-strip";

  function sync() {
    const queue = getMigrantQueue();
    const els = el.querySelectorAll(".migrant");
    const diff = queue.length - els.length;

    if (diff > 0) {
      for (let i = els.length; i < queue.length; i++) {
        spawnMigrant(el, queue[i].remaining);
      }
    } else if (diff < 0) {
      const removeCount = -diff;
      for (let i = 0; i < removeCount; i++) {
        els[i].remove();
      }
    }
  }

  onChange(sync);
  sync();

  return { el, sync };
}

/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        GÖÇMEN OLUŞTURUCU                                 */
/* ═══════════════════════════════════════════════════════════════════════════ */

function spawnMigrant(strip, remaining) {
  const el = document.createElement("span");
  el.className = "migrant";
  el.textContent = "🚶";

  const startX = strip.querySelectorAll(".migrant").length * 1.4;
  el.style.left = startX + "px";
  strip.appendChild(el);

  const dist = Math.max(strip.clientWidth - startX, 1);
  const flipped = " scaleX(-1)";

  const duration = Math.max(
    0.1,
    Number.isFinite(remaining) ? remaining : getArrivalDuration(),
  );

  el.style.transition = "none";
  el.style.transform = "translateY(-50%)" + flipped;
  void el.offsetWidth;

  el.style.transition = "transform " + duration + "s linear";
  el.style.transform = "translate(" + dist + "px, -50%)" + flipped;

  setTimeout(() => el.remove(), (duration + 0.5) * 1000);
}
