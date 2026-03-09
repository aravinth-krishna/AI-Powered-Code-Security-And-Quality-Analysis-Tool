import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scans = await prisma.scan.findMany({
    where: { userId: session.userId },
    include: { issues: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ scans });
}
