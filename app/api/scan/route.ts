import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeCode } from "@/lib/scanner";
import { getSession } from "@/lib/auth";

const SEVERITY_WEIGHTS: Record<string, number> = {
  CRITICAL: 20,
  HIGH: 12,
  MEDIUM: 6,
  LOW: 2,
};

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, projectName, fileName, language, framework, analysisMode } =
      await req.json();

    const issues = await analyzeCode(code, fileName, {
      language,
      framework,
      analysisMode,
    });

    // Weighted score: deduct based on severity
    const penalty = issues.reduce(
      (sum, i) => sum + (SEVERITY_WEIGHTS[i.severity] || 5),
      0,
    );
    const score = Math.max(0, Math.min(100, 100 - penalty));

    // Build category summary
    const categorySummary: Record<string, number> = {};
    for (const issue of issues) {
      categorySummary[issue.category] =
        (categorySummary[issue.category] || 0) + 1;
    }

    const scan = await prisma.scan.create({
      data: {
        projectName,
        securityScore: score,
        userId: session.userId,
        issues: {
          create: issues.map((i) => ({
            fileName: i.fileName,
            lineNumber: i.lineNumber,
            snippet: i.snippet.slice(0, 500),
            issueType: i.issueType,
            severity: i.severity,
            category: i.category,
            description: i.description,
            aiExplanation: i.aiExplanation ?? null,
            aiFixSnippet: i.aiFixSnippet ?? null,
          })),
        },
      },
      include: { issues: true },
    });

    return NextResponse.json({ success: true, scan, categorySummary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Scan failed" },
      { status: 500 },
    );
  }
}
