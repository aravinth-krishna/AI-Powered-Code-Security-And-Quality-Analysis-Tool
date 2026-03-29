/**
 * Export utilities for code scanning reports
 * Supports CSV and PDF formats
 */

interface ScanData {
  id: string;
  projectName: string;
  securityScore: number;
  analysisMode: string;
  createdAt: Date | string;
  issues: IssueData[];
}

interface IssueData {
  id: string;
  fileName: string;
  lineNumber: number;
  issueType: string;
  severity: string;
  category: string;
  description: string;
  aiExplanation?: string | null;
  aiFixSnippet?: string | null;
  status?: string;
}

/**
 * Export scan to CSV format
 * Returns CSV string compatible with Excel/Google Sheets
 */
export function exportToCSV(scan: ScanData): string {
  const headers = [
    "Issue ID",
    "File Name",
    "Line Number",
    "Issue Type",
    "Severity",
    "Category",
    "Description",
    "AI Explanation",
    "Status",
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => `"${h}"`).join(","));

  for (const issue of scan.issues) {
    const row = [
      `"${issue.id}"`,
      `"${issue.fileName}"`,
      issue.lineNumber.toString(),
      `"${issue.issueType}"`,
      `"${issue.severity}"`,
      `"${issue.category}"`,
      `"${escapeCSV(issue.description)}"`,
      `"${escapeCSV(issue.aiExplanation || "")}"`,
      `"${issue.status || "OPEN"}"`,
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Export scan to HTML format ready for PDF conversion
 * Can be used with html2pdf library
 */
export function exportToHTML(scan: ScanData): string {
  const date = new Date(scan.createdAt).toLocaleDateString();
  const modeLabel =
    scan.analysisMode === "QUICK"
      ? "Quick Scan (Security)"
      : scan.analysisMode === "STANDARD"
        ? "Standard Scan (Security + Performance)"
        : "Deep Analysis (All Categories)";

  const issueSummary = summarizeIssuesByCategory(scan.issues);
  const severitySummary = summarizeIssuesBySeverity(scan.issues);

  let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Code Scan Report - ${scan.projectName}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      max-width: 900px;
      margin: 0 auto;
      padding: 20px;
      background: #f5f5f5;
      color: #333;
    }
    .header {
      background: #2c3e50;
      color: white;
      padding: 30px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .header h1 {
      margin: 0 0 10px 0;
      font-size: 28px;
    }
    .header p {
      margin: 5px 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin-bottom: 30px;
    }
    .summary-card {
      background: white;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #3498db;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-card h3 {
      margin: 0;
      font-size: 12px;
      text-transform: uppercase;
      color: #999;
      font-weight: 600;
    }
    .summary-card .value {
      font-size: 28px;
      font-weight: bold;
      color: #2c3e50;
      margin-top: 8px;
    }
    .critical { border-left-color: #e74c3c; }
    .critical .value { color: #e74c3c; }
    .high { border-left-color: #e67e22; }
    .high .value { color: #e67e22; }
    .medium { border-left-color: #f39c12; }
    .medium .value { color: #f39c12; }
    .low { border-left-color: #27ae60; }
    .low .value { color: #27ae60; }
    
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      color: #2c3e50;
      border-bottom: 2px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    
    .issue {
      background: white;
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid #3498db;
      page-break-inside: avoid;
    }
    .issue.critical { border-left-color: #e74c3c; }
    .issue.high { border-left-color: #e67e22; }
    .issue.medium { border-left-color: #f39c12; }
    .issue.low { border-left-color: #27ae60; }
    
    .issue-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 10px;
    }
    .issue-type {
      font-weight: 600;
      color: #2c3e50;
      font-size: 16px;
    }
    .severity-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: white;
    }
    .severity-badge.critical { background: #e74c3c; }
    .severity-badge.high { background: #e67e22; }
    .severity-badge.medium { background: #f39c12; color: black; }
    .severity-badge.low { background: #27ae60; }
    
    .issue-location {
      font-size: 13px;
      color: #666;
      margin-bottom: 8px;
    }
    .issue-description {
      font-size: 14px;
      line-height: 1.5;
      color: #555;
      margin-bottom: 8px;
    }
    .issue-explanation {
      background: #ecf0f1;
      padding: 10px;
      border-radius: 4px;
      font-size: 13px;
      font-style: italic;
      margin-bottom: 8px;
    }
    .category-tag {
      display: inline-block;
      background: #ecf0f1;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: #666;
      margin-right: 8px;
    }
    
    @media print {
      body { background: white; }
      .issue { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Code Scan Report</h1>
    <p><strong>Project:</strong> ${escape(scan.projectName)}</p>
    <p><strong>Scan Mode:</strong> ${modeLabel}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Security Score:</strong> <span style="font-size: 24px; font-weight: bold;">${scan.securityScore}/100</span></p>
  </div>

  <div class="summary">
    <div class="summary-card">
      <h3>Total Issues</h3>
      <div class="value">${scan.issues.length}</div>
    </div>
    ${Object.entries(severitySummary)
      .map(
        ([severity, count]) => `
    <div class="summary-card ${severity.toLowerCase()}">
      <h3>${severity}</h3>
      <div class="value">${count}</div>
    </div>
    `,
      )
      .join("")}
  </div>

  <div class="section">
    <h2>Issue Summary by Category</h2>
    ${Object.entries(issueSummary)
      .map(
        ([category, count]) => `
      <p style="margin: 8px 0;"><strong>${capitalizeCategory(category)}:</strong> ${count} issue${count !== 1 ? "s" : ""}</p>
    `,
      )
      .join("")}
  </div>

  <div class="section">
    <h2>Detailed Issues</h2>
    ${scan.issues
      .map((issue, idx) => {
        const severityClass = issue.severity.toLowerCase();
        return `
      <div class="issue ${severityClass}">
        <div class="issue-header">
          <div class="issue-type">${escape(issue.issueType)}</div>
          <span class="severity-badge ${severityClass}">${issue.severity}</span>
        </div>
        <div class="issue-location">
          <strong>${escape(issue.fileName)}</strong> at line ${issue.lineNumber}
        </div>
        <div class="category-tag">${capitalizeCategory(issue.category)}</div>
        <div class="issue-description">${escape(issue.description)}</div>
        ${issue.aiExplanation ? `<div class="issue-explanation"><strong>AI Analysis:</strong> ${escape(issue.aiExplanation)}</div>` : ""}
      </div>
      `;
      })
      .join("")}
  </div>

  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #999; font-size: 12px;">
    <p>Report generated on ${new Date().toLocaleString()}</p>
    <p>Code-Sight Security Scanner Report</p>
  </div>
</body>
</html>
  `;

  return html;
}

/**
 * Download helper functions
 */
export function downloadCSV(scan: ScanData): void {
  const csv = exportToCSV(scan);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  const fileName = `${sanitizeFileName(scan.projectName)}_${scan.analysisMode.toUpperCase()}_${new Date().toISOString().split("T")[0]}.csv`;
  link.setAttribute("href", url);
  link.setAttribute("download", fileName);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadPDF(scan: ScanData): void {
  const html = exportToHTML(scan);
  const blob = new Blob([html], { type: "text/html;charset=utf-8;" });

  // For PDF, we'll use a simple approach: open in new window and let user print to PDF
  // Or we can use html2pdf library if installed
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");

  if (printWindow) {
    printWindow.addEventListener("load", () => {
      printWindow.print();
    });
  }
}

// Helper functions

function escapeCSV(str: string): string {
  if (!str) return "";
  // Escape double quotes by doubling them
  return (str || "").replace(/"/g, '""');
}

function escape(str: string): string {
  if (!str) return "";
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

function capitalizeCategory(category: string): string {
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function summarizeIssuesByCategory(
  issues: IssueData[],
): Record<string, number> {
  const summary: Record<string, number> = {};
  for (const issue of issues) {
    summary[issue.category] = (summary[issue.category] || 0) + 1;
  }
  return summary;
}

function summarizeIssuesBySeverity(
  issues: IssueData[],
): Record<string, number> {
  const summary: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };
  for (const issue of issues) {
    if (summary.hasOwnProperty(issue.severity)) {
      summary[issue.severity]++;
    }
  }
  // Only return severities with issues
  return Object.fromEntries(
    Object.entries(summary).filter(([, count]) => count > 0),
  );
}
