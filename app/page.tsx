import Link from "next/link";
import styles from "./page.module.css";
import {
  IconSearch,
  IconZap,
  IconBarChart,
  IconTarget,
  IconCode,
  IconBookOpen,
  IconLogo,
} from "@/app/components/Icons";

export default function LandingPage() {
  return (
    <div className={styles.landing}>
      {/* ── Nav ── */}
      <nav className={styles.nav}>
        <span className={styles.logo}>
          <IconLogo style={{ width: 22, height: 22, color: "var(--accent)" }} />
          <span>Code Sight</span>
        </span>
        <div className={styles.navLinks}>
          <Link href="/signin" className={styles.navLink}>
            Sign In
          </Link>
          <Link href="/signup" className={styles.navCta}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroBadge}>AI-Powered Security Scanner</div>
        <h1 className={styles.heroTitle}>
          Find vulnerabilities
          <br />
          <span className={styles.heroAccent}>before attackers do</span>
        </h1>
        <p className={styles.heroSub}>
          Paste your code, pick your language, and get an instant AI-powered
          security audit with actionable fixes — all in your browser.
        </p>
        <div className={styles.heroActions}>
          <Link href="/signup" className={styles.ctaPrimary}>
            Start Scanning Free &rarr;
          </Link>
          <Link href="/signin" className={styles.ctaSecondary}>
            Sign In
          </Link>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>10+</span>
          <span className={styles.statLabel}>Vulnerability Rules</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNumber}>8</span>
          <span className={styles.statLabel}>Languages Supported</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNumber}>3</span>
          <span className={styles.statLabel}>Analysis Modes</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statNumber}>AI</span>
          <span className={styles.statLabel}>Powered Fixes</span>
        </div>
      </section>

      {/* ── Code Preview ── */}
      <section className={styles.previewSection}>
        <div className={styles.previewWindow}>
          <div className={styles.previewHeader}>
            <div className={styles.previewDots}>
              <span className={styles.dotRed} />
              <span className={styles.dotYellow} />
              <span className={styles.dotGreen} />
            </div>
            <span className={styles.previewTitle}>scan-result.json</span>
          </div>
          <pre className={styles.previewCode}>{`{
  "securityScore": 70,
  "issues": [
    {
      "type": "SQL_INJECTION",
      "severity": "HIGH",
      "line": 23,
      "fix": "Use parameterized queries instead"
    },
    {
      "type": "HARDCODED_SECRET",
      "severity": "HIGH",
      "line": 8,
      "fix": "Move secrets to environment variables"
    }
  ]
}`}</pre>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <h2 className={styles.sectionTitle}>
          Everything you need to ship secure code
        </h2>
        <p className={styles.sectionSub}>
          A complete security toolkit — from quick regex checks to deep
          AI-driven audits.
        </p>
        <div className={styles.featureGrid}>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconSearch />
            </div>
            <h3 className={styles.featureTitle}>Smart Detection</h3>
            <p className={styles.featureDesc}>
              Static regex analysis combined with LLM intelligence to catch real
              vulnerabilities, not just patterns.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconZap />
            </div>
            <h3 className={styles.featureTitle}>Instant AI Fixes</h3>
            <p className={styles.featureDesc}>
              Every issue comes with an AI-generated explanation and a
              ready-to-use fix snippet.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconBarChart />
            </div>
            <h3 className={styles.featureTitle}>Security Score</h3>
            <p className={styles.featureDesc}>
              Get a clear security score for every scan. Track your progress
              over time.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconTarget />
            </div>
            <h3 className={styles.featureTitle}>Deep Analysis</h3>
            <p className={styles.featureDesc}>
              Go beyond pattern matching — our deep mode performs a full
              AI-driven security audit.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconCode />
            </div>
            <h3 className={styles.featureTitle}>Multi-Language</h3>
            <p className={styles.featureDesc}>
              Supports Java, JavaScript, TypeScript, Python, C++, Go, Rust, PHP,
              and more.
            </p>
          </div>
          <div className={styles.feature}>
            <div className={styles.featureIcon}>
              <IconBookOpen />
            </div>
            <h3 className={styles.featureTitle}>Scan History</h3>
            <p className={styles.featureDesc}>
              Every scan is saved so you can track improvements and revisit past
              findings.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it works</h2>
        <p className={styles.sectionSub}>Three steps to more secure code.</p>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <h3 className={styles.stepTitle}>Paste your code</h3>
            <p className={styles.stepDesc}>
              Drop your code into our VS Code-like editor. Pick your language
              and framework.
            </p>
          </div>
          <div className={styles.stepArrow}>&rarr;</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <h3 className={styles.stepTitle}>Choose analysis depth</h3>
            <p className={styles.stepDesc}>
              Quick regex scan, standard AI-enriched check, or deep full-audit
              mode.
            </p>
          </div>
          <div className={styles.stepArrow}>&rarr;</div>
          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <h3 className={styles.stepTitle}>Get fixes instantly</h3>
            <p className={styles.stepDesc}>
              Review findings with explanations and copy-paste the AI-generated
              fixes.
            </p>
          </div>
        </div>
      </section>

      {/* ── Languages ── */}
      <section className={styles.languages}>
        <h2 className={styles.sectionTitle}>Works with your stack</h2>
        <p className={styles.sectionSub}>
          Support for popular languages and frameworks.
        </p>
        <div className={styles.langGrid}>
          {[
            "Java",
            "JavaScript",
            "TypeScript",
            "Python",
            "C / C++",
            "Go",
            "Rust",
            "PHP",
          ].map((lang) => (
            <div key={lang} className={styles.langChip}>
              {lang}
            </div>
          ))}
        </div>
        <div className={styles.langGrid} style={{ marginTop: "0.5rem" }}>
          {[
            "Spring Boot",
            "React",
            "Next.js",
            "Django",
            "Express",
            "Gin",
            "Laravel",
          ].map((fw) => (
            <div key={fw} className={styles.fwChip}>
              {fw}
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className={styles.cta}>
        <h2 className={styles.ctaTitle}>Ready to secure your code?</h2>
        <p className={styles.ctaSub}>
          Free to use. No credit card required. Start scanning in seconds.
        </p>
        <Link href="/signup" className={styles.ctaPrimary}>
          Get Started Free &rarr;
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <p>
          &copy; 2025 Code Sight. Built for developers who care about security.
        </p>
      </footer>
    </div>
  );
}
