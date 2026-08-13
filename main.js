import { createHeaderPanel } from "./js/header-panel.js";
import { createLeftPanel } from "./js/left-panel.js";
import { createCenterPanel } from "./js/center-panel.js";
import { createRightPanel } from "./js/right-panel.js";
import { loadCss } from "./js/utils.js";
import { produce, TICK_MS } from "./js/game-state.js";

loadCss("css/base.css");
loadCss("css/layout.css");

document.addEventListener(
    "wheel",
    (e) => {
        if (!e.target.closest(".upgrade-list")) e.preventDefault();
    },
    { passive: false }
);
document.addEventListener("keydown", (e) => {
    if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) {
        if (!e.target.closest(".upgrade-list")) e.preventDefault();
    }
    if (e.key === "Space" && !e.target.closest("button")) {
        e.preventDefault();
    }
});

const headerPanel = createHeaderPanel();

const row = document.createElement("div");
row.className = "row";

row.append(createLeftPanel(), createCenterPanel(), createRightPanel());

document.body.append(headerPanel, row);

setInterval(produce, TICK_MS);
