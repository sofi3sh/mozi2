const { spawn } = require("child_process");

function readArg(name) {
  const key = `--${name}`;
  const arg = process.argv.find((a) => a === key || a.startsWith(`${key}=`));
  if (!arg) return undefined;
  if (arg.includes("=")) return arg.split("=").slice(1).join("=");
  const idx = process.argv.indexOf(key);
  return idx >= 0 ? process.argv[idx + 1] : undefined;
}

const portFromArg = readArg("port");
const hostFromArg = readArg("host");

const port = Number(portFromArg || process.env.PORT || 3000) || 3000;
const host = hostFromArg || process.env.HOST || "127.0.0.1";

console.log(`[start] PORT=${port} HOST=${host}`);

const child = spawn(
  process.execPath,
  [
    "./node_modules/next/dist/bin/next",
    "start",
    "-p",
    String(port),
    "-H",
    String(host), // ✅ ВАЖЛИВО: біндимо Next на конкретний host
  ],
  { stdio: "inherit" }
);

child.on("exit", (code) => process.exit(code ?? 0));