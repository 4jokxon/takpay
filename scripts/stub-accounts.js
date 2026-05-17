// Creates a stub "accounts" module that @wagmi/core optionally imports
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, "..", "node_modules", "accounts");

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFileSync(
  path.join(dir, "package.json"),
  JSON.stringify({ name: "accounts", version: "0.0.1", main: "index.js" }),
);
fs.writeFileSync(path.join(dir, "index.js"), "module.exports = {};\n");
