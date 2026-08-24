/* ═══════════════════════════════════════════════════════════════════════════ */
/*                        MANIFEST URETICI                                   */
/* ═══════════════════════════════════════════════════════════════════════════ */

import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir, readdir, copyFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCOPE_ENTRIES = ["index.html", "css", "js"];

/* ─────────────────── Dosya Gezgini ─────────────────── */
async function walkDir(dirPath, baseDir, collected) {
  const entries = await readdir(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      await walkDir(fullPath, baseDir, collected);
    } else if (entry.isFile()) {
      const rel = path.relative(baseDir, fullPath).split(path.sep).join("/");
      collected.push(rel);
    }
  }
}

/* ─────────────────── Kapsam Toplayici ─────────────────── */
async function collectScopeFiles() {
  const files = [];
  for (const entry of SCOPE_ENTRIES) {
    const full = path.join(PROJECT_ROOT, entry);
    if (!existsSync(full)) continue;
    const rel = path.relative(PROJECT_ROOT, full).split(path.sep).join("/");
    if (path.extname(full)) {
      files.push(rel);
    } else {
      await walkDir(full, PROJECT_ROOT, files);
    }
  }
  return files.sort();
}

/* ─────────────────── Ana Akis ─────────────────── */
async function main() {
  const outputArg = process.argv[2];
  const outDir = outputArg ? path.resolve(PROJECT_ROOT, outputArg) : null;
  const files = await collectScopeFiles();
  const fileHashes = {};
  for (const rel of files) {
    const buffer = await readFile(path.join(PROJECT_ROOT, rel));
    fileHashes[rel] = createHash("sha256").update(buffer).digest("hex");
  }
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const version =
    process.env.RELEASE_VERSION ||
    `${now.getUTCFullYear()}.${pad(now.getUTCMonth() + 1)}.${pad(now.getUTCDate())}-${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}`;
  const manifest = {
    version,
    generatedAt: now.toISOString(),
    files: fileHashes,
  };
  const targets = outDir ? [outDir] : [PROJECT_ROOT];
  for (const target of targets) {
    await mkdir(target, { recursive: true });
    for (const rel of files) {
      const dest = path.join(target, rel);
      await mkdir(path.dirname(dest), { recursive: true });
      await copyFile(path.join(PROJECT_ROOT, rel), dest);
    }
    await writeFile(
      path.join(target, "manifest.json"),
      JSON.stringify(manifest, null, 2),
      "utf8"
    );
  }
  console.log(`[manifest] surum: ${version}`);
  console.log(`[manifest] dosya sayisi: ${files.length}`);
  for (const target of targets) {
    console.log(`[manifest] cikti: ${target}`);
  }
}

main().catch((err) => {
  console.error("[manifest] hata:", err.message);
  process.exit(1);
});
