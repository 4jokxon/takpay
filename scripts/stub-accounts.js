// Creates a stub "accounts" module that @wagmi/core optionally imports
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "node_modules", "accounts");
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}
fs.writeFileSync(path.join(dir, "package.json"), JSON.stringify({ name: "accounts", version: "0.0.1", main: "index.js" }));
fs.writeFileSync(path.join(dir, "index.js"), "module.exports = {};");
