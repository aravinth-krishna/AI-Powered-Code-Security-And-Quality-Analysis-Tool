"use client";
import { useRef, useEffect, useCallback } from "react";
import {
  EditorView,
  keymap,
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  highlightActiveLine,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import {
  defaultKeymap,
  indentWithTab,
  history,
  historyKeymap,
} from "@codemirror/commands";
import {
  bracketMatching,
  indentOnInput,
  syntaxHighlighting,
  defaultHighlightStyle,
  foldGutter,
  foldKeymap,
} from "@codemirror/language";
import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";
import { rust } from "@codemirror/lang-rust";
import { go } from "@codemirror/lang-go";
import { oneDark } from "@codemirror/theme-one-dark";

const languageExtensions: Record<string, () => ReturnType<typeof java>> = {
  java: () => java(),
  javascript: () => javascript(),
  typescript: () => javascript({ typescript: true }),
  python: () => python(),
  "c/c++": () => cpp(),
  php: () => php(),
  rust: () => rust(),
  go: () => go(),
};

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  placeholder?: string;
  fullscreen?: boolean;
}

const codeSightTheme = EditorView.theme(
  {
    "&": {
      fontSize: "13.5px",
      backgroundColor: "#0d0d14",
      borderRadius: "6px",
      height: "320px",
    },
    ".cm-content": {
      fontFamily: "var(--font-mono)",
      padding: "12px 0",
      caretColor: "#818cf8",
    },
    ".cm-gutters": {
      backgroundColor: "#0a0a12",
      color: "#3a3a4a",
      border: "none",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      paddingLeft: "4px",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(99,102,241,0.08)",
      color: "#71717a",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(99,102,241,0.06)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(99,102,241,0.25) !important",
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(99,102,241,0.3) !important",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "#818cf8",
      borderLeftWidth: "2px",
    },
    ".cm-scroller": {
      overflow: "auto",
      fontFamily: "var(--font-mono)",
    },
    "&.cm-focused": {
      outline: "none",
    },
    ".cm-matchingBracket": {
      backgroundColor: "rgba(99,102,241,0.2)",
      outline: "1px solid rgba(99,102,241,0.4)",
    },
    ".cm-foldGutter": {
      width: "14px",
    },
  },
  { dark: true },
);

const fullscreenTheme = EditorView.theme(
  {
    "&": {
      height: "100%",
      flex: "1",
      borderRadius: "0",
    },
    ".cm-scroller": {
      overflow: "auto",
    },
  },
  { dark: true },
);

export default function CodeEditor({
  value,
  onChange,
  language,
  placeholder,
  fullscreen = false,
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const getLangExtension = useCallback(() => {
    const langKey = language.toLowerCase();
    const factory = languageExtensions[langKey];
    return factory ? factory() : java();
  }, [language]);

  useEffect(() => {
    if (!editorRef.current) return;

    const state = EditorState.create({
      doc: value,
      extensions: [
        lineNumbers(),
        highlightActiveLineGutter(),
        highlightSpecialChars(),
        foldGutter(),
        drawSelection(),
        EditorState.allowMultipleSelections.of(true),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        bracketMatching(),
        rectangularSelection(),
        crosshairCursor(),
        highlightActiveLine(),
        history(),
        keymap.of([
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        getLangExtension(),
        oneDark,
        codeSightTheme,
        ...(fullscreen ? [fullscreenTheme] : []),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
        placeholder
          ? EditorView.contentAttributes.of({ "data-placeholder": placeholder })
          : [],
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
    // Only re-create editor when language or fullscreen changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, fullscreen]);

  // Sync external value changes (but not changes from the editor itself)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const currentDoc = view.state.doc.toString();
    if (value !== currentDoc) {
      view.dispatch({
        changes: { from: 0, to: currentDoc.length, insert: value },
      });
    }
  }, [value]);

  return (
    <div
      ref={editorRef}
      style={{
        borderRadius: fullscreen ? "0" : "var(--radius-md)",
        border: fullscreen ? "none" : "1px solid rgba(255,255,255,0.08)",
        overflow: "hidden",
        ...(fullscreen
          ? { flex: 1, display: "flex", flexDirection: "column" as const }
          : {}),
      }}
    />
  );
}
