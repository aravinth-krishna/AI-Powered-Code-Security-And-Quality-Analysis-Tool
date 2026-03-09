import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Comment stripping ──
function stripComments(code: string): string[] {
  const lines = code.split("\n");
  const stripped: string[] = new Array(lines.length).fill("");
  let inBlockComment = false;
  let inTripleQuote: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Handle Python triple-quote strings/comments
    if (inTripleQuote) {
      const endIdx = line.indexOf(inTripleQuote);
      if (endIdx !== -1) {
        line = line.slice(endIdx + 3);
        inTripleQuote = null;
      } else {
        stripped[i] = "";
        continue;
      }
    }

    // Handle block comments (/* */)
    if (inBlockComment) {
      const endIdx = line.indexOf("*/");
      if (endIdx !== -1) {
        line = line.slice(endIdx + 2);
        inBlockComment = false;
      } else {
        stripped[i] = "";
        continue;
      }
    }

    // Check for triple-quote start
    for (const tq of ['"""', "'''"]) {
      const tqIdx = line.indexOf(tq);
      if (tqIdx !== -1) {
        const afterTq = line.indexOf(tq, tqIdx + 3);
        if (afterTq === -1) {
          line = line.slice(0, tqIdx);
          inTripleQuote = tq;
          break;
        }
      }
    }

    // Remove block comment starts
    let blockStart = line.indexOf("/*");
    while (blockStart !== -1) {
      const blockEnd = line.indexOf("*/", blockStart + 2);
      if (blockEnd !== -1) {
        line = line.slice(0, blockStart) + line.slice(blockEnd + 2);
      } else {
        line = line.slice(0, blockStart);
        inBlockComment = true;
        break;
      }
      blockStart = line.indexOf("/*");
    }

    // Remove single-line comments (// and #)
    // Be careful not to match inside strings
    const singleLineComment = findSingleLineComment(line);
    if (singleLineComment !== -1) {
      line = line.slice(0, singleLineComment);
    }

    stripped[i] = line;
  }
  return stripped;
}

function findSingleLineComment(line: string): number {
  let inStr: string | null = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inStr) {
      if (ch === inStr && line[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === "`") {
      inStr = ch;
      continue;
    }
    if (ch === "/" && line[i + 1] === "/") return i;
    if (ch === "#") return i;
  }
  return -1;
}

// ── Category definitions ──
export type IssueCategory =
  | "security"
  | "performance"
  | "memory"
  | "best-practice"
  | "error-handling"
  | "code-quality";

interface Rule {
  type: string;
  regex: RegExp;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: IssueCategory;
  description: string;
}

// ── Comprehensive rule set organized by category ──

const SECURITY_RULES: Rule[] = [
  // Injection
  {
    type: "SQL_INJECTION",
    regex: /SELECT.*FROM.*WHERE.*=\s*['"]?\s*\+|SELECT.*FROM.*WHERE.*=\s*\$\{/i,
    severity: "CRITICAL",
    category: "security",
    description: "Possible SQL injection via string concatenation",
  },
  {
    type: "SQL_INJECTION_PARAM",
    regex: /query\s*\(\s*['"`].*\$\{|execute\s*\(\s*['"`].*\+/i,
    severity: "CRITICAL",
    category: "security",
    description: "Unparameterized SQL query",
  },
  {
    type: "NOSQL_INJECTION",
    regex: /\$where\s*:|\.find\(\s*\{.*\$regex/i,
    severity: "HIGH",
    category: "security",
    description: "Possible NoSQL injection",
  },
  {
    type: "COMMAND_INJECTION",
    regex:
      /Runtime\.getRuntime\(\)\.exec\(|child_process|os\.system\(|subprocess\.call\(|exec\(.*\+/i,
    severity: "CRITICAL",
    category: "security",
    description: "Command injection risk via OS command execution",
  },
  {
    type: "LDAP_INJECTION",
    regex: /ldap.*search.*\(.*\+|LdapContext.*search/i,
    severity: "HIGH",
    category: "security",
    description: "Possible LDAP injection",
  },
  {
    type: "XPATH_INJECTION",
    regex: /xpath.*evaluate.*\+|XPathExpression.*compile.*\+/i,
    severity: "HIGH",
    category: "security",
    description: "Possible XPath injection",
  },
  {
    type: "EVAL_USAGE",
    regex: /\beval\s*\(|new\s+Function\s*\(/i,
    severity: "HIGH",
    category: "security",
    description: "Dynamic code execution via eval or Function constructor",
  },
  {
    type: "UNSAFE_DESERIALIZATION",
    regex:
      /ObjectInputStream|pickle\.load|yaml\.load\s*\((?!.*Loader)|unserialize\(/i,
    severity: "CRITICAL",
    category: "security",
    description: "Unsafe deserialization of untrusted data",
  },
  {
    type: "TEMPLATE_INJECTION",
    regex: /render_template_string|Template\(.*\+|\.render\(.*\+.*request/i,
    severity: "HIGH",
    category: "security",
    description: "Server-side template injection",
  },

  // XSS & DOM
  {
    type: "XSS_RISK",
    regex:
      /innerHTML\s*=|dangerouslySetInnerHTML|document\.write\(|\.html\s*\(/i,
    severity: "HIGH",
    category: "security",
    description: "Cross-site scripting risk via unsafe DOM manipulation",
  },
  {
    type: "DOM_XSS",
    regex: /location\.hash|location\.search|document\.referrer|document\.URL/i,
    severity: "MEDIUM",
    category: "security",
    description: "DOM-based XSS via unvalidated URL source",
  },
  {
    type: "UNSAFE_REDIRECT",
    regex:
      /window\.location\s*=.*\+|res\.redirect\(.*req\.|Response\.Redirect\(.*Request/i,
    severity: "HIGH",
    category: "security",
    description: "Open redirect vulnerability",
  },

  // Secrets & credentials
  {
    type: "HARDCODED_SECRET",
    regex:
      /(?:password|passwd|pwd|secret|api_?key|apikey|token|auth)\s*[:=]\s*['"][^'"]{4,}['"]/i,
    severity: "HIGH",
    category: "security",
    description: "Hardcoded credential or secret",
  },
  {
    type: "PRIVATE_KEY",
    regex: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/i,
    severity: "CRITICAL",
    category: "security",
    description: "Private key embedded in source code",
  },
  {
    type: "JWT_HARDCODED",
    regex: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/i,
    severity: "HIGH",
    category: "security",
    description: "Hardcoded JWT token",
  },
  {
    type: "AWS_KEY",
    regex: /AKIA[0-9A-Z]{16}/i,
    severity: "CRITICAL",
    category: "security",
    description: "AWS access key ID in source code",
  },

  // Crypto
  {
    type: "WEAK_CRYPTO",
    regex: /MD5|SHA-?1(?!\d)|DES(?!C)|RC4|ROT13/i,
    severity: "MEDIUM",
    category: "security",
    description: "Weak or broken cryptographic algorithm",
  },
  {
    type: "INSECURE_RANDOM",
    regex: /Math\.random\(\)|new Random\(\)|rand\(\)|random\.random\(\)/i,
    severity: "MEDIUM",
    category: "security",
    description: "Non-cryptographic random used in security context",
  },
  {
    type: "WEAK_TLS",
    regex: /SSLv2|SSLv3|TLSv1\.0|TLSv1\.1|PROTOCOL_TLSv1(?!\.[23])/i,
    severity: "HIGH",
    category: "security",
    description: "Deprecated/weak TLS version",
  },
  {
    type: "DISABLED_CERT_VERIFY",
    regex:
      /verify\s*=\s*False|CERT_NONE|rejectUnauthorized\s*:\s*false|InsecureSkipVerify\s*:\s*true/i,
    severity: "HIGH",
    category: "security",
    description: "TLS certificate verification disabled",
  },

  // Auth & access
  {
    type: "CORS_WILDCARD",
    regex: /Access-Control-Allow-Origin.*\*|cors\(\s*\)|allowedOrigins.*\*/i,
    severity: "MEDIUM",
    category: "security",
    description: "Overly permissive CORS configuration",
  },
  {
    type: "CSRF_DISABLED",
    regex: /csrf.*disable|@csrf_exempt|csrf_enabled\s*=\s*False/i,
    severity: "MEDIUM",
    category: "security",
    description: "CSRF protection disabled",
  },
  {
    type: "MISSING_AUTH_HEADER",
    regex: /\.get\s*\(\s*['"]\/api\/|app\.post\s*\(\s*['"]\/api\//i,
    severity: "LOW",
    category: "security",
    description: "API endpoint may lack authentication",
  },

  // Network
  {
    type: "INSECURE_HTTP",
    regex: /http:\/\/(?!localhost|127\.0\.0\.1|0\.0\.0\.0)/i,
    severity: "MEDIUM",
    category: "security",
    description: "Insecure HTTP URL",
  },
  {
    type: "HARDCODED_IP",
    regex: /(?:['"`])\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?:['"`])/i,
    severity: "LOW",
    category: "security",
    description: "Hardcoded IP address",
  },
  {
    type: "SSRF_RISK",
    regex:
      /fetch\s*\(.*req\.|requests\.get\s*\(.*request\.|urllib.*urlopen.*request/i,
    severity: "HIGH",
    category: "security",
    description: "Possible server-side request forgery",
  },
  {
    type: "PATH_TRAVERSAL",
    regex: /\.\.\/|\.\.\\|Path\.Combine.*\.\./i,
    severity: "MEDIUM",
    category: "security",
    description: "Path traversal attempt",
  },
  {
    type: "DEBUG_LOG_SENSITIVE",
    regex:
      /console\.log\(.*(?:password|secret|token|key|credential|ssn|credit)/i,
    severity: "MEDIUM",
    category: "security",
    description: "Sensitive data in debug logs",
  },
];

const PERFORMANCE_RULES: Rule[] = [
  {
    type: "N_PLUS_ONE_QUERY",
    regex:
      /for\s*\(.*\)\s*\{[\s\S]*?(?:await\s+)?(?:db\.|prisma\.|knex\.|sequelize\.|\.query|\.findOne|\.findById)/i,
    severity: "MEDIUM",
    category: "performance",
    description: "Possible N+1 query inside loop",
  },
  {
    type: "SYNC_IN_ASYNC",
    regex: /readFileSync|writeFileSync|execSync|spawnSync/i,
    severity: "MEDIUM",
    category: "performance",
    description: "Synchronous I/O in potentially async context",
  },
  {
    type: "UNBOUNDED_QUERY",
    regex:
      /\.find\(\s*\{\s*\}\s*\)|\.findMany\(\s*\)|SELECT\s+\*\s+FROM\s+\w+\s*;/i,
    severity: "MEDIUM",
    category: "performance",
    description: "Unbounded database query without pagination/limit",
  },
  {
    type: "MISSING_INDEX_HINT",
    regex: /ORDER\s+BY.*(?:WHERE|JOIN)|GROUP\s+BY.*(?:HAVING|JOIN)/i,
    severity: "LOW",
    category: "performance",
    description: "Complex query that may benefit from indexing",
  },
  {
    type: "NESTED_LOOP",
    regex: /for\s*\(.*\)\s*\{[^}]*for\s*\(.*\)\s*\{/i,
    severity: "LOW",
    category: "performance",
    description: "Nested loop — O(n²) complexity",
  },
  {
    type: "REGEX_REDOS",
    regex: /(\([^)]*\+\))\1|\(\.\*\)\+|\(\[.*?\]\+\)\+/i,
    severity: "MEDIUM",
    category: "performance",
    description: "Regex pattern vulnerable to ReDoS",
  },
  {
    type: "LARGE_INLINE_DATA",
    regex: /(?:=\s*\[)[^;]{500,}|(?:=\s*\{)[^;]{500,}/i,
    severity: "LOW",
    category: "performance",
    description: "Large inline data structure — consider external file",
  },
  {
    type: "BLOCKING_MAIN_THREAD",
    regex: /while\s*\(\s*true\s*\)|Thread\.sleep|time\.sleep|sleep\(/i,
    severity: "MEDIUM",
    category: "performance",
    description: "Blocking operation may freeze main thread",
  },
];

const MEMORY_RULES: Rule[] = [
  {
    type: "MEMORY_LEAK_LISTENER",
    regex:
      /addEventListener\s*\((?!.*removeEventListener)|\.on\s*\(\s*['"][^'"]+['"](?!.*\.off\s*\(|\.removeListener)/i,
    severity: "MEDIUM",
    category: "memory",
    description: "Event listener added without cleanup",
  },
  {
    type: "MEMORY_LEAK_INTERVAL",
    regex: /setInterval\s*\((?!.*clearInterval)/i,
    severity: "MEDIUM",
    category: "memory",
    description: "setInterval without corresponding clearInterval",
  },
  {
    type: "MEMORY_LEAK_TIMEOUT",
    regex: /setTimeout\s*\((?!.*clearTimeout)/i,
    severity: "LOW",
    category: "memory",
    description: "setTimeout without cleanup reference",
  },
  {
    type: "UNCLOSED_RESOURCE",
    regex:
      /\.open\s*\(|new\s+(?:FileReader|BufferedReader|Connection|Socket)\s*\(|createReadStream/i,
    severity: "MEDIUM",
    category: "memory",
    description: "Resource opened without visible close/cleanup",
  },
  {
    type: "GLOBAL_MUTABLE_STATE",
    regex: /(?:^|\n)\s*(?:var|let)\s+\w+\s*=\s*(?:\[|\{|new\s)/i,
    severity: "LOW",
    category: "memory",
    description: "Global mutable state — potential memory accumulation",
  },
  {
    type: "UNBOUNDED_CACHE",
    regex:
      /cache\s*\[\s*\w+\s*\]\s*=|\.set\s*\(\s*\w+\s*,(?!.*(?:maxSize|limit|TTL|expir))/i,
    severity: "MEDIUM",
    category: "memory",
    description: "Cache without size limit or TTL",
  },
  {
    type: "LARGE_BUFFER_ALLOC",
    regex:
      /Buffer\.alloc\(\s*\d{6,}|new\s+ArrayBuffer\(\s*\d{6,}|malloc\(\s*\d{6,}/i,
    severity: "MEDIUM",
    category: "memory",
    description: "Large buffer allocation",
  },
];

const BEST_PRACTICE_RULES: Rule[] = [
  {
    type: "TODO_FIXME",
    regex: /\/\/\s*(?:TODO|FIXME|HACK|XXX|BUG):/i,
    severity: "LOW",
    category: "best-practice",
    description: "Unresolved TODO/FIXME comment",
  },
  {
    type: "MAGIC_NUMBER",
    regex:
      /(?:if|while|for|return|===?|!==?|>|<|>=|<=)\s*\(?\s*\d{3,}(?!\.\d|px|rem|em|vh|vw|%)/i,
    severity: "LOW",
    category: "best-practice",
    description: "Magic number — use a named constant",
  },
  {
    type: "CONSOLE_IN_PRODUCTION",
    regex: /console\.(log|debug|info|warn|error)\s*\(/i,
    severity: "LOW",
    category: "best-practice",
    description: "Console statement left in code",
  },
  {
    type: "DEPRECATED_API",
    regex: /__proto__|arguments\.callee|document\.all|escape\(|unescape\(/i,
    severity: "MEDIUM",
    category: "best-practice",
    description: "Deprecated API usage",
  },
  {
    type: "ANY_TYPE",
    regex: /:\s*any\b|as\s+any\b|<any>/i,
    severity: "LOW",
    category: "best-practice",
    description: "TypeScript 'any' type reduces type safety",
  },
  {
    type: "EMPTY_CATCH",
    regex: /catch\s*\([^)]*\)\s*\{\s*\}/i,
    severity: "MEDIUM",
    category: "best-practice",
    description: "Empty catch block silences errors",
  },
  {
    type: "GOD_FUNCTION",
    regex: /(?:function|def|fn|func)\s+\w+/i,
    severity: "LOW",
    category: "best-practice",
    description: "Potential flag — verify function length",
  },
  {
    type: "HARDCODED_TIMEOUT",
    regex: /timeout\s*[:=]\s*\d{4,}|setTimeout\s*\([^,]+,\s*\d{4,}/i,
    severity: "LOW",
    category: "best-practice",
    description: "Hardcoded timeout value — use a constant",
  },
  {
    type: "TRIPLE_NEST",
    regex:
      /\{\s*(?:if|for|while)[\s\S]*?\{\s*(?:if|for|while)[\s\S]*?\{\s*(?:if|for|while)/i,
    severity: "LOW",
    category: "best-practice",
    description: "Deeply nested control flow",
  },
];

const ERROR_HANDLING_RULES: Rule[] = [
  {
    type: "UNHANDLED_PROMISE",
    regex: /\.then\s*\([^)]*\)\s*(?!\.catch|;\s*$)/i,
    severity: "MEDIUM",
    category: "error-handling",
    description: "Promise chain without .catch()",
  },
  {
    type: "GENERIC_CATCH",
    regex:
      /catch\s*\(\s*(?:Exception|Error|e|err|error)\s*\)\s*\{[^}]*throw\b/i,
    severity: "LOW",
    category: "error-handling",
    description: "Catch-and-rethrow without added context",
  },
  {
    type: "MISSING_AWAIT",
    regex: /=\s*(?:fetch|axios\.|prisma\.|db\.)\w+\s*\(/i,
    severity: "MEDIUM",
    category: "error-handling",
    description: "Async call may be missing await",
  },
  {
    type: "THROW_STRING",
    regex: /throw\s+['"`]/i,
    severity: "MEDIUM",
    category: "error-handling",
    description: "Throwing string literal instead of Error object",
  },
  {
    type: "IGNORE_RETURN_VALUE",
    regex: /^\s*(?:fetch|axios\.\w+|db\.\w+)\s*\(/i,
    severity: "LOW",
    category: "error-handling",
    description: "Return value from important call ignored",
  },
  {
    type: "PROCESS_EXIT",
    regex: /process\.exit\s*\(|os\.exit\s*\(|System\.exit\s*\(/i,
    severity: "MEDIUM",
    category: "error-handling",
    description: "Hard process exit — may skip cleanup",
  },
];

const CODE_QUALITY_RULES: Rule[] = [
  {
    type: "DUPLICATE_BRANCH",
    regex: /if\s*\([^)]+\)\s*\{([^}]+)\}\s*else\s*\{\s*\1\s*\}/i,
    severity: "LOW",
    category: "code-quality",
    description: "Duplicate code in if/else branches",
  },
  {
    type: "LONG_PARAM_LIST",
    regex: /(?:function|def|fn|func)\s*\w*\s*\([^)]{120,}\)/i,
    severity: "LOW",
    category: "code-quality",
    description: "Function with too many parameters",
  },
  {
    type: "STRING_CONCAT_LOOP",
    regex: /for\s*\(.*\)\s*\{[^}]*(?:\+\s*=\s*['"`]|\+\s*String)/i,
    severity: "LOW",
    category: "code-quality",
    description: "String concatenation in loop — use builder/join",
  },
  {
    type: "DOUBLE_NEGATION",
    regex: /!!\s*\w|(?:!=|!==)\s*(?:null|undefined|false)\s*&&\s*(?:!=|!==)/i,
    severity: "LOW",
    category: "code-quality",
    description: "Confusing double negation",
  },
];

const ALL_RULES: Rule[] = [
  ...SECURITY_RULES,
  ...PERFORMANCE_RULES,
  ...MEMORY_RULES,
  ...BEST_PRACTICE_RULES,
  ...ERROR_HANDLING_RULES,
  ...CODE_QUALITY_RULES,
];

export type AnalysisMode = "quick" | "standard" | "deep";

interface AnalyzeOptions {
  language?: string;
  framework?: string;
  analysisMode?: AnalysisMode;
}

export interface Finding {
  fileName: string;
  lineNumber: number;
  snippet: string;
  issueType: string;
  severity: string;
  category: IssueCategory;
  description: string;
  aiExplanation?: string | null;
  aiFixSnippet?: string | null;
}

export async function analyzeCode(
  code: string,
  fileName: string,
  options: AnalyzeOptions = {},
): Promise<Finding[]> {
  const {
    language = "java",
    framework = "none",
    analysisMode = "standard",
  } = options;
  const lines = code.split("\n");
  const strippedLines = stripComments(code);
  const findings: Finding[] = [];
  const seenLines = new Set<string>();

  // Determine which rules to run based on analysis mode
  const rulesToRun =
    analysisMode === "quick"
      ? [...SECURITY_RULES, ...PERFORMANCE_RULES, ...ERROR_HANDLING_RULES]
      : ALL_RULES;

  // 1. Static regex pass on comment-stripped lines (all modes)
  for (let i = 0; i < strippedLines.length; i++) {
    const line = strippedLines[i];
    if (!line.trim()) continue;
    for (const rule of rulesToRun) {
      if (rule.regex.test(line)) {
        const key = `${rule.type}:${i}`;
        if (seenLines.has(key)) continue;
        seenLines.add(key);
        findings.push({
          fileName,
          lineNumber: i + 1,
          snippet: lines[i].trim(),
          issueType: rule.type,
          severity: rule.severity,
          category: rule.category,
          description: rule.description,
        });
      }
    }
  }

  // Quick mode: return regex-only findings
  if (analysisMode === "quick") {
    return findings.map((f) => ({
      ...f,
      aiExplanation: f.description,
      aiFixSnippet: null,
    }));
  }

  const langLabel = `${language}${framework !== "none" ? ` (${framework})` : ""}`;

  // 2. AI enrichment for regex findings (standard + deep)
  if (findings.length > 0) {
    const batchPrompt = `You are an expert ${langLabel} engineer specializing in security, performance, and code quality.
Analyze these ${findings.length} code issues found by static analysis. For EACH issue, provide a specific explanation and a concrete fix.

Issues:
${findings.map((f, i) => `[${i}] Type: ${f.issueType} | Category: ${f.category} | Line ${f.lineNumber}: "${f.snippet}"`).join("\n")}

Return a JSON object with key "results" containing an array of objects. Each object at index i must have:
"explanation": 1-2 sentence explanation of why this is a problem and its real-world impact.
"fix_snippet": A minimal, safe ${language} code fix. Must be actual code, not a description.

Return exactly ${findings.length} results in order.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: batchPrompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const aiData = JSON.parse(
        completion.choices[0]?.message?.content || '{"results":[]}',
      );
      const results = Array.isArray(aiData.results) ? aiData.results : [];
      for (let i = 0; i < findings.length; i++) {
        if (results[i]) {
          findings[i].aiExplanation =
            results[i].explanation || findings[i].description;
          findings[i].aiFixSnippet = results[i].fix_snippet || null;
        } else {
          findings[i].aiExplanation = findings[i].description;
        }
      }
    } catch (e) {
      console.error("Groq batch enrichment error", e);
      for (const f of findings) {
        f.aiExplanation = f.description;
      }
    }
  }

  // 3. Standard mode: focused AI scan to find additional issues regex missed
  if (analysisMode === "standard") {
    const codeSlice = code.slice(0, 6000);
    const standardPrompt = `You are an expert ${langLabel} security and quality engineer. Review this code and find issues that simple pattern matching would MISS. Focus on:
- Logic flaws and business logic vulnerabilities
- Authentication/authorization gaps
- Input validation issues
- Race conditions
- Data flow issues (tainted data reaching sensitive sinks)
- Missing null/error checks at boundaries
${framework !== "none" ? `- ${framework}-specific anti-patterns` : ""}

Do NOT report issues that are obvious from simple regex patterns (like console.log, TODO comments, etc). Only report issues requiring deeper understanding.

Code:
\`\`\`${language.toLowerCase()}
${codeSlice}
\`\`\`

Return a JSON object with key "issues" containing an array (3-8 issues if the code has problems, empty if clean). Each issue MUST have:
"issueType": SHORT_IDENTIFIER,
"severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
"category": one of "security" | "performance" | "memory" | "best-practice" | "error-handling" | "code-quality",
"lineNumber": approximate line number (integer, 0 if unsure),
"snippet": the relevant code (max 120 chars),
"description": short label,
"explanation": 1-2 sentence description with real-world impact,
"fix_snippet": minimal working ${language} code fix.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: standardPrompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const aiData = JSON.parse(
        completion.choices[0]?.message?.content || '{"issues":[]}',
      );
      const aiIssues = Array.isArray(aiData.issues) ? aiData.issues : [];
      for (const issue of aiIssues) {
        const isDuplicate = findings.some(
          (f) =>
            (f.lineNumber === issue.lineNumber &&
              f.issueType === issue.issueType) ||
            (f.lineNumber === issue.lineNumber &&
              f.category === issue.category),
        );
        if (!isDuplicate) {
          const cat = [
            "security",
            "performance",
            "memory",
            "best-practice",
            "error-handling",
            "code-quality",
          ].includes(issue.category)
            ? (issue.category as IssueCategory)
            : "code-quality";
          findings.push({
            fileName,
            lineNumber: issue.lineNumber || 0,
            snippet: (issue.snippet || "").slice(0, 200),
            issueType: issue.issueType || "AI_FINDING",
            severity: issue.severity || "MEDIUM",
            category: cat,
            description: issue.description || issue.explanation || "",
            aiExplanation: issue.explanation || null,
            aiFixSnippet: issue.fix_snippet || null,
          });
        }
      }
    } catch (e) {
      console.error("Groq standard analysis error", e);
    }
  }

  // 4. Deep mode: exhaustive multi-category AI audit
  if (analysisMode === "deep") {
    const codeSlice = code.slice(0, 8000);
    const deepPrompt = `You are a world-class ${langLabel} code auditor. Perform an exhaustive analysis of this code covering ALL of the following categories:

## SECURITY
- OWASP Top 10 (injection, broken auth, sensitive data exposure, XXE, broken access control, security misconfiguration, XSS, insecure deserialization, components with vulnerabilities, insufficient logging)
- Authentication/authorization flaws
- Input validation gaps
- Cryptographic weaknesses
- SSRF, CSRF, race conditions
${framework !== "none" ? `- ${framework}-specific security pitfalls` : ""}

## PERFORMANCE
- N+1 queries, unbounded queries
- Unnecessary allocations or copies
- Blocking operations in async contexts
- Algorithmic complexity issues
- Missing caching opportunities

## MEMORY & RESOURCE MANAGEMENT
- Resource leaks (connections, file handles, streams)
- Event listener leaks
- Unbounded data structures
- Missing cleanup/disposal

## ERROR HANDLING
- Unhandled exceptions/rejections
- Swallowed errors
- Missing validation at boundaries
- Incomplete error recovery

## CODE QUALITY & BEST PRACTICES
- Dead code, unreachable branches
- Code duplication
- Missing null/undefined checks
- Improper type usage
${language === "TypeScript" ? "- Unsafe 'any' types, missing type guards" : ""}
${framework !== "none" ? `- ${framework} anti-patterns and best practices` : ""}

Code:
\`\`\`${language.toLowerCase()}
${codeSlice}
\`\`\`

Return a JSON object with key "issues" containing an array. Each issue MUST have:
"issueType": SHORT_IDENTIFIER (e.g. "MISSING_INPUT_VALIDATION"),
"severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
"category": one of "security" | "performance" | "memory" | "best-practice" | "error-handling" | "code-quality",
"lineNumber": approximate line number (integer, 0 if unsure),
"snippet": the relevant code snippet (max 120 chars),
"description": short label for the issue,
"explanation": 2-3 sentence description with real-world impact,
"fix_snippet": minimal working ${language} code to fix it.

Be thorough. Find at least 3 issues if the code has any problems. If the code is genuinely clean, return {"issues": []}.`;

    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: deepPrompt }],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
      });
      const aiData = JSON.parse(
        completion.choices[0]?.message?.content || '{"issues":[]}',
      );
      const deepIssues = Array.isArray(aiData.issues) ? aiData.issues : [];
      for (const issue of deepIssues) {
        const isDuplicate = findings.some(
          (f) =>
            f.lineNumber === issue.lineNumber &&
            f.issueType === issue.issueType,
        );
        if (!isDuplicate) {
          const cat = [
            "security",
            "performance",
            "memory",
            "best-practice",
            "error-handling",
            "code-quality",
          ].includes(issue.category)
            ? (issue.category as IssueCategory)
            : "code-quality";
          findings.push({
            fileName,
            lineNumber: issue.lineNumber || 0,
            snippet: (issue.snippet || "").slice(0, 200),
            issueType: issue.issueType || "AI_FINDING",
            severity: issue.severity || "MEDIUM",
            category: cat,
            description: issue.description || issue.explanation || "",
            aiExplanation: issue.explanation || null,
            aiFixSnippet: issue.fix_snippet || null,
          });
        }
      }
    } catch (e) {
      console.error("Groq deep analysis error", e);
    }
  }

  // Sort by severity priority
  const severityOrder: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };
  findings.sort(
    (a, b) =>
      (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4),
  );

  return findings;
}
