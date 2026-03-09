"use client";
import { useEffect, useState } from "react";
import styles from "./profile.module.css";
import dashStyles from "../dashboard.module.css";
import {
  IconUser,
  IconMail,
  IconCalendar,
  IconShield,
  IconBarChart,
  IconHistory,
} from "@/app/components/Icons";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface ScanStats {
  totalScans: number;
  avgScore: number;
  totalIssues: number;
  topCategory: string;
  recentScans: {
    projectName: string;
    securityScore: number;
    createdAt: string;
  }[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch("/api/scans").then((r) => r.json()),
    ]).then(([userData, scanData]) => {
      if (userData.user) {
        setUser(userData.user);
        setName(userData.user.name);
        setEmail(userData.user.email);
      }
      const scans = scanData.scans || [];
      const totalScans = scans.length;
      const avgScore =
        totalScans > 0
          ? Math.round(
              scans.reduce(
                (s: number, sc: { securityScore: number }) =>
                  s + sc.securityScore,
                0,
              ) / totalScans,
            )
          : 0;
      const totalIssues = scans.reduce(
        (s: number, sc: { issues?: unknown[] }) => s + (sc.issues?.length || 0),
        0,
      );
      // Top category
      const catCounts: Record<string, number> = {};
      for (const scan of scans) {
        for (const issue of scan.issues || []) {
          const cat =
            (issue as { category?: string }).category || "code-quality";
          catCounts[cat] = (catCounts[cat] || 0) + 1;
        }
      }
      const topCategory =
        Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";
      setStats({
        totalScans,
        avgScore,
        totalIssues,
        topCategory: topCategory
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        recentScans: scans
          .slice(0, 5)
          .map(
            (sc: {
              projectName: string;
              securityScore: number;
              createdAt: string;
            }) => ({
              projectName: sc.projectName,
              securityScore: sc.securityScore,
              createdAt: sc.createdAt,
            }),
          ),
      });
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/auth/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });

    const data = await res.json();

    if (res.ok) {
      setUser({ ...user!, name: data.user.name, email: data.user.email });
      setMessage({ type: "success", text: "Profile updated successfully" });
    } else {
      setMessage({ type: "error", text: data.error });
    }

    setSaving(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "var(--success)";
    if (score >= 50) return "var(--warning)";
    return "var(--danger)";
  };

  if (loading) {
    return <p className={styles.loading}>Loading profile...</p>;
  }

  return (
    <div className={styles.profileContainer}>
      <div className={dashStyles.pageHeader}>
        <h1 className={dashStyles.pageTitle}>Profile</h1>
        <p className={dashStyles.pageDesc}>Manage your account information</p>
      </div>

      {/* Avatar & name card */}
      {user && (
        <div className={styles.profileHero}>
          <div className={styles.avatarLarge}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className={styles.heroInfo}>
            <h2 className={styles.heroName}>{user.name}</h2>
            <div className={styles.heroMeta}>
              <span className={styles.heroMetaItem}>
                <IconMail style={{ width: 13, height: 13 }} /> {user.email}
              </span>
              <span className={styles.heroMetaItem}>
                <IconCalendar style={{ width: 13, height: 13 }} /> Joined{" "}
                {new Date(user.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Scan stats overview */}
      {stats && stats.totalScans > 0 && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <IconBarChart style={{ width: 16, height: 16 }} />
            </div>
            <div className={styles.statData}>
              <span className={styles.statNumber}>{stats.totalScans}</span>
              <span className={styles.statTitle}>Total Scans</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <IconShield style={{ width: 16, height: 16 }} />
            </div>
            <div className={styles.statData}>
              <span
                className={styles.statNumber}
                style={{ color: getScoreColor(stats.avgScore) }}
              >
                {stats.avgScore}
              </span>
              <span className={styles.statTitle}>Avg Score</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <IconHistory style={{ width: 16, height: 16 }} />
            </div>
            <div className={styles.statData}>
              <span className={styles.statNumber}>{stats.totalIssues}</span>
              <span className={styles.statTitle}>Issues Found</span>
            </div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <IconUser style={{ width: 16, height: 16 }} />
            </div>
            <div className={styles.statData}>
              <span className={styles.statNumber}>{stats.topCategory}</span>
              <span className={styles.statTitle}>Top Category</span>
            </div>
          </div>
        </div>
      )}

      {/* Recent activity */}
      {stats && stats.recentScans.length > 0 && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Recent Activity</h2>
          {stats.recentScans.map((scan, i) => (
            <div key={i} className={styles.activityRow}>
              <span className={styles.activityProject}>{scan.projectName}</span>
              <span
                className={styles.activityScore}
                style={{ color: getScoreColor(scan.securityScore) }}
              >
                {scan.securityScore}/100
              </span>
              <span className={styles.activityDate}>
                {new Date(scan.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className={styles.card}>
        <h2 className={styles.cardTitle}>Personal Information</h2>
        <form className={styles.form} onSubmit={handleSave}>
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
            <label className={styles.label} htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className={styles.input}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button className={styles.saveBtn} type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      {user && (
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Account Details</h2>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Account ID</span>
            <span className={styles.statValue}>{user.id.slice(0, 8)}...</span>
          </div>
          <div className={styles.statRow}>
            <span className={styles.statLabel}>Member since</span>
            <span className={styles.statValue}>
              {new Date(user.createdAt).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
