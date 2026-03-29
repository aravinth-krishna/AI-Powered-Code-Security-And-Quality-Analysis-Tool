import { useState } from "react";
import styles from "./FileTree.module.css";

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children?: FileNode[];
}

export interface FileTreeProps {
  files: FileNode[];
  onFileSelect?: (path: string, content?: string) => void;
}

export function FileTree({ files, onFileSelect }: FileTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const toggleExpand = (path: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpanded(newExpanded);
  };

  const handleFileClick = (path: string) => {
    setSelectedFile(path);
    onFileSelect?.(path);
  };

  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expanded.has(node.path);

    return (
      <div key={node.path} style={{ marginLeft: `${depth * 16}px` }}>
        {node.isDir ? (
          <div
            className={styles.folderItem}
            onClick={() => toggleExpand(node.path)}
          >
            <span className={styles.chevron}>{isExpanded ? "▼" : "▶"}</span>
            <span className={styles.folderIcon}>📁</span>
            <span className={styles.folderName}>{node.name}</span>
          </div>
        ) : (
          <div
            className={`${styles.fileItem} ${
              selectedFile === node.path ? styles.selected : ""
            }`}
            onClick={() => handleFileClick(node.path)}
          >
            <span className={styles.fileIcon}>{getFileIcon(node.name)}</span>
            <span className={styles.fileName}>{node.name}</span>
          </div>
        )}

        {node.isDir && isExpanded && node.children && (
          <div>
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.fileTree}>
      {files.map((file) => renderNode(file))}
    </div>
  );
}

function getFileIcon(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  const iconMap: Record<string, string> = {
    js: "📜",
    ts: "📘",
    jsx: "⚛️",
    tsx: "⚛️",
    json: "🔧",
    py: "🐍",
    java: "☕",
    cpp: "⚙️",
    c: "⚙️",
    go: "🐹",
    rs: "🦀",
    php: "🐘",
    rb: "💎",
    html: "🌐",
    css: "🎨",
    scss: "🎨",
    less: "🎨",
    xml: "📋",
    yaml: "📋",
    yml: "📋",
    md: "📝",
    txt: "📄",
    env: "⚙️",
    dockerfile: "🐳",
    gitignore: "📦",
  };

  return iconMap[ext] || "📄";
}
