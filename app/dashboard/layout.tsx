"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import styles from "./dashboard.module.css";
import {
  IconScan,
  IconHistory,
  IconUser,
  IconSettings,
  IconLogOut,
  IconLogo,
} from "@/app/components/Icons";

interface UserData {
  id: string;
  name: string;
  email: string;
}

const navItems = [
  { href: "/dashboard", label: "Scanner", icon: <IconScan /> },
  { href: "/dashboard/history", label: "History", icon: <IconHistory /> },
  { href: "/dashboard/profile", label: "Profile", icon: <IconUser /> },
  { href: "/dashboard/settings", label: "Settings", icon: <IconSettings /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setUser(data.user))
      .catch(() => router.push("/signin"));
  }, [router]);

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/");
  };

  if (!user) {
    return (
      <div className={styles.dashLayout}>
        <div className={styles.mainContent} style={{ marginLeft: 0 }}>
          <p style={{ color: "var(--text-muted)", padding: "2rem" }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashLayout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarLogo}>
          <IconLogo style={{ width: 20, height: 20, color: "var(--accent)" }} />
          <span>Code Sight</span>
        </div>
        <nav className={styles.sidebarNav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.sidebarLink} ${pathname === item.href ? styles.sidebarLinkActive : ""}`}
            >
              <span className={styles.sidebarIcon}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className={styles.sidebarBottom}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.userName}>{user.name}</div>
              <div className={styles.userEmail}>{user.email}</div>
            </div>
          </div>
          <button className={styles.signOutBtn} onClick={handleSignOut}>
            <span className={styles.sidebarIcon}>
              <IconLogOut />
            </span>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
