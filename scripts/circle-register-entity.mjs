// Register Entity Secret with Circle
// Usage: CIRCLE_API_KEY=xxx CIRCLE_ENTITY_SECRET=xxx node scripts/circle-register-entity.mjs

import { initiateDeveloperControlledWalletsClient } from "@circle-fin/developer-controlled-wallets";

const apiKey = process.env.CIRCLE_API_KEY;
const entitySecret = process.env.CIRCLE_ENTITY_SECRET;

if (!apiKey || !entitySecret) {
  console.error("Missing env vars. Usage:");
  console.error("  CIRCLE_API_KEY=your_api_key CIRCLE_ENTITY_SECRET=your_32byte_hex node scripts/circle-register-entity.mjs");
  process.exit(1);
}

if (entitySecret.length !== 64) {
  console.error(`Entity secret must be 64 hex chars (32 bytes). Got ${entitySecret.length} chars.`);
  process.exit(1);
}

console.log("Initializing Circle Developer-Controlled Wallets client...");
console.log(`API Key: ${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`);
console.log(`Entity Secret: ${entitySecret.slice(0, 8)}...${entitySecret.slice(-4)} (${entitySecret.length} chars)`);

try {
  const client = initiateDeveloperControlledWalletsClient({
    apiKey,
    entitySecret,
  });

  console.log("\n✓ Client initialized successfully!");
  console.log("  SDK handles entity secret encryption automatically.");
  console.log("\nCreating wallet set on Arc Testnet...");

  const walletSetResponse = await client.createWalletSet({
    name: "TakPay Agent Wallet Set",
  });

  const walletSet = walletSetResponse.data?.walletSet;
  if (!walletSet?.id) {
    throw new Error("Wallet set creation failed: no ID returned");
  }

  console.log(`✓ Wallet Set created: ${walletSet.id}`);

  const walletResponse = await client.createWallets({
    walletSetId: walletSet.id,
    blockchains: ["ARC-TESTNET"],
    count: 1,
    accountType: "EOA",
  });

  const wallet = walletResponse.data?.wallets?.[0];
  console.log("\n========================================");
  console.log("  TakPay Agent Wallet Created!");
  console.log("========================================");
  console.log(`  Wallet Set ID: ${walletSet.id}`);
  console.log(`  Wallet ID:     ${wallet?.id}`);
  console.log(`  Address:       ${wallet?.address}`);
  console.log(`  Blockchain:    ${wallet?.blockchain}`);
  console.log("========================================");
  console.log("\nNext steps:");
  console.log("1. Fund this wallet with testnet USDC: https://faucet.circle.com/");
  console.log("2. Add these to Vercel env vars:");
  console.log(`   CIRCLE_API_KEY=${apiKey}`);
  console.log(`   CIRCLE_ENTITY_SECRET=${entitySecret}`);
  console.log(`   CIRCLE_WALLET_SET_ID=${walletSet.id}`);
  console.log(`   CIRCLE_AGENT_WALLET_ID=${wallet?.id}`);
  console.log(`   CIRCLE_AGENT_WALLET_ADDRESS=${wallet?.address}`);

} catch (err) {
  console.error("\n✗ Error:", err.message || err);
  if (err.response?.data) {
    console.error("  Response:", JSON.stringify(err.response.data, null, 2));
  }
  process.exit(1);
}
