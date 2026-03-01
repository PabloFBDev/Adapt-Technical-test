import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAvailableProviders } from "@/lib/ai/factory";
import { getAISettings } from "@/lib/ai/settings";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settings = await getAISettings();
  const providers = getAvailableProviders(settings);

  return NextResponse.json({
    providers,
    default: settings.defaultProvider,
  });
}
