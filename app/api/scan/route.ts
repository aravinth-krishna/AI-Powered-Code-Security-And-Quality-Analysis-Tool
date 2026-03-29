import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { analyzeCode, checkVersionVulnerabilities } from "@/lib/scanner";
import { parseConfigFile } from "@/lib/versionParser";
import { getSession } from "@/lib/auth";

type ScanFileInput = {
  name: string;
  content: string;
};

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

    const {
      code,
      projectName,
      fileName,
      language,
      framework,
      analysisMode,
      files,
      configFiles,
    } = await req.json();

    let issues = await analyzeCode(code, fileName, {
      language,
      framework,
      analysisMode,
    });

    if (Array.isArray(files) && files.length > 0) {
      const inputFiles = files as ScanFileInput[];

      // Project-level optimization: cap file count and file size for predictable latency.
      const MAX_FILES = analysisMode === "quick" ? 40 : 20;
      const MAX_FILE_CHARS = 20000;
      const DETAILED_FILE_BUDGET =
        analysisMode === "deep" ? 3 : analysisMode === "standard" ? 6 : 40;
      const CONCURRENCY = analysisMode === "quick" ? 8 : 4;

      const priorityScore = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("/src/") || lower.startsWith("src/")) return 0;
        if (lower.includes("/app/") || lower.startsWith("app/")) return 1;
        if (lower.includes("/lib/") || lower.startsWith("lib/")) return 2;
        if (lower.includes("/api/") || lower.startsWith("api/")) return 3;
        return 4;
      };

      const candidates = inputFiles
        .filter((f) => f?.name && f?.content)
        .sort((a, b) => {
          const scoreDiff = priorityScore(a.name) - priorityScore(b.name);
          if (scoreDiff !== 0) return scoreDiff;
          return b.content.length - a.content.length;
        })
        .slice(0, MAX_FILES);

      issues = [];

      const runWithConcurrency = async <T>(
        items: T[],
        limit: number,
        worker: (item: T, index: number) => Promise<void>,
      ) => {
        let nextIndex = 0;
        const runners = Array.from(
          { length: Math.min(limit, items.length) },
          () => {
            return (async () => {
              while (true) {
                const current = nextIndex++;
                if (current >= items.length) break;
                await worker(items[current], current);
              }
            })();
          },
        );
        await Promise.all(runners);
      };

      await runWithConcurrency(candidates, CONCURRENCY, async (f, index) => {
        const content =
          f.content.length > MAX_FILE_CHARS
            ? f.content.slice(0, MAX_FILE_CHARS)
            : f.content;

        // Analyze first few important files with requested mode; run quick mode for the rest.
        const perFileMode =
          index < DETAILED_FILE_BUDGET ? analysisMode : "quick";

        const fileIssues = await analyzeCode(content, f.name, {
          language,
          framework,
          analysisMode: perFileMode,
        });
        issues.push(...fileIssues);
      });

      // Keep response payload and DB writes manageable for very large project scans.
      if (issues.length > 500) {
        issues = issues.slice(0, 500);
      }
    }

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
        analysisMode: analysisMode || "STANDARD",
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

    // Check version vulnerabilities if config files provided
    if (configFiles && Array.isArray(configFiles)) {
      for (const configFile of configFiles) {
        const { fileName: cfName, content } = configFile;
        const dependencies = parseConfigFile(cfName, content);

        if (dependencies.length > 0) {
          const vulnerabilities =
            await checkVersionVulnerabilities(dependencies);

          if (vulnerabilities.length > 0) {
            // Store version scan results
            await prisma.versionScan.create({
              data: {
                scanId: scan.id,
                fileType: cfName.split(".").pop() || "config",
                fileName: cfName,
                vulnerabilities: JSON.stringify(vulnerabilities),
              },
            });

            // Add vulnerability count to category summary
            categorySummary["version-vulnerabilities"] =
              (categorySummary["version-vulnerabilities"] || 0) +
              vulnerabilities.length;
          }
        }
      }
    }

    return NextResponse.json({ success: true, scan, categorySummary });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { success: false, error: "Scan failed" },
      { status: 500 },
    );
  }
}
