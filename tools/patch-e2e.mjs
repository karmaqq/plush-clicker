/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        E2E YAMA BETIGI                                    */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";

const target = process.argv[2] || "dist-test";
const filePath = `${target}/js/utils.js`;
appendFileSync(filePath, "\nwindow.__PLUSH_PATCH_TEST = true;\n");
const hash = createHash("sha256").update(readFileSync(filePath)).digest("hex");
const manifestPath = `${target}/manifest.json`;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
manifest.version = "2.0.0";
manifest.files["js/utils.js"] = hash;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log("sunucu yamalandi:", manifest.version, hash.slice(0, 16));
