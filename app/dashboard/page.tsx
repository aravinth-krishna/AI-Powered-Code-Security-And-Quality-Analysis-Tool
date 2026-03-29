"use client";
import { useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import styles from "./scanner.module.css";
import dashStyles from "./dashboard.module.css";
import { downloadCSV, downloadPDF } from "@/lib/export";
import { FileTree, FileNode } from "@/app/components/FileTree";
import {
  IconZap,
  IconShield,
  IconMicroscope,
  IconCheckCircle,
  IconPlay,
  IconLock,
  IconCpu,
  IconDatabase,
  IconAlertTriangle,
  IconTool,
  IconClipboard,
  IconUpload,
  IconGithub,
  IconMaximize,
  IconMinimize,
  IconCode,
  IconFile,
  IconChevronDown,
  IconChevronRight,
} from "@/app/components/Icons";

const CodeEditor = dynamic(() => import("@/app/components/CodeEditor"), {
  ssr: false,
  loading: () => (
    <div className={styles.editorPlaceholder}>Loading editor...</div>
  ),
});

type InputMode = "editor" | "upload" | "github";
type ScanScope = "file" | "project";

type IssueCategory =
  | "security"
  | "performance"
  | "memory"
  | "best-practice"
  | "error-handling"
  | "code-quality";

interface Issue {
  id: string;
  issueType: string;
  severity: string;
  category: IssueCategory;
  description: string;
  fileName: string;
  lineNumber: number;
  snippet: string;
  aiExplanation?: string;
  aiFixSnippet?: string;
  status?: "OPEN" | "FIXED" | "IGNORED";
}

interface ScanResult {
  id: string;
  projectName: string;
  createdAt: string;
  analysisMode?: string;
  securityScore: number;
  issues: Issue[];
}

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

interface ScanContext {
  language: string;
  framework: string;
  analysisMode: string;
  fileName: string;
  scanScope: ScanScope;
  scannedFilesCount: number;
}

const LANGUAGES = [
  "Java",
  "JavaScript",
  "TypeScript",
  "Python",
  "C/C++",
  "Go",
  "Rust",
  "PHP",
];

const FRAMEWORKS: Record<string, string[]> = {
  Java: ["Spring Boot", "Jakarta EE", "Micronaut", "Quarkus", "None"],
  JavaScript: [
    "React",
    "Express",
    "Next.js",
    "Vue",
    "Angular",
    "Node.js",
    "None",
  ],
  TypeScript: ["React", "Express", "Next.js", "NestJS", "Angular", "None"],
  Python: ["Django", "Flask", "FastAPI", "None"],
  "C/C++": ["Qt", "Boost", "None"],
  Go: ["Gin", "Echo", "Fiber", "None"],
  Rust: ["Actix", "Rocket", "Axum", "None"],
  PHP: ["Laravel", "Symfony", "None"],
};

const ANALYSIS_MODES = [
  {
    id: "quick",
    label: "Quick Scan",
    desc: "Pattern matching only — fast results",
    icon: <IconZap style={{ width: 20, height: 20 }} />,
  },
  {
    id: "standard",
    label: "Standard",
    desc: "Pattern matching + AI analysis",
    icon: <IconShield style={{ width: 20, height: 20 }} />,
  },
  {
    id: "deep",
    label: "Deep Analysis",
    desc: "Thorough AI audit — security, performance, memory, best practices",
    icon: <IconMicroscope style={{ width: 20, height: 20 }} />,
  },
];

const CATEGORY_META: Record<
  IssueCategory,
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

const ALL_CATEGORIES: IssueCategory[] = [
  "security",
  "performance",
  "memory",
  "best-practice",
  "error-handling",
  "code-quality",
];

const CODE_EXTENSIONS = new Set([
  "java",
  "js",
  "jsx",
  "ts",
  "tsx",
  "py",
  "c",
  "cpp",
  "h",
  "hpp",
  "go",
  "rs",
  "php",
  "rb",
  "cs",
  "swift",
  "kt",
  "scala",
  "sh",
  "bash",
  "sql",
  "html",
  "css",
  "xml",
  "json",
  "yaml",
  "yml",
  "toml",
  "md",
  "txt",
  "cfg",
  "ini",
  "env",
  "gradle",
  "pom",
  "dockerfile",
]);

export default function ScannerPage() {
  const [code, setCode] = useState("");
  const [projectName, setProjectName] = useState("");
  const [fileName, setFileName] = useState("");
  const [language, setLanguage] = useState("Java");
  const [framework, setFramework] = useState("None");
  const [analysisMode, setAnalysisMode] = useState("standard");
  const [scanScope, setScanScope] = useState<ScanScope>("file");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [lastScanContext, setLastScanContext] = useState<ScanContext | null>(
    null,
  );
  const [activeCategory, setActiveCategory] = useState<IssueCategory | "all">(
    "all",
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New state for input modes
  const [inputMode, setInputMode] = useState<InputMode>("editor");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeFileIdx, setActiveFileIdx] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [storedGithubUrl, setStoredGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState("");
  const [expandedIssues, setExpandedIssues] = useState<Set<string>>(new Set());
  const [issueStatuses, setIssueStatuses] = useState<Record<string, string>>(
    {},
  );
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });

  const isCodeFile = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    return CODE_EXTENSIONS.has(ext);
  };

  const getBaseName = (path: string) => path.split("/").pop() || path;

  const isConfigLikeFile = (name: string) => {
    const base = getBaseName(name).toLowerCase();
    return [
      "package.json",
      "requirements.txt",
      "pyproject.toml",
      "pom.xml",
      "go.mod",
      "gemfile",
      ".env",
      "dockerfile",
    ].includes(base);
  };

  const pickPrimaryFileIndex = (files: UploadedFile[]): number => {
    const extPriority = [
      "ts",
      "tsx",
      "js",
      "jsx",
      "py",
      "java",
      "go",
      "rs",
      "php",
      "cpp",
      "c",
      "h",
      "hpp",
    ];

    // Prefer source files over config-like files.
    for (const ext of extPriority) {
      const idx = files.findIndex((f) => {
        const base = getBaseName(f.name).toLowerCase();
        const fileExt = base.split(".").pop() || "";
        return fileExt === ext && !isConfigLikeFile(base);
      });
      if (idx >= 0) return idx;
    }

    return 0;
  };

  const detectLanguageByExtension = (name: string): string | null => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    const langMap: Record<string, string> = {
      java: "Java",
      js: "JavaScript",
      jsx: "JavaScript",
      mjs: "JavaScript",
      cjs: "JavaScript",
      ts: "TypeScript",
      tsx: "TypeScript",
      py: "Python",
      c: "C/C++",
      cpp: "C/C++",
      h: "C/C++",
      hpp: "C/C++",
      go: "Go",
      rs: "Rust",
      php: "PHP",
    };
    return langMap[ext] || null;
  };

  const detectLanguageByContent = (content: string): string | null => {
    const src = content.slice(0, 6000);
    if (
      /\bimport\s+type\b|:\s*[A-Z][A-Za-z0-9_<>\[\]|]+\b|\breadonly\b/.test(src)
    ) {
      return "TypeScript";
    }
    if (/\bconst\b|\blet\b|\bfunction\b|=>|\bimport\b|\bexport\b/.test(src)) {
      return "JavaScript";
    }
    if (
      /\binterface\s+\w+\b|:\s*(string|number|boolean)\b|\btype\s+\w+\s*=/.test(
        src,
      )
    ) {
      return "TypeScript";
    }
    if (
      /\bimport\s+React\b|from\s+["']react["']|module\.exports|require\(/.test(
        src,
      )
    ) {
      return "JavaScript";
    }
    if (/\bdef\s+\w+\(|\bimport\s+\w+|from\s+\w+\s+import\s+\w+/.test(src)) {
      return "Python";
    }
    if (
      /\bpackage\s+[\w.]+;|\bpublic\s+class\s+\w+|\bimport\s+java\./.test(src)
    ) {
      return "Java";
    }
    if (/\bpackage\s+main\b|\bfunc\s+\w+\(/.test(src)) {
      return "Go";
    }
    if (/\bfn\s+\w+\(|\bimpl\s+\w+/.test(src)) {
      return "Rust";
    }
    if (/<\?php|\becho\s+\$|\bfunction\s+\w+\s*\(\s*\$/.test(src)) {
      return "PHP";
    }
    return null;
  };

  const detectFrameworkByFiles = (
    detectedLanguage: string,
    primaryContent: string,
    files: UploadedFile[],
  ): string => {
    const byBase = (base: string) =>
      files.find(
        (f) => getBaseName(f.name).toLowerCase() === base.toLowerCase(),
      )?.content || "";

    const packageJson = byBase("package.json");
    if (packageJson) {
      try {
        const pkg = JSON.parse(packageJson);
        const deps = {
          ...(pkg.dependencies || {}),
          ...(pkg.devDependencies || {}),
        } as Record<string, string>;
        if (deps.next) return "Next.js";
        if (deps.nestjs || deps["@nestjs/core"]) return "NestJS";
        if (deps.express) return "Express";
        if (deps.react) return "React";
        if (deps.vue) return "Vue";
        if (deps.angular || deps["@angular/core"]) return "Angular";
        if (detectedLanguage === "JavaScript") return "Node.js";
      } catch {
        // Keep heuristic fallback below.
      }
    }

    const requirements =
      byBase("requirements.txt") + "\n" + byBase("pyproject.toml");
    if (/\bfastapi\b/i.test(requirements)) return "FastAPI";
    if (/\bdjango\b/i.test(requirements)) return "Django";
    if (/\bflask\b/i.test(requirements)) return "Flask";

    const pomXml = byBase("pom.xml");
    if (/spring-boot|org\.springframework/i.test(pomXml)) return "Spring Boot";
    if (/jakarta\.|javax\./i.test(pomXml)) return "Jakarta EE";

    const goMod = byBase("go.mod");
    if (/github\.com\/gin-gonic\/gin/i.test(goMod)) return "Gin";
    if (/github\.com\/labstack\/echo/i.test(goMod)) return "Echo";
    if (/github\.com\/gofiber\/fiber/i.test(goMod)) return "Fiber";

    if (
      detectedLanguage === "TypeScript" ||
      detectedLanguage === "JavaScript"
    ) {
      if (/from\s+["']next\//.test(primaryContent)) return "Next.js";
      if (/from\s+["']@nestjs\//.test(primaryContent)) return "NestJS";
      if (/from\s+["']express["']/.test(primaryContent)) return "Express";
      if (/from\s+["']react["']/.test(primaryContent)) return "React";
      if (/from\s+["']vue["']/.test(primaryContent)) return "Vue";
      if (/from\s+["']@angular\//.test(primaryContent)) return "Angular";
      if (detectedLanguage === "JavaScript") return "Node.js";
    }

    if (detectedLanguage === "Java") {
      if (/org\.springframework/i.test(primaryContent)) return "Spring Boot";
      if (/jakarta\.|javax\./i.test(primaryContent)) return "Jakarta EE";
    }

    if (detectedLanguage === "Python") {
      if (
        /\bfrom\s+fastapi\s+import|\bimport\s+fastapi\b/i.test(primaryContent)
      )
        return "FastAPI";
      if (/\bfrom\s+django\b|\bimport\s+django\b/i.test(primaryContent))
        return "Django";
      if (/\bfrom\s+flask\b|\bimport\s+flask\b/i.test(primaryContent))
        return "Flask";
    }

    return "None";
  };

  const autoDetectFromFile = (
    file: UploadedFile,
    files: UploadedFile[],
  ): { language: string; framework: string } => {
    const languageDetected =
      detectLanguageByExtension(file.name) ||
      detectLanguageByContent(file.content) ||
      "Java";

    const frameworkDetected = detectFrameworkByFiles(
      languageDetected,
      file.content,
      files,
    );

    const availableFrameworks = FRAMEWORKS[languageDetected] || ["None"];
    return {
      language: languageDetected,
      framework: availableFrameworks.includes(frameworkDetected)
        ? frameworkDetected
        : "None",
    };
  };

  const handleFileUpload = useCallback(
    async (files: FileList | File[]) => {
      const newFiles: UploadedFile[] = [];
      for (const file of Array.from(files)) {
        if (file.name.endsWith(".zip")) {
          // Use JSZip to extract zip files
          try {
            const { default: JSZip } = await import("jszip");
            const arrayBuf = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuf);
            const entries = Object.values(zip.files).filter(
              (f) => !f.dir && isCodeFile(f.name),
            );
            for (const entry of entries.slice(0, 50)) {
              const content = await entry.async("text");
              newFiles.push({
                name: entry.name,
                content,
                size: content.length,
              });
            }
          } catch {
            // Fallback: treat as single file
            const text = await readFileAsText(file);
            newFiles.push({ name: file.name, content: text, size: file.size });
          }
        } else if (isCodeFile(file.name)) {
          const text = await readFileAsText(file);
          newFiles.push({ name: file.name, content: text, size: file.size });
        }
      }
      if (newFiles.length > 0) {
        const initialIdx = pickPrimaryFileIndex(newFiles);
        setUploadedFiles(newFiles);
        setActiveFileIdx(initialIdx);
        setCode(newFiles[initialIdx].content);
        setFileName(newFiles[initialIdx].name);
        const detection = autoDetectFromFile(newFiles[initialIdx], newFiles);
        setLanguage(detection.language);
        setFramework(detection.framework);
      }
    },
    [autoDetectFromFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0)
        handleFileUpload(e.dataTransfer.files);
    },
    [handleFileUpload],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const selectUploadedFile = (idx: number) => {
    if (idx < 0 || idx >= uploadedFiles.length) return;
    setActiveFileIdx(idx);
    setCode(uploadedFiles[idx].content);
    setFileName(uploadedFiles[idx].name);
    const detection = autoDetectFromFile(uploadedFiles[idx], uploadedFiles);
    setLanguage(detection.language);
    setFramework(detection.framework);
  };

  const selectUploadedFileByPath = (path: string) => {
    const idx = uploadedFiles.findIndex((f) => f.name === path);
    if (idx >= 0) selectUploadedFile(idx);
  };

  const fetchGithubFile = async () => {
    setGithubError("");
    setGithubLoading(true);
    try {
      let rawUrl = githubUrl.trim();

      // Detect if this is a repo URL (not a single file blob URL)
      const repoMatch = rawUrl.match(
        /github\.com\/([^/]+)\/([^/]+?)(?:\/tree\/([^/]+)(\/.*)?)?(?:\.git)?$/,
      );
      const isBlobUrl =
        rawUrl.includes("github.com") && rawUrl.includes("/blob/");

      if (repoMatch && !isBlobUrl) {
        // Whole repo or directory — use GitHub API
        const [, owner, repo, branch = "main", subPath = ""] = repoMatch;
        const apiUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
        const treeRes = await fetch(apiUrl);
        let treeData;
        if (!treeRes.ok) {
          // Try "master" branch if "main" fails and no branch was specified
          if (!repoMatch[3]) {
            const fallbackRes = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/git/trees/master?recursive=1`,
            );
            if (!fallbackRes.ok)
              throw new Error("Could not fetch repository tree");
            treeData = await fallbackRes.json();
          } else {
            throw new Error("Could not fetch repository tree");
          }
        } else {
          treeData = await treeRes.json();
        }

        const prefix = subPath ? subPath.replace(/^\//, "") : "";
        const codeFiles = (treeData.tree || [])
          .filter(
            (f: { type: string; path: string; size?: number }) =>
              f.type === "blob" &&
              (prefix ? f.path.startsWith(prefix) : true) &&
              isCodeFile(f.path) &&
              (f.size || 0) < 500000,
          )
          .slice(0, 50);

        if (codeFiles.length === 0) {
          throw new Error("No code files found in this repository");
        }

        const newFiles: UploadedFile[] = [];
        // Fetch files in parallel batches of 10
        for (let i = 0; i < codeFiles.length; i += 10) {
          const batch = codeFiles.slice(i, i + 10);
          const results = await Promise.all(
            batch.map(async (f: { path: string }) => {
              const fileRawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(branch || "main")}/${f.path}`;
              const res = await fetch(fileRawUrl);
              if (!res.ok) return null;
              const text = await res.text();
              return {
                name: f.path,
                content: text,
                size: text.length,
              };
            }),
          );
          for (const r of results) {
            if (r) newFiles.push(r);
          }
        }

        if (newFiles.length === 0) {
          throw new Error("Could not fetch any files from the repository");
        }

        const initialIdx = pickPrimaryFileIndex(newFiles);
        setUploadedFiles(newFiles);
        setActiveFileIdx(initialIdx);
        setCode(newFiles[initialIdx].content);
        setFileName(newFiles[initialIdx].name);
        setProjectName(`${owner}/${repo}`);
        const detection = autoDetectFromFile(newFiles[initialIdx], newFiles);
        setLanguage(detection.language);
        setFramework(detection.framework);
      } else {
        // Single file URL (blob/raw)
        if (rawUrl.includes("github.com") && rawUrl.includes("/blob/")) {
          rawUrl = rawUrl
            .replace("github.com", "raw.githubusercontent.com")
            .replace("/blob/", "/");
        }
        const res = await fetch(rawUrl);
        if (!res.ok) throw new Error("Failed to fetch");
        const text = await res.text();
        const name = rawUrl.split("/").pop() || "file.txt";
        const singleFile = { name, content: text, size: text.length };
        setCode(text);
        setFileName(name);
        setUploadedFiles([singleFile]);
        setActiveFileIdx(0);
        const detection = autoDetectFromFile(singleFile, [singleFile]);
        setLanguage(detection.language);
        setFramework(detection.framework);
      }
    } catch (err) {
      setGithubError(
        err instanceof Error
          ? err.message
          : "Could not fetch from GitHub. Make sure the URL points to a public repository or file.",
      );
    } finally {
      setGithubLoading(false);
    }
  };

  const handleScan = async () => {
    setLoading(true);
    setResult(null);
    setLastScanContext(null);
    setActiveCategory("all");

    let scanLanguage = language;
    let scanFramework = framework;
    const effectiveFileName = fileName || `Untitled.${getExtension(language)}`;
    const hasProjectFiles = uploadedFiles.length > 0;
    const shouldScanProject = scanScope === "project" && hasProjectFiles;
    const scanFiles = shouldScanProject
      ? uploadedFiles.map((f) => ({ name: f.name, content: f.content }))
      : undefined;
    const scannedFilesCount = shouldScanProject ? uploadedFiles.length : 1;
    const effectiveScope: ScanScope = shouldScanProject ? "project" : "file";

    if (inputMode === "editor" && code.trim()) {
      const editorFile: UploadedFile = {
        name: effectiveFileName,
        content: code,
        size: code.length,
      };
      const detection = autoDetectFromFile(editorFile, [editorFile]);
      scanLanguage = detection.language;
      scanFramework = detection.framework;
      setLanguage(scanLanguage);
      setFramework(scanFramework);
    }

    // Extract config files for version checking
    const CONFIG_FILE_NAMES = [
      "package.json",
      "requirements.txt",
      "pyproject.toml",
      "gemfile",
      "pom.xml",
    ];
    const configFiles = uploadedFiles
      .filter((f) =>
        CONFIG_FILE_NAMES.some((cf) => {
          const lowerName = f.name.toLowerCase();
          const lowerBaseName = getBaseName(f.name).toLowerCase();
          const expected = cf.toLowerCase();
          return lowerName === expected || lowerBaseName === expected;
        }),
      )
      .map((f) => ({
        fileName: f.name,
        content: f.content,
      }));

    // Store GitHub URL for linking issues
    if (githubUrl) {
      setStoredGithubUrl(githubUrl);
    }

    const res = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code,
        projectName: projectName || "Untitled Project",
        fileName: effectiveFileName,
        language: scanLanguage,
        framework: scanFramework === "None" ? undefined : scanFramework,
        analysisMode,
        scanScope: effectiveScope,
        files: scanFiles,
        configFiles: configFiles.length > 0 ? configFiles : undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setLastScanContext({
        language: scanLanguage,
        framework: scanFramework,
        analysisMode,
        fileName: effectiveFileName,
        scanScope: effectiveScope,
        scannedFilesCount,
      });
    }
    setResult(data.scan);
    setLoading(false);
  };

  const formatLangFramework = (lang: string, fw: string) =>
    fw !== "None" ? `${lang} / ${fw}` : lang;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleIssueStatusChange = async (
    issueId: string,
    newStatus: string,
  ) => {
    try {
      const response = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setIssueStatuses((prev) => ({
          ...prev,
          [issueId]: newStatus,
        }));
      }
    } catch (error) {
      console.error("Failed to update issue status:", error);
    }
  };

  const getIssueStatus = (issueId: string, defaultStatus?: string): string => {
    return issueStatuses[issueId] || defaultStatus || "OPEN";
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case "FIXED":
        return styles.statusFixed;
      case "IGNORED":
        return styles.statusIgnored;
      default:
        return styles.statusOpen;
    }
  };

  const getExtension = (lang: string) => {
    const map: Record<string, string> = {
      Java: "java",
      JavaScript: "js",
      TypeScript: "ts",
      Python: "py",
      "C/C++": "cpp",
      Go: "go",
      Rust: "rs",
      PHP: "php",
    };
    return map[lang] || "txt";
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

  const getGithubFileLink = (
    fileName: string,
    lineNumber: number,
  ): string | null => {
    if (!storedGithubUrl) return null;

    let repoUrl = storedGithubUrl.trim();
    if (repoUrl.endsWith("/")) {
      repoUrl = repoUrl.slice(0, -1);
    }

    // Handle both .git and non-.git URLs
    if (repoUrl.endsWith(".git")) {
      repoUrl = repoUrl.slice(0, -4);
    }

    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) return null;

    const [, owner, repo] = match;
    const branch = "main"; // Default to main, could be configurable
    const filePath = fileName.startsWith("/") ? fileName : `/${fileName}`;

    return `https://github.com/${owner}/${repo}/blob/${branch}${filePath}#L${lineNumber}`;
  };

  const buildFileTree = (): FileNode[] => {
    if (uploadedFiles.length === 0) return [];

    type MutableNode = FileNode & {
      childrenMap?: Record<string, MutableNode>;
    };

    const root: Record<string, MutableNode> = {};

    for (const file of uploadedFiles) {
      const parts = file.name.split("/");
      let current = root;
      const pathParts: string[] = [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isDir = i < parts.length - 1;
        pathParts.push(part);
        const fullPath = pathParts.join("/");

        if (!current[part]) {
          current[part] = {
            name: part,
            path: fullPath,
            isDir,
            children: undefined,
            childrenMap: isDir ? {} : undefined,
          };
        }

        if (isDir) {
          if (!current[part].childrenMap) {
            current[part].childrenMap = {};
          }
          current = current[part].childrenMap;
        }
      }
    }

    const processNode = (node: MutableNode): FileNode => {
      if (node.childrenMap && Object.keys(node.childrenMap).length > 0) {
        return {
          name: node.name,
          path: node.path,
          isDir: true,
          children: Object.values(node.childrenMap).map(processNode),
        };
      }

      return {
        name: node.name,
        path: node.path,
        isDir: node.isDir,
      };
    };

    return Object.values(root).map(processNode);
  };

  // Compute category counts
  const categoryCounts: Record<string, number> = {};
  const severityCounts: Record<string, number> = {};
  if (result) {
    for (const issue of result.issues) {
      const cat = issue.category || "code-quality";
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      const sev = issue.severity?.toUpperCase() || "MEDIUM";
      severityCounts[sev] = (severityCounts[sev] || 0) + 1;
    }
  }

  const editorSection = (fullscreenMode = false) => (
    <>
      <div className={styles.editorHeader}>
        <div className={styles.editorDots}>
          <span className={styles.dotRed} />
          <span className={styles.dotYellow} />
          <span className={styles.dotGreen} />
        </div>
        <span className={styles.editorTitle}>
          {fileName || `untitled.${getExtension(language)}`}
        </span>
        <span className={styles.editorLang}>
          {formatLangFramework(language, framework)}
        </span>
        <button
          type="button"
          className={styles.fullscreenBtn}
          onClick={() => setIsFullscreen(!isFullscreen)}
          title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? (
            <IconMinimize style={{ width: 14, height: 14 }} />
          ) : (
            <IconMaximize style={{ width: 14, height: 14 }} />
          )}
        </button>
      </div>
      <CodeEditor
        value={code}
        onChange={setCode}
        language={language}
        placeholder="Start typing or paste your code here..."
        fullscreen={fullscreenMode}
      />
    </>
  );

  return (
    <div className={styles.scannerContainer}>
      <div className={dashStyles.pageHeader}>
        <h1 className={dashStyles.pageTitle}>Code Analyzer</h1>
        <p className={dashStyles.pageDesc}>
          Analyze your code for security vulnerabilities, memory leaks,
          performance issues, and best practices
        </p>
      </div>

      {/* Config section */}
      <div className={styles.configSection}>
        <div className={styles.configRow}>
          <div className={styles.configField}>
            <label className={styles.configLabel}>Project</label>
            <input
              className={styles.input}
              type="text"
              placeholder="My Project"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className={styles.configField}>
            <label className={styles.configLabel}>File Name</label>
            <input
              className={styles.input}
              type="text"
              placeholder={`App.${getExtension(language)}`}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
            />
          </div>
        </div>

        <div className={styles.configRow}>
          <div className={styles.configField}>
            <label className={styles.configLabel}>Language</label>
            <select
              className={styles.select}
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setFramework("None");
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.configField}>
            <label className={styles.configLabel}>Framework</label>
            <select
              className={styles.select}
              value={framework}
              onChange={(e) => setFramework(e.target.value)}
            >
              {(FRAMEWORKS[language] || ["None"]).map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.configField}>
            <label className={styles.configLabel}>Scan Scope</label>
            <select
              className={styles.select}
              value={scanScope}
              onChange={(e) => setScanScope(e.target.value as ScanScope)}
            >
              <option value="file">Selected File</option>
              <option value="project">Whole Project</option>
            </select>
          </div>
        </div>
      </div>

      {/* Analysis Mode */}
      <div className={styles.modeSection}>
        <label className={styles.configLabel}>Analysis Mode</label>
        <div className={styles.modeCards}>
          {ANALYSIS_MODES.map((mode) => (
            <button
              key={mode.id}
              className={`${styles.modeCard} ${analysisMode === mode.id ? styles.modeCardActive : ""}`}
              onClick={() => setAnalysisMode(mode.id)}
              type="button"
            >
              <span className={styles.modeIcon}>{mode.icon}</span>
              <span className={styles.modeLabel}>{mode.label}</span>
              <span className={styles.modeDesc}>{mode.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Mode Tabs */}
      <div className={styles.inputModeTabs}>
        <button
          type="button"
          className={`${styles.inputModeTab} ${inputMode === "editor" ? styles.inputModeTabActive : ""}`}
          onClick={() => setInputMode("editor")}
        >
          <IconCode style={{ width: 14, height: 14 }} /> Code Editor
        </button>
        <button
          type="button"
          className={`${styles.inputModeTab} ${inputMode === "upload" ? styles.inputModeTabActive : ""}`}
          onClick={() => setInputMode("upload")}
        >
          <IconUpload style={{ width: 14, height: 14 }} /> File Upload
        </button>
        <button
          type="button"
          className={`${styles.inputModeTab} ${inputMode === "github" ? styles.inputModeTabActive : ""}`}
          onClick={() => setInputMode("github")}
        >
          <IconGithub style={{ width: 14, height: 14 }} /> GitHub
        </button>
      </div>

      {/* Input Modes */}
      {inputMode === "editor" && (
        <>
          {isFullscreen && (
            <div className={styles.fullscreenOverlay}>
              <div className={styles.fullscreenEditor}>
                <div className={styles.editorSection}>
                  {editorSection(true)}
                </div>
                <div className={styles.fullscreenActions}>
                  <button
                    type="button"
                    className={styles.fullscreenCloseBtn}
                    onClick={() => setIsFullscreen(false)}
                  >
                    <IconMinimize style={{ width: 14, height: 14 }} /> Exit
                    Fullscreen
                  </button>
                  <button
                    className={styles.scanButton}
                    onClick={handleScan}
                    disabled={loading || !code}
                    style={{ maxWidth: 240 }}
                  >
                    {loading ? (
                      <>
                        <span className={styles.spinner} /> Scanning...
                      </>
                    ) : (
                      <>
                        <IconPlay style={{ width: 16, height: 16 }} /> Run
                        Analysis
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          {!isFullscreen && (
            <div className={styles.editorSection}>{editorSection(false)}</div>
          )}
        </>
      )}

      {inputMode === "upload" && (
        <div className={styles.uploadSection}>
          <div
            className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === "Enter" && fileInputRef.current?.click()
            }
          >
            <IconUpload
              style={{ width: 32, height: 32, color: "var(--accent)" }}
            />
            <p className={styles.dropZoneTitle}>
              Drop files here or click to browse
            </p>
            <p className={styles.dropZoneDesc}>
              Supports code files and .zip archives (up to 50 files)
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".java,.js,.jsx,.ts,.tsx,.py,.c,.cpp,.h,.hpp,.go,.rs,.php,.zip,.rb,.cs,.swift,.kt,.scala,.sh,.sql,.html,.css,.xml,.json,.yaml,.yml"
              className={styles.fileInput}
              onChange={(e) =>
                e.target.files && handleFileUpload(e.target.files)
              }
            />
          </div>
          {uploadedFiles.length > 0 && (
            <div className={styles.uploadedFilesList}>
              <span className={styles.uploadedFilesLabel}>
                {uploadedFiles.length} file
                {uploadedFiles.length !== 1 ? "s" : ""} loaded
              </span>
              <div className={styles.fileChips}>
                {uploadedFiles.map((f, idx) => (
                  <button
                    key={`${f.name}-${idx}`}
                    type="button"
                    className={`${styles.fileChip} ${idx === activeFileIdx ? styles.fileChipActive : ""}`}
                    onClick={() => selectUploadedFile(idx)}
                  >
                    <IconFile style={{ width: 12, height: 12 }} />
                    {f.name}
                  </button>
                ))}
              </div>
              <FileTree
                files={buildFileTree()}
                onFileSelect={selectUploadedFileByPath}
              />
            </div>
          )}
          {code && (
            <div className={styles.editorSection}>
              <div className={styles.editorHeader}>
                <div className={styles.editorDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <span className={styles.editorTitle}>
                  {fileName || "Uploaded file"}
                </span>
                <span className={styles.editorLang}>
                  {formatLangFramework(language, framework)}
                </span>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                placeholder=""
              />
            </div>
          )}
        </div>
      )}

      {inputMode === "github" && (
        <div className={styles.githubSection}>
          <div className={styles.githubInputRow}>
            <div className={styles.githubInputWrapper}>
              <IconGithub
                style={{
                  width: 16,
                  height: 16,
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                className={styles.githubInput}
                type="url"
                placeholder="https://github.com/user/repo or .../blob/main/src/App.java"
                value={githubUrl}
                onChange={(e) => {
                  setGithubUrl(e.target.value);
                  setGithubError("");
                }}
              />
            </div>
            <button
              type="button"
              className={styles.githubFetchBtn}
              onClick={fetchGithubFile}
              disabled={!githubUrl.trim() || githubLoading}
            >
              {githubLoading ? "Fetching..." : "Fetch"}
            </button>
          </div>
          {githubError && <p className={styles.githubError}>{githubError}</p>}
          <p className={styles.githubHint}>
            Paste a GitHub repository URL (e.g. https://github.com/user/repo) to
            scan the whole project, or a single file URL
          </p>
          {uploadedFiles.length > 0 && (
            <FileTree
              files={buildFileTree()}
              onFileSelect={selectUploadedFileByPath}
            />
          )}
          {code && (
            <div className={styles.editorSection}>
              <div className={styles.editorHeader}>
                <div className={styles.editorDots}>
                  <span className={styles.dotRed} />
                  <span className={styles.dotYellow} />
                  <span className={styles.dotGreen} />
                </div>
                <span className={styles.editorTitle}>
                  {fileName || "Fetched file"}
                </span>
                <span className={styles.editorLang}>
                  {formatLangFramework(language, framework)}
                </span>
              </div>
              <CodeEditor
                value={code}
                onChange={setCode}
                language={language}
                placeholder=""
              />
            </div>
          )}
        </div>
      )}

      <button
        className={styles.scanButton}
        onClick={handleScan}
        disabled={loading || !code}
      >
        {loading ? (
          <>
            <span className={styles.spinner} />
            Scanning...
          </>
        ) : (
          <>
            <IconPlay style={{ width: 16, height: 16 }} /> Run Analysis
          </>
        )}
      </button>

      {result && (
        <div className={styles.results}>
          <div className={styles.resultsHeader}>
            <span className={styles.resultsTitle}>Analysis Results</span>
            <span
              className={`${styles.scoreBadge} ${getScoreClass(result.securityScore)}`}
            >
              {result.securityScore}/100
            </span>
          </div>

          <div className={styles.resultsMeta}>
            <span>
              {result.issues.length} issue
              {result.issues.length !== 1 ? "s" : ""} found
            </span>
            <span>·</span>
            <span>
              {formatLangFramework(
                lastScanContext?.language || language,
                lastScanContext?.framework || framework,
              )}
            </span>
            <span>·</span>
            <span>
              {
                ANALYSIS_MODES.find(
                  (m) =>
                    m.id === (lastScanContext?.analysisMode || analysisMode),
                )?.label
              }
            </span>
            <span>·</span>
            <span>
              {(lastScanContext?.scanScope || scanScope) === "project"
                ? `Whole project (${lastScanContext?.scannedFilesCount || uploadedFiles.length} files)`
                : "Selected file"}
            </span>
          </div>

          {/* Export buttons */}
          <div className={styles.exportButtons}>
            <button
              className={styles.exportBtn}
              onClick={() =>
                downloadCSV({
                  id: result.id,
                  projectName: result.projectName,
                  securityScore: result.securityScore,
                  analysisMode: (
                    lastScanContext?.analysisMode || analysisMode
                  ).toUpperCase(),
                  createdAt: result.createdAt,
                  issues: result.issues,
                })
              }
              title="Export as CSV"
            >
              <IconClipboard style={{ width: 16, height: 16 }} />
              CSV
            </button>
            <button
              className={styles.exportBtn}
              onClick={() =>
                downloadPDF({
                  id: result.id,
                  projectName: result.projectName,
                  securityScore: result.securityScore,
                  analysisMode: (
                    lastScanContext?.analysisMode || analysisMode
                  ).toUpperCase(),
                  createdAt: result.createdAt,
                  issues: result.issues,
                })
              }
              title="Export as PDF"
            >
              <IconFile style={{ width: 16, height: 16 }} />
              PDF
            </button>
          </div>

          {/* Severity summary */}
          {result.issues.length > 0 && (
            <div className={styles.severitySummary}>
              {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map(
                (sev) =>
                  severityCounts[sev] && (
                    <span key={sev} className={styles.severityDot}>
                      <span
                        className={`${styles.severityDotIndicator} ${styles[sev.toLowerCase() as keyof typeof styles]}`}
                      />
                      {severityCounts[sev]} {sev.toLowerCase()}
                    </span>
                  ),
              )}
            </div>
          )}

          {result.issues.length === 0 ? (
            <div className={styles.noIssues}>
              <span className={styles.noIssuesIcon}>
                <IconCheckCircle
                  style={{ width: 20, height: 20, color: "var(--success)" }}
                />
              </span>
              <span>No issues found — your code looks good!</span>
            </div>
          ) : (
            <>
              {/* Category summary cards */}
              <div className={styles.categorySummary}>
                {ALL_CATEGORIES.filter((c) => categoryCounts[c]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <div key={cat} className={styles.categorySummaryCard}>
                      <div
                        className={`${styles.categorySummaryIcon} ${styles[meta.cssClass as keyof typeof styles]}`}
                      >
                        {meta.icon}
                      </div>
                      <div className={styles.categorySummaryInfo}>
                        <span className={styles.categorySummaryCount}>
                          {categoryCounts[cat]}
                        </span>
                        <span className={styles.categorySummaryLabel}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Category filter tabs */}
              <div className={styles.categoryTabs}>
                <button
                  className={`${styles.categoryTab} ${activeCategory === "all" ? styles.categoryTabActive : ""}`}
                  onClick={() => setActiveCategory("all")}
                  type="button"
                >
                  All
                  <span className={styles.categoryCount}>
                    {result.issues.length}
                  </span>
                </button>
                {ALL_CATEGORIES.filter((c) => categoryCounts[c]).map((cat) => {
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      className={`${styles.categoryTab} ${activeCategory === cat ? styles.categoryTabActive : ""}`}
                      onClick={() => setActiveCategory(cat)}
                      type="button"
                    >
                      {meta.icon}
                      {meta.label}
                      <span className={styles.categoryCount}>
                        {categoryCounts[cat]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Grouped issues by category */}
              {(() => {
                const categoriesToShow =
                  activeCategory === "all"
                    ? ALL_CATEGORIES.filter((c) => categoryCounts[c])
                    : [activeCategory as IssueCategory];
                return categoriesToShow.map((cat) => {
                  const meta = CATEGORY_META[cat];
                  const catIssues = result.issues.filter(
                    (i) => i.category === cat,
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
                            <IconChevronRight
                              style={{ width: 14, height: 14 }}
                            />
                          ) : (
                            <IconChevronDown
                              style={{ width: 14, height: 14 }}
                            />
                          )}
                        </span>
                        <span
                          className={`${styles.issueGroupIcon} ${styles[meta.cssClass as keyof typeof styles]}`}
                        >
                          {meta.icon}
                        </span>
                        <span className={styles.issueGroupTitle}>
                          {meta.label}
                        </span>
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
                                      if (next.has(issue.id))
                                        next.delete(issue.id);
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
                                  <span
                                    className={`${styles.statusBadge} ${getStatusBadgeClass(getIssueStatus(issue.id, issue.status))}`}
                                  >
                                    {getIssueStatus(issue.id, issue.status) ===
                                    "FIXED"
                                      ? "✓"
                                      : getIssueStatus(
                                            issue.id,
                                            issue.status,
                                          ) === "IGNORED"
                                        ? "⊘"
                                        : ""}
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
                                    {(() => {
                                      const ghLink = getGithubFileLink(
                                        issue.fileName,
                                        issue.lineNumber,
                                      );
                                      return ghLink ? (
                                        <a
                                          href={ghLink}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={styles.ghLinkBtn}
                                          title="View in GitHub"
                                        >
                                          <IconGithub
                                            style={{ width: 14, height: 14 }}
                                          />
                                          View in GitHub
                                        </a>
                                      ) : null;
                                    })()}
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
                                          className={styles.copyBtn}
                                          onClick={() =>
                                            handleCopy(
                                              issue.aiFixSnippet!,
                                              issue.id,
                                            )
                                          }
                                        >
                                          <IconClipboard
                                            style={{ width: 12, height: 12 }}
                                          />
                                          {copiedId === issue.id
                                            ? "Copied!"
                                            : "Copy fix"}
                                        </button>
                                      </>
                                    )}
                                    {/* Status control buttons */}
                                    <div className={styles.issueStatusControls}>
                                      <span className={styles.statusLabel}>
                                        Mark as:
                                      </span>
                                      <button
                                        type="button"
                                        className={`${styles.statusBtn} ${getIssueStatus(issue.id, issue.status) === "OPEN" ? styles.statusBtnActive : ""}`}
                                        onClick={() =>
                                          handleIssueStatusChange(
                                            issue.id,
                                            "OPEN",
                                          )
                                        }
                                      >
                                        Open
                                      </button>
                                      <button
                                        type="button"
                                        className={`${styles.statusBtn} ${getIssueStatus(issue.id, issue.status) === "FIXED" ? styles.statusBtnActive : ""}`}
                                        onClick={() =>
                                          handleIssueStatusChange(
                                            issue.id,
                                            "FIXED",
                                          )
                                        }
                                      >
                                        ✓ Fixed
                                      </button>
                                      <button
                                        type="button"
                                        className={`${styles.statusBtn} ${getIssueStatus(issue.id, issue.status) === "IGNORED" ? styles.statusBtnActive : ""}`}
                                        onClick={() =>
                                          handleIssueStatusChange(
                                            issue.id,
                                            "IGNORED",
                                          )
                                        }
                                      >
                                        ⊘ Ignored
                                      </button>
                                    </div>
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
              })()}
            </>
          )}
        </div>
      )}
    </div>
  );
}
