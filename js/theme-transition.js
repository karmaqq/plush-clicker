/* ═══════════════════════════════════════════════════════════════════════════ */
/*                    TEMA GEÇİŞ YÖNETİCİSİ                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

/* ─────────────────── Tema Sınıfı Haritası ─────────────────── */

const THEME_CLASSES = {
  1: "",
  2: "era-theme-tech",
  3: "era-theme-space",
};

const FLASH_CLASSES = {
  2: "era-flash-tech",
  3: "era-flash-space",
};

const BADGE_CLASSES = {
  2: "tech",
  3: "space",
};

/* ─────────────────── Tema Uygulayıcı ─────────────────── */

export function setTheme(era) {
  const body = document.body;
  for (const cls of Object.values(THEME_CLASSES)) {
    if (cls) body.classList.remove(cls);
  }
  const next = THEME_CLASSES[era];
  if (next) body.classList.add(next);
}

/* ─────────────────── Flash Gösterici ─────────────────── */

export function showFlash(era, duration) {
  return new Promise((resolve) => {
    const flash = document.createElement("div");
    flash.className = "era-flash " + (FLASH_CLASSES[era] || "");
    document.body.appendChild(flash);

    requestAnimationFrame(() => {
      flash.classList.add("era-flash-visible");
    });

    setTimeout(() => {
      flash.classList.remove("era-flash-visible");
      setTimeout(() => {
        flash.remove();
        resolve();
      }, 800);
    }, duration || 600);
  });
}

/* ─────────────────── Çağ Etiketi Gösterici ─────────────────── */

export function showBadge(text, era) {
  return new Promise((resolve) => {
    const badge = document.createElement("div");
    badge.className = "era-badge-anim " + (BADGE_CLASSES[era] || "");
    badge.textContent = text;
    document.body.appendChild(badge);

    requestAnimationFrame(() => {
      badge.classList.add("era-badge-anim-enter");
    });

    setTimeout(() => {
      badge.classList.remove("era-badge-anim-enter");
      badge.classList.add("era-badge-anim-exit");
      setTimeout(() => {
        badge.remove();
        resolve();
      }, 500);
    }, 1400);
  });
}

/* ─────────────────── Parçacık Oluşturucu ─────────────────── */

export function createSparkles(era, count) {
  const container = document.createElement("div");
  container.className = "era-sparkle-container";
  const themeClass = BADGE_CLASSES[era] || "";

  for (let i = 0; i < (count || 15); i++) {
    const p = document.createElement("div");
    p.className = "era-sparkle " + themeClass;
    p.style.left = Math.random() * 100 + "%";
    p.style.bottom = "-5px";
    p.style.animationDelay = Math.random() * 1.5 + "s";
    p.style.animationDuration = (1.2 + Math.random() * 1.8) + "s";
    p.classList.add("era-sparkle-rise");
    container.appendChild(p);
  }

  document.body.appendChild(container);

  setTimeout(() => {
    container.remove();
  }, 3500);
}

/* ─────────────────── Toast Bildirim Gösterici ─────────────────── */

export function showToast(text, icon) {
  return new Promise((resolve) => {
    const toast = document.createElement("div");
    toast.className = "era-toast";

    if (icon) {
      const iconEl = document.createElement("span");
      iconEl.className = "era-toast-icon";
      iconEl.textContent = icon;
      toast.appendChild(iconEl);
    }

    const textNode = document.createTextNode(text);
    toast.appendChild(textNode);

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add("era-toast-visible");
    });

    setTimeout(() => {
      toast.classList.remove("era-toast-visible");
      setTimeout(() => {
        toast.remove();
        resolve();
      }, 400);
    }, 2000);
  });
}
