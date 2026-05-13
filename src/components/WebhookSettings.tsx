"use client";

import { useState } from "react";

export function WebhookSettings({ merchantId, currentUrl, walletAddress }: { merchantId: string; currentUrl?: string; walletAddress: string }) {
  const [url, setUrl] = useState(currentUrl || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/merchants/webhook", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-wallet-address": walletAddress,
        },
        body: JSON.stringify({ webhookUrl: url }),
      });
      if (res.ok) {
        setMessage("Webhook URL saved");
      } else {
        const data = await res.json();
        setMessage(data.error || "Failed to save");
      }
    } catch {
      setMessage("Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400">Webhook</p>
      <h3 className="mt-2 text-lg font-bold">Payment Notifications</h3>
      <p className="mt-1 text-sm text-zinc-400">Get a POST request to your server when an invoice is paid.</p>
      <form onSubmit={handleSave} className="mt-4 flex gap-3">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://your-server.com/webhook"
          className="flex-1 rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-medium text-black transition hover:bg-emerald-300 disabled:opacity-50"
        >
          {saving ? "..." : "Save"}
        </button>
      </form>
      {message && <p className="mt-2 text-sm text-emerald-300">{message}</p>}
      <div className="mt-4 rounded-xl bg-black/30 p-3">
        <p className="text-xs text-zinc-500">Payload example:</p>
        <pre className="mt-1 text-xs text-zinc-400">{`{
  "event": "invoice.paid",
  "invoice_id": "TK-1001",
  "amount": 10.00,
  "currency": "USDC",
  "tx_hash": "0x...",
  "paid_at": "2026-05-13T..."
}`}</pre>
      </div>
    </div>
  );
}
