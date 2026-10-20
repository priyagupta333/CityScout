import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(import.meta.url), "../../");

export function ensureHostingConfig() {
  const target = resolve(root, ".openai/hosting.json");
  if (!existsSync(target)) {
    mkdirSync(dirname(target), { recursive: true });
    const defaultConfig = JSON.stringify({ d1: "DB", r2: null, project_id: "" }, null, 2);
    writeFileSync(target, defaultConfig, "utf8");
  }
}
