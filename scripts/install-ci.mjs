import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["ci"], { stdio: "inherit", shell: true });
process.exit(result.status ?? 0);
