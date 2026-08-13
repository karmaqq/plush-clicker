import { loadCss } from "./utils.js";

loadCss("css/tooltip.css");

export function createTooltip(extraClass) {
    const element = document.createElement("div");
    element.className = "tooltip" + (extraClass ? " " + extraClass : "");
    document.body.appendChild(element);

    return {
        element,
        show(anchor) {
            positionTooltip(element, anchor);
            element.classList.add("visible");
        },
        hide() {
            element.classList.remove("visible");
        },
    };
}

function positionTooltip(tooltip, anchor) {
    const rect = anchor.getBoundingClientRect();
    const w = tooltip.offsetWidth;
    const h = tooltip.offsetHeight;
    const margin = 8;

    let top = rect.top - h - margin;
    if (top < margin) {
        top = rect.bottom + margin;
    }

    const left = rect.left + rect.width / 2 - w / 2;
    tooltip.style.left = Math.min(Math.max(margin, left), window.innerWidth - w - margin) + "px";
    tooltip.style.top = Math.max(margin, top) + "px";
}
