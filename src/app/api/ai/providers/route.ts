import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvailableProviders } from "@/lib/ai/factory";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = getAvailableProviders();
  const defaultProvider = process.env.AI_PROVIDER || "mock";

  return NextResponse.json({ providers, default: defaultProvider });
}
