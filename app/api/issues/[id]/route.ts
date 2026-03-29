import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ISSUE_STATUSES = ["OPEN", "FIXED", "IGNORED"] as const;
type IssueStatus = (typeof ISSUE_STATUSES)[number];

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await req.json()) as { status?: unknown };
    const status = typeof body.status === "string" ? body.status : undefined;

    if (!status || !ISSUE_STATUSES.includes(status as IssueStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Verify the issue belongs to a scan owned by the user
    const issue = await prisma.issue.findUnique({
      where: { id },
      include: { scan: true },
    });

    if (!issue) {
      return NextResponse.json({ error: "Issue not found" }, { status: 404 });
    }

    if (issue.scan.userId !== session.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the issue status
    const updatedIssue = await prisma.issue.update({
      where: { id },
      data: {
        status: status as IssueStatus,
        statusUpdatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, issue: updatedIssue });
  } catch (error) {
    console.error("Error updating issue status:", error);
    return NextResponse.json(
      { error: "Failed to update issue status" },
      { status: 500 },
    );
  }
}
