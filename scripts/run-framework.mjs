import { fileURLToPath } from "node:url";
import { readExecutionProfile } from "./execution-profile.mjs";
import { ensureHostingConfig } from "./ensure-hosting.mjs";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) {
  throw new Error("Expected dev or build.");
}

ensureHostingConfig();

const managedLinux = readExecutionProfile() === "managed-linux";

const cli = new URL(
  managedLinux ? "../node_modules/vite/bin/vite.js" : "../node_modules/vinext/dist/cli.js",
  import.meta.url,
);

process.argv = [
  process.execPath,
  fileURLToPath(cli),
  command,
  ...args,
];

await import(cli.href);
