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

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await prisma.$transaction(async (tx) => {
    const deletedVersionScans = await tx.versionScan.deleteMany({
      where: { scan: { userId: session.userId } },
    });

    const deletedIssues = await tx.issue.deleteMany({
      where: { scan: { userId: session.userId } },
    });

    const deletedScans = await tx.scan.deleteMany({
      where: { userId: session.userId },
    });

    return deletedVersionScans.count + deletedIssues.count + deletedScans.count;
  });

  return NextResponse.json({ success: true, deleted });
}
