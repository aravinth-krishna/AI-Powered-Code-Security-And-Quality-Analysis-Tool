"use client";
import { useEffect, useState } from "react";
import styles from "./history.module.css";
import dashStyles from "../dashboard.module.css";
import {
  IconArrowLeft,
  IconTrash,
  IconLock,
  IconCpu,
  IconDatabase,
  IconCheckCircle,
  IconAlertTriangle,
  IconTool,
  IconClipboard,
  IconDownload,
  IconChevronDown,
  IconChevronRight,
} from "@/app/components/Icons";

interface Issue {
  id: string;
  issueType: string;
  severity: string;
  category: string;
  description: string;
  fileName: string;
  lineNumber: number;
  snippet: string;
  aiExplanation?: string;
  aiFixSnippet?: string;
}

interface Scan {
  id: string;
  projectName: string;
  securityScore: number;
  status: string;
  createdAt: string;
  issues: Issue[];
}

const CATEGORY_META: Record<
  string,
  { label: string; icon: React.ReactNode; cssClass: string }
> = {
  security: {
    label: "Security",
    icon: <IconLock style={{ width: 14, height: 14 }} />,
    cssClass: "security",
  },
  performance: {
    label: "Performance",
    icon: <IconCpu style={{ width: 14, height: 14 }} />,
    cssClass: "performance",
  },
  memory: {
    label: "Memory",
    icon: <IconDatabase style={{ width: 14, height: 14 }} />,
    cssClass: "memory",
  },
  "best-practice": {
    label: "Best Practices",
    icon: <IconCheckCircle style={{ width: 14, height: 14 }} />,
    cssClass: "bestPractice",
  },
  "error-handling": {
    label: "Error Handling",
    icon: <IconAlertTriangle style={{ width: 14, height: 14 }} />,
    cssClass: "errorHandling",
  },
  "code-quality": {
    label: "Code Quality",
    icon: <IconTool style={{ width: 14, height: 14 }} />,
    cssClass: "codeQuality",
  },
};

export default function HistoryPage() {
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState<Scan | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );

  const fetchScans = () => {
    fetch("/api/scans")
      .then((res) => res.json())
      .then((data) => setScans(data.scans || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchScans();
  }, []);

  const openScan = async (id: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/scans/${encodeURIComponent(id)}`);
    const data = await res.json();
    setSelectedScan(data.scan);
    setActiveFilter("all");
    setDetailLoading(false);
  };

  const deleteScan = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this scan?")) return;
    await fetch(`/api/scans/${encodeURIComponent(id)}`, { method: "DELETE" });
    setScans((prev) => prev.filter((s) => s.id !== id));
    if (selectedScan?.id === id) setSelectedScan(null);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const exportScan = (scan: Scan) => {
    const data = JSON.stringify(scan, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${scan.projectName.replace(/\s+/g, "_")}_scan.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return styles.scoreHigh;
    if (score >= 50) return styles.scoreMedium;
    return styles.scoreLow;
  };

  const getSeverityClass = (severity: string) => {
    const s = severity?.toLowerCase();
    if (s === "critical") return styles.severityCritical;
    if (s === "high") return styles.severityHigh;
    if (s === "medium") return styles.severityMedium;
    return styles.severityLow;
  };

  // Detail view
  if (selectedScan) {
    const categoryCounts: Record<string, number> = {};
    for (const issue of selectedScan.issues) {
      const cat = issue.category || "code-quality";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }

    return (
      <div>
        <div className={styles.detailHeader}>
          <button
            className={styles.backBtn}
            onClick={() => setSelectedScan(null)}
            type="button"
          >
            <IconArrowLeft style={{ width: 16, height: 16 }} /> Back to History
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => exportScan(selectedScan)}
            type="button"
          >
            <IconDownload style={{ width: 14, height: 14 }} /> Export JSON
          </button>
        </div>

        <div className={styles.detailTitle}>
          <h1 className={dashStyles.pageTitle}>{selectedScan.projectName}</h1>
          <span
            className={`${styles.scanScore} ${getScoreClass(selectedScan.securityScore)}`}
          >
            {selectedScan.securityScore}/100
          </span>
        </div>

        <div className={styles.detailMeta}>
          <span>
            {new Date(selectedScan.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <span>·</span>
          <span>
            {selectedScan.issues.length} issue
            {selectedScan.issues.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Category summary */}
        {selectedScan.issues.length > 0 && (
          <>
            <div className={styles.categorySummary}>
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const meta =
                  CATEGORY_META[cat] || CATEGORY_META["code-quality"];
                return (
                  <div key={cat} className={styles.categorySummaryCard}>
                    <div
                      className={`${styles.catIcon} ${styles[meta.cssClass]}`}
                    >
                      {meta.icon}
                    </div>
                    <div className={styles.catInfo}>
                      <span className={styles.catCount}>{count}</span>
                      <span className={styles.catLabel}>{meta.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${activeFilter === "all" ? styles.filterTabActive : ""}`}
                onClick={() => setActiveFilter("all")}
                type="button"
              >
                All ({selectedScan.issues.length})
              </button>
              {Object.entries(categoryCounts).map(([cat, count]) => {
                const meta =
                  CATEGORY_META[cat] || CATEGORY_META["code-quality"];
                return (
                  <button
                    key={cat}
                    className={`${styles.filterTab} ${activeFilter === cat ? styles.filterTabActive : ""}`}
                    onClick={() => setActiveFilter(cat)}
                    type="button"
                  >
                    {meta.icon} {meta.label} ({count})
                  </button>
                );
              })}
            </div>
          </>
        )}

        {selectedScan.issues.length === 0 ? (
          <div className={styles.noIssues}>
            <IconCheckCircle
              style={{ width: 20, height: 20, color: "var(--success)" }}
            />
            No issues found — code was clean!
          </div>
        ) : (
          (() => {
            const ALL_CATS = [
              "security",
              "performance",
              "memory",
              "best-practice",
              "error-handling",
              "code-quality",
            ];
            const categoriesToShow =
              activeFilter === "all"
                ? ALL_CATS.filter((c) => categoryCounts[c])
                : [activeFilter];
            return categoriesToShow.map((cat) => {
              const meta = CATEGORY_META[cat] || CATEGORY_META["code-quality"];
              const catIssues = selectedScan.issues.filter(
                (i) => (i.category || "code-quality") === cat,
              );
              if (catIssues.length === 0) return null;
              const isCollapsed = collapsedCategories.has(cat);
              return (
                <div key={cat} className={styles.issueGroup}>
                  <button
                    type="button"
                    className={styles.issueGroupHeader}
                    onClick={() =>
                      setCollapsedCategories((prev) => {
                        const next = new Set(prev);
                        if (next.has(cat)) next.delete(cat);
                        else next.add(cat);
                        return next;
                      })
                    }
                  >
                    <span className={styles.issueGroupChevron}>
                      {isCollapsed ? (
                        <IconChevronRight style={{ width: 14, height: 14 }} />
                      ) : (
                        <IconChevronDown style={{ width: 14, height: 14 }} />
                      )}
                    </span>
                    <span
                      className={`${styles.issueGroupIcon} ${styles[meta.cssClass]}`}
                    >
                      {meta.icon}
                    </span>
                    <span className={styles.issueGroupTitle}>{meta.label}</span>
                    <span className={styles.issueGroupCount}>
                      {catIssues.length}
                    </span>
                  </button>
                  {!isCollapsed && (
                    <div className={styles.issueGroupBody}>
                      {catIssues.map((issue) => {
                        const isExpanded = expandedIssues.has(issue.id);
                        return (
                          <div
                            key={issue.id}
                            className={`${styles.issueRow} ${isExpanded ? styles.issueRowExpanded : ""}`}
                          >
                            <button
                              type="button"
                              className={styles.issueRowHeader}
                              onClick={() =>
                                setExpandedIssues((prev) => {
                                  const next = new Set(prev);
                                  if (next.has(issue.id)) next.delete(issue.id);
                                  else next.add(issue.id);
                                  return next;
                                })
                              }
                            >
                              <span className={styles.issueRowChevron}>
                                {isExpanded ? (
                                  <IconChevronDown
                                    style={{ width: 12, height: 12 }}
                                  />
                                ) : (
                                  <IconChevronRight
                                    style={{ width: 12, height: 12 }}
                                  />
                                )}
                              </span>
                              <span
                                className={`${styles.severityDotInline} ${getSeverityClass(issue.severity)}`}
                              />
                              <span className={styles.issueRowType}>
                                {issue.issueType}
                              </span>
                              <span className={styles.issueRowDesc}>
                                {issue.description}
                              </span>
                              <span
                                className={`${styles.severityBadge} ${getSeverityClass(issue.severity)}`}
                              >
                                {issue.severity}
                              </span>
                              <span className={styles.issueRowLocation}>
                                L{issue.lineNumber}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className={styles.issueRowDetail}>
                                <p className={styles.issueLocation}>
                                  {issue.fileName} · Line {issue.lineNumber}
                                </p>
                                <div className={styles.codeBlock}>
                                  <pre>{issue.snippet}</pre>
                                </div>
                                {issue.aiExplanation && (
                                  <p className={styles.issueExplanation}>
                                    {issue.aiExplanation}
                                  </p>
                                )}
                                {issue.aiFixSnippet && (
                                  <>
                                    <p className={styles.fixLabel}>
                                      Suggested Fix
                                    </p>
                                    <div className={styles.codeBlock}>
                                      <pre>{issue.aiFixSnippet}</pre>
                                    </div>
                                    <button
                                      type="button"
                                      className={styles.copyFixBtn}
                                      onClick={() =>
                                        handleCopy(
                                          issue.aiFixSnippet!,
                                          issue.id,
                                        )
                                      }
                                    >
                                      <IconClipboard
                                        style={{ width: 12, height: 12 }}
                                      />{" "}
                                      {copiedId === issue.id
                                        ? "Copied!"
                                        : "Copy fix"}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>
    );
  }

  // List view
  return (
    <div>
      <div className={dashStyles.pageHeader}>
        <h1 className={dashStyles.pageTitle}>Scan History</h1>
        <p className={dashStyles.pageDesc}>
          View and explore your previous code analyses
        </p>
      </div>

      {loading || detailLoading ? (
        <p className={styles.loading}>Loading...</p>
      ) : scans.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <IconClipboard style={{ width: 32, height: 32 }} />
          </div>
          <div className={styles.emptyTitle}>No scans yet</div>
          <p>Run your first scan from the Scanner page.</p>
        </div>
      ) : (
        <div className={styles.historyList}>
          {scans.map((scan) => (
            <div
              key={scan.id}
              className={styles.scanCard}
              onClick={() => openScan(scan.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && openScan(scan.id)}
            >
              <div className={styles.scanCardTop}>
                <span className={styles.scanProject}>{scan.projectName}</span>
                <div className={styles.scanCardActions}>
                  <span
                    className={`${styles.scanScore} ${getScoreClass(scan.securityScore)}`}
                  >
                    {scan.securityScore}/100
                  </span>
                  <button
                    className={styles.deleteBtn}
                    onClick={(e) => deleteScan(scan.id, e)}
                    type="button"
                    title="Delete scan"
                  >
                    <IconTrash style={{ width: 14, height: 14 }} />
                  </button>
                </div>
              </div>
              <div className={styles.scanMeta}>
                <span>
                  {new Date(scan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className={styles.scanIssueCount}>
                  {scan.issues.length === 0
                    ? "No issues"
                    : `${scan.issues.length} issue${scan.issues.length > 1 ? "s" : ""}`}
                </span>
                <span>{scan.status}</span>
              </div>
              {/* Mini category breakdown */}
              {scan.issues.length > 0 && (
                <div className={styles.scanCategoryPills}>
                  {Object.entries(
                    scan.issues.reduce(
                      (acc: Record<string, number>, i) => {
                        const c = i.category || "security";
                        acc[c] = (acc[c] || 0) + 1;
                        return acc;
                      },
                      {} as Record<string, number>,
                    ),
                  ).map(([cat, count]) => {
                    const meta = CATEGORY_META[cat];
                    return meta ? (
                      <span
                        key={cat}
                        className={`${styles.miniPill} ${styles[meta.cssClass]}`}
                      >
                        {meta.icon} {count}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
