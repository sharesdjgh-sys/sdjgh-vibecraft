const { openSync } = require("node:fs");
const { join } = require("node:path");
const { spawn } = require("node:child_process");

const cwd = join(__dirname, "..");
const out = openSync(join(cwd, "dev-server.log"), "a");
const err = openSync(join(cwd, "dev-server.err.log"), "a");

const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3000"],
  {
    cwd,
    detached: true,
    stdio: ["ignore", out, err],
    windowsHide: true,
  },
);

child.unref();
console.log(child.pid);
