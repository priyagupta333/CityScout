import { readFileSync } from "node:fs";

export function readExecutionProfile() {
  try {
    const settings = JSON.parse(
      readFileSync(new URL("../.sites-runtime/execution-profile.json", import.meta.url), "utf8")
    );
    return settings.executionProfile || settings.profile || "portable";
  } catch (error) {
    if (error.code === "ENOENT") return "portable";
    throw error;
  }
}
