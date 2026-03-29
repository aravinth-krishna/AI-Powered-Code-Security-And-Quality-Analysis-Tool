import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const scan = await prisma.scan.findFirst({
    where: { id, userId: session.userId },
    include: { issues: true },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  return NextResponse.json({ scan });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const scan = await prisma.scan.findFirst({
    where: { id, userId: session.userId },
  });

  if (!scan) {
    return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.versionScan.deleteMany({ where: { scanId: id } });
    await tx.issue.deleteMany({ where: { scanId: id } });
    await tx.scan.delete({ where: { id } });
  });

  return NextResponse.json({ success: true });
}
