#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const walletFile = process.env.QA_WALLETS_FILE ?? "/root/qa-wallets/takpay.wallets";
const outDir = process.env.QA_OUTPUT_DIR ?? path.join(process.cwd(), "qa-output");
const rpcUrl = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const usdcAddress = "0x3600000000000000000000000000000000000000";
const usdcDecimals = 6n;
const nativeDecimals = 18n;

function parseWallets(raw) {
  const seen = new Set();
  return raw
    .split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index: index + 1 }))
    .filter(({ line }) => line && !line.startsWith("#"))
    .map(({ line, index }) => {
      const [address, privateKey] = line.split(":");
      if (!/^0x[a-fA-F0-9]{40}$/.test(address ?? "")) throw new Error(`Invalid address on line ${index}`);
      if (!/^0x[a-fA-F0-9]{64}$/.test(privateKey ?? "")) throw new Error(`Invalid private key format on line ${index}`);
      const normalized = address.toLowerCase();
      if (seen.has(normalized)) throw new Error(`Duplicate address on line ${index}: ${address}`);
      seen.add(normalized);
      return { address };
    });
}

async function rpc(method, params) {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const body = await response.json();
  if (body.error) throw new Error(body.error.message ?? `${method} failed`);
  return body.result;
}

function padAddress(address) {
  return address.toLowerCase().replace(/^0x/, "").padStart(64, "0");
}

function formatUnits(hexOrBigInt, decimals) {
  const units = typeof hexOrBigInt === "bigint" ? hexOrBigInt : BigInt(hexOrBigInt);
  const divisor = 10n ** decimals;
  const whole = units / divisor;
  const fraction = units % divisor;
  const fractionText = fraction.toString().padStart(Number(decimals), "0").replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

async function getBalances(address) {
  const [nativeHex, erc20Hex] = await Promise.all([
    rpc("eth_getBalance", [address, "latest"]),
    rpc("eth_call", [{ to: usdcAddress, data: `0x70a08231${padAddress(address)}` }, "latest"]),
  ]);
  return {
    address,
    nativeUsdc: formatUnits(nativeHex, nativeDecimals),
    erc20Usdc: formatUnits(erc20Hex, usdcDecimals),
    nativeUnits: BigInt(nativeHex),
    erc20Units: BigInt(erc20Hex),
  };
}

const raw = await readFile(walletFile, "utf8");
const wallets = parseWallets(raw);
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "qa-addresses.txt"), `${wallets.map((wallet) => wallet.address).join("\n")}\n`);

console.log(`Loaded ${wallets.length} QA wallets from ${walletFile}`);
console.log(`Wrote address-only export to ${path.join(outDir, "qa-addresses.txt")}`);
console.log("Private keys were validated but never printed.\n");

const rows = [];
for (const wallet of wallets) {
  try {
    rows.push(await getBalances(wallet.address));
  } catch (error) {
    rows.push({ address: wallet.address, error: error instanceof Error ? error.message : String(error) });
  }
}

const funded = rows.filter((row) => !row.error && row.erc20Units > 0n);
const ready = rows.filter((row) => !row.error && row.erc20Units >= 100000n && row.nativeUnits > 0n);

for (const row of rows) {
  if (row.error) {
    console.log(`${row.address} | ERROR: ${row.error}`);
  } else {
    console.log(`${row.address} | native gas USDC: ${row.nativeUsdc} | ERC20 USDC: ${row.erc20Usdc} | ready >=0.10: ${row.erc20Units >= 100000n ? "yes" : "no"}`);
  }
}

console.log("\nSummary");
console.log(`- wallets: ${wallets.length}`);
console.log(`- ERC20-funded wallets: ${funded.length}`);
console.log(`- ready for 0.10 USDC QA payment: ${ready.length}`);
