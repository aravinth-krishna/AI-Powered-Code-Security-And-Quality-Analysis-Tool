"use client";
import { useEffect, useState } from "react";
import styles from "../profile/profile.module.css";
import dashStyles from "../dashboard.module.css";
import {
  IconKey,
  IconBarChart,
  IconTool,
  IconTrash,
  IconDownload,
} from "@/app/components/Icons";

interface ScanData {
  id: string;
  projectName: string;
  securityScore: number;
  createdAt: string;
  issues: { id: string; category?: string; severity?: string }[];
}

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [scans, setScans] = useState<ScanData[]>([]);
  const [defaultLang, setDefaultLang] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("cs_defaultLang") || "Java"
      : "Java",
  );
  const [defaultMode, setDefaultMode] = useState(() =>
    typeof window !== "undefined"
      ? localStorage.getItem("cs_defaultMode") || "standard"
      : "standard",
  );
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/scans")
      .then((res) => res.json())
      .then((data) => setScans(data.scans || []));
  }, []);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match" });
      return;
    }

    setSaving(true);

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();

    if (res.ok) {
      setMessage({ type: "success", text: "Password changed successfully" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMessage({ type: "error", text: data.error });
    }

    setSaving(false);
  };

  const savePref = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const exportAllData = () => {
    const blob = new Blob([JSON.stringify(scans, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `code-sight-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteAllScans = async () => {
    setDeleting(true);
    for (const scan of scans) {
      await fetch(`/api/scans/${scan.id}`, { method: "DELETE" });
    }
    setScans([]);
    setDeleteConfirm(false);
    setDeleting(false);
  };

  // Stats
  const totalIssues = scans.reduce((s, sc) => s + (sc.issues?.length || 0), 0);
  const avgScore =
    scans.length > 0
      ? Math.round(
          scans.reduce((s, sc) => s + sc.securityScore, 0) / scans.length,
        )
      : 0;
  const severityCounts: Record<string, number> = {};
  for (const scan of scans) {
    for (const issue of scan.issues || []) {
      const sev = issue.severity?.toUpperCase() || "MEDIUM";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
  }

  return (
    <div className={styles.profileContainer}>
      <div className={dashStyles.pageHeader}>
        <h1 className={dashStyles.pageTitle}>Settings</h1>
        <p className={dashStyles.pageDesc}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Password */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <IconKey
            style={{ width: 15, height: 15, verticalAlign: "-0.125em" }}
          />{" "}
          Change Password
        </h2>
        <form className={styles.form} onSubmit={handleChangePassword}>
          {message && (
            <div
              className={
                message.type === "success" ? styles.success : styles.error
              }
            >
              {message.text}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="currentPassword">
              Current Password
            </label>
            <input
              id="currentPassword"
              className={styles.input}
              type="password"
              placeholder="Enter current password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="newPassword">
              New Password
            </label>
            <input
              id="newPassword"
              className={styles.input}
              type="password"
              placeholder="At least 8 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="confirmPassword">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              placeholder="Repeat new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <button className={styles.saveBtn} type="submit" disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Preferences */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <IconTool
            style={{ width: 15, height: 15, verticalAlign: "-0.125em" }}
          />{" "}
          Preferences
        </h2>
        <div className={styles.form}>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="defaultLang">
              Default Language
            </label>
            <select
              id="defaultLang"
              className={styles.input}
              value={defaultLang}
              onChange={(e) => {
                setDefaultLang(e.target.value);
                savePref("cs_defaultLang", e.target.value);
              }}
            >
              {[
                "Java",
                "JavaScript",
                "TypeScript",
                "Python",
                "C/C++",
                "Go",
                "Rust",
                "PHP",
              ].map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="defaultMode">
              Default Analysis Mode
            </label>
            <select
              id="defaultMode"
              className={styles.input}
              value={defaultMode}
              onChange={(e) => {
                setDefaultMode(e.target.value);
                savePref("cs_defaultMode", e.target.value);
              }}
            >
              <option value="quick">Quick Scan</option>
              <option value="standard">Standard</option>
              <option value="deep">Deep Analysis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>
          <IconBarChart
            style={{ width: 15, height: 15, verticalAlign: "-0.125em" }}
          />{" "}
          Usage Statistics
        </h2>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Total scans</span>
          <span className={styles.statValue}>{scans.length}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Total issues found</span>
          <span className={styles.statValue}>{totalIssues}</span>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Average score</span>
          <span className={styles.statValue}>
            {scans.length > 0 ? `${avgScore}/100` : "—"}
          </span>
        </div>
        {Object.keys(severityCounts).length > 0 && (
          <>
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
              (sev) =>
                severityCounts[sev] && (
                  <div key={sev} className={styles.statRow}>
                    <span className={styles.statLabel}>
                      {sev.charAt(0) + sev.slice(1).toLowerCase()} issues
                    </span>
                    <span className={styles.statValue}>
                      {severityCounts[sev]}
                    </span>
                  </div>
                ),
            )}
          </>
        )}
      </div>

      {/* Data Management */}
      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Data Management</h2>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>Export all scan data as JSON</span>
          <button
            type="button"
            className={styles.saveBtn}
            style={{
              alignSelf: "center",
              padding: "0.4rem 1rem",
              fontSize: "0.78rem",
            }}
            onClick={exportAllData}
            disabled={scans.length === 0}
          >
            <IconDownload
              style={{ width: 13, height: 13, verticalAlign: "-0.125em" }}
            />{" "}
            Export
          </button>
        </div>
        <div className={styles.statRow}>
          <span className={styles.statLabel}>
            Delete all scan history ({scans.length} scans)
          </span>
          {!deleteConfirm ? (
            <button
              type="button"
              className={styles.saveBtn}
              style={{
                alignSelf: "center",
                padding: "0.4rem 1rem",
                fontSize: "0.78rem",
                background: "rgba(239,68,68,0.12)",
                color: "var(--danger)",
              }}
              onClick={() => setDeleteConfirm(true)}
              disabled={scans.length === 0}
            >
              <IconTrash
                style={{ width: 13, height: 13, verticalAlign: "-0.125em" }}
              />{" "}
              Delete All
            </button>
          ) : (
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button
                type="button"
                className={styles.saveBtn}
                style={{
                  padding: "0.4rem 1rem",
                  fontSize: "0.78rem",
                  background: "var(--danger)",
                }}
                onClick={deleteAllScans}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Confirm Delete"}
              </button>
              <button
                type="button"
                className={styles.saveBtn}
                style={{
                  padding: "0.4rem 1rem",
                  fontSize: "0.78rem",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-color)",
                  color: "var(--text-secondary)",
                }}
                onClick={() => setDeleteConfirm(false)}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
