#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { ethers } from "ethers";

const walletFile = process.env.QA_WALLETS_FILE ?? "/root/qa-wallets/takpay.wallets";
const rpcUrl = process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network";
const appUrl = process.env.TAKPAY_URL ?? "https://takpay.vercel.app";
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
const usdcAddress = "0x3600000000000000000000000000000000000000";
const recipient = process.env.QA_RECIPIENT ?? "0xcEe2244B58Af2C8ddCa97A4aED0b819C5Fcb6910";
const amount = process.env.QA_AMOUNT ?? "0.10";

if (!supabaseUrl || !serviceRole) throw new Error("Missing Supabase env vars");

function parseWallets(raw) {
  return raw.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => {
    const [address, privateKey] = line.split(":");
    return { address, privateKey };
  });
}

async function supabase(path, init = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: serviceRole,
      authorization: `Bearer ${serviceRole}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) throw new Error(`Supabase ${path} failed ${response.status}: ${text.slice(0, 300)}`);
  return body;
}

const raw = await readFile(walletFile, "utf8");
const provider = new ethers.JsonRpcProvider(rpcUrl);
const abi = ["function balanceOf(address) view returns (uint256)", "function transfer(address,uint256) returns (bool)"];
const contractRead = new ethers.Contract(usdcAddress, abi, provider);

let selected;
for (const wallet of parseWallets(raw)) {
  const balance = await contractRead.balanceOf(wallet.address);
  if (balance >= ethers.parseUnits(amount, 6)) {
    selected = { ...wallet, balance };
    break;
  }
}
if (!selected) throw new Error("No QA wallet has enough ERC20 USDC");

const id = `QA-${Date.now().toString(36).toUpperCase()}`;
const invoice = {
  id,
  amount: Number(amount),
  currency: "USDC",
  memo: "Automated QA payment test",
  recipient,
  status: "pending",
};
await supabase("invoices", { method: "POST", headers: { Prefer: "return=minimal" }, body: JSON.stringify(invoice) });

const signer = new ethers.Wallet(selected.privateKey, provider);
const contract = new ethers.Contract(usdcAddress, abi, signer);
const tx = await contract.transfer(recipient, ethers.parseUnits(amount, 6));
console.log(`QA invoice: ${id}`);
console.log(`Payer: ${selected.address}`);
console.log(`Amount: ${amount} USDC`);
console.log(`Tx submitted: ${tx.hash}`);

const receipt = await tx.wait(1, 180000);
console.log(`Tx receipt status: ${receipt?.status}`);

const response = await fetch(`${appUrl}/api/invoices/${id}/pay`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ txHash: tx.hash }),
});
const body = await response.json().catch(() => null);
console.log(`TakPay verify API status: ${response.status}`);
console.log(JSON.stringify(body, null, 2));
