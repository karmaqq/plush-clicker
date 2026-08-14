export function createLayout({ header, left, center, right }) {
    const shell = document.createElement("div");
    shell.className = "app-shell";

    const headerRow = document.createElement("div");
    headerRow.className = "row app-header-row";
    headerRow.appendChild(header);

    const mainRow = document.createElement("div");
    mainRow.className = "row";
    mainRow.append(left, center, right);

    shell.append(headerRow, mainRow);

    return shell;
}
