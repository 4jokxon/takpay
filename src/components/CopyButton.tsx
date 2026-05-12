"use client";

import { useState } from "react";

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1300);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/15"
    >
      {copied ? "Copied" : label}
    </button>
  );
}
