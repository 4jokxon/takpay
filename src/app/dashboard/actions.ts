"use server";

import { redirect } from "next/navigation";
import { createInvoice } from "@/lib/db-invoices";
import { getAuthUser } from "@/lib/supabase-auth";

function requireString(value: FormDataEntryValue | null, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

export async function createInvoiceAction(formData: FormData) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const amount = Number(requireString(formData.get("amount")));
  const memo = requireString(formData.get("memo"), "Untitled invoice");
  const recipient = requireString(formData.get("recipient"));
  const currency = requireString(formData.get("currency"), "USDC") as "USDC" | "EURC";

  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Amount must be greater than zero.");
  if (!/^0x[a-fA-F0-9]{40}$/.test(recipient)) throw new Error("Recipient must be a valid EVM address.");
  if (currency !== "USDC" && currency !== "EURC") throw new Error("Unsupported currency.");

  const invoice = await createInvoice({ amount, memo, recipient, currency, merchantId: user.id });
  redirect(`/pay/${invoice.id}`);
}

export async function signOutAction() {
  // Client-side handles the actual sign out via supabase-browser
  redirect("/login");
}
