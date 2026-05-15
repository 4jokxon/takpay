import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus } from "@/lib/circle-wallet";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "Transaction ID required" }, { status: 400 });
  }

  try {
    const status = await getTransactionStatus(id);
    return NextResponse.json({ transaction: status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch transaction";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
