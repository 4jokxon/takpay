"use client";

import { useState } from "react";

export function VerifyManualPayment({ invoiceId }: { invoiceId: string }) {
  const [txHash, setTxHash] = useState("");
  const [status, setStatus] = useState<"idle" | "verifying" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!txHash.startsWith("0x") || txHash.length < 10) {
      setStatus("error");
      setMessage("Please enter a valid transaction hash starting with 0x");
      return;
    }

    setStatus("verifying");
    setMessage("");

    try {
      const res = await fetch(`/api/invoices/${invoiceId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash }),
      });
      const data = await res.json();

      if (res.ok) {
        if (data.status === "paid") {
          setStatus("success");
          setMessage("Payment verified! Redirecting to receipt...");
          setTimeout(() => {
            window.location.href = `/receipt/${invoiceId}`;
          }, 1500);
        } else if (data.status === "submitted") {
          setStatus("error");
          setMessage("Transaction found but not yet confirmed. Try again in a few seconds.");
        } else {
          setStatus("success");
          setMessage(data.message || "Verified");
        }
      } else {
        setStatus("error");
        setMessage(data.error || "Verification failed");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <div className="mt-6 border-t border-white/10 pt-6">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">Already sent manually?</p>
      <p className="mt-1 text-sm text-zinc-400">Paste your transaction hash to verify payment.</p>
      <form onSubmit={handleVerify} className="mt-3 space-y-3">
        <input
          type="text"
          value={txHash}
          onChange={(e) => setTxHash(e.target.value)}
          placeholder="0x..."
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 font-mono text-xs text-white outline-none placeholder:text-zinc-600 focus:border-emerald-400/50"
        />
        <button
          type="submit"
          disabled={status === "verifying"}
          className="w-full rounded-xl bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/15 disabled:opacity-50"
        >
          {status === "verifying" ? "Verifying on-chain..." : "Verify Payment"}
        </button>
      </form>
      {message && (
        <p className={`mt-3 text-sm ${status === "success" ? "text-emerald-300" : "text-red-300"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
