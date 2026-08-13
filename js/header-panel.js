import { loadCss } from "./utils.js";
import { resetGame } from "./game-state.js";

loadCss("css/header-panel.css");

export function createHeaderPanel() {
    const panel = document.createElement("section");
    panel.className = "panel header-panel";

    const resetBtn = document.createElement("button");
    resetBtn.className = "reset-btn";
    resetBtn.textContent = "Sıfırla";
    resetBtn.title = "Tüm ilerlemeyi sıfırla";

    resetBtn.addEventListener("click", () => {
        if (confirm("Tüm ilerlemeyi sıfırlamak istediğine emin misin?")) {
            resetGame();
        }
    });

    panel.appendChild(resetBtn);
    return panel;
}
