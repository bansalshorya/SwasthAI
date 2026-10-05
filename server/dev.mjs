import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const viteEntry = fileURLToPath(new URL("../node_modules/vite/bin/vite.js", import.meta.url));
const children = [
  spawn(process.execPath, ["--env-file-if-exists=.env", "server/index.mjs"], { stdio: "inherit" }),
  spawn(process.execPath, [viteEntry], { stdio: "inherit" }),
];

let stopping = false;
function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill();
  process.exitCode = exitCode;
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!stopping) stop(signal ? 1 : (code || 0));
  });
  child.on("error", () => stop(1));
}

process.on("SIGINT", () => stop(0));
process.on("SIGTERM", () => stop(0));
