/* ═══════════════════════════════════════════════════════════════════════════ */
/*                             ANA GİRİŞ NOKTASI                              */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { createLayout } from "./layout.js";
import { createHeaderPanel } from "./header-panel.js";
import { createLeftPanel } from "./left-panel.js";
import { createCenterPanel } from "./center-panel.js";
import { createRightPanel } from "./right-panel.js";
import { produce, TICK_MS } from "./engine.js";
import { loadState } from "./persistence.js";

loadState();

const layout = createLayout({
    header: createHeaderPanel(),
    left: createLeftPanel(),
    center: createCenterPanel(),
    right: createRightPanel(),
});

document.body.appendChild(layout);

window.setInterval(produce, TICK_MS);
