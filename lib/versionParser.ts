/**
 * Version/Dependency Parser
 * Extracts package versions from config files (package.json, requirements.txt, etc.)
 */

export interface ParsedDependency {
  package: string;
  version: string;
  type: "prod" | "dev" | "optional";
}

/**
 * Parse package.json and extract all dependencies with versions
 */
export function parsePackageJson(content: string): ParsedDependency[] {
  try {
    const pkg = JSON.parse(content);
    const dependencies: ParsedDependency[] = [];

    // Regular dependencies
    if (pkg.dependencies && typeof pkg.dependencies === "object") {
      for (const [name, version] of Object.entries(pkg.dependencies)) {
        dependencies.push({
          package: name,
          version: String(version),
          type: "prod",
        });
      }
    }

    // Dev dependencies
    if (pkg.devDependencies && typeof pkg.devDependencies === "object") {
      for (const [name, version] of Object.entries(pkg.devDependencies)) {
        dependencies.push({
          package: name,
          version: String(version),
          type: "dev",
        });
      }
    }

    // Optional dependencies
    if (
      pkg.optionalDependencies &&
      typeof pkg.optionalDependencies === "object"
    ) {
      for (const [name, version] of Object.entries(pkg.optionalDependencies)) {
        dependencies.push({
          package: name,
          version: String(version),
          type: "optional",
        });
      }
    }

    return dependencies;
  } catch {
    return [];
  }
}

/**
 * Parse requirements.txt (Python) and extract dependencies
 * Format: package==version or package>=version
 */
export function parseRequirementsTxt(content: string): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Skip lines with -r, -e, or other options
    if (trimmed.startsWith("-")) continue;

    // Parse version specifier (==, >=, <=, !=, ~=, etc.)
    const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)([=!<>~]+)(.+?)(?:\s*#|$)/);
    if (match) {
      const [, pkg, operator, version] = match;
      dependencies.push({
        package: pkg.toLowerCase(),
        version: `${operator}${version.trim()}`,
        type: "prod",
      });
    } else {
      // No version specifier, just package name
      const pkgName = trimmed.split(/[\s;#]/)[0];
      if (pkgName) {
        dependencies.push({
          package: pkgName.toLowerCase(),
          version: "any",
          type: "prod",
        });
      }
    }
  }

  return dependencies;
}

/**
 * Parse pyproject.toml and extract dependencies (simplified)
 * Looks for [project] dependencies and [tool.poetry] dependencies
 */
export function parsePyprojectToml(content: string): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  // Look for [project] section with dependencies list
  const projectMatch = content.match(/\[project\]([\s\S]*?)(?=\[|$)/);
  if (projectMatch) {
    const projectSection = projectMatch[1];
    const depsMatch = projectSection.match(/dependencies\s*=\s*\[([\s\S]*?)\]/);
    if (depsMatch) {
      const depsStr = depsMatch[1];
      const lines = depsStr.split(",").map((l) => l.trim());
      for (const line of lines) {
        const cleaned = line.replace(/["']/g, "").trim();
        if (cleaned) {
          const [pkg, version] = cleaned.split(/[=!<>~]/);
          if (pkg) {
            dependencies.push({
              package: pkg.trim(),
              version: version ? `${cleaned.substring(pkg.length)}` : "any",
              type: "prod",
            });
          }
        }
      }
    }
  }

  // Look for [tool.poetry] section
  const poetryMatch = content.match(
    /\[tool\.poetry\.dependencies\]([\s\S]*?)(?=\[|$)/,
  );
  if (poetryMatch) {
    const poetrySection = poetryMatch[1];
    const lines = poetrySection.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)\s*=\s*"(.+?)"/);
      if (match) {
        const [, pkg, version] = match;
        dependencies.push({
          package: pkg.toLowerCase(),
          version,
          type: "prod",
        });
      }
    }
  }

  return dependencies;
}

/**
 * Gemfile (Ruby) parser
 */
export function parseGemfile(content: string): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Match: gem 'name' or gem 'name', '1.0'
    const match = trimmed.match(
      /gem\s+['"]([^'"]+)['"](?:\s*,\s*['"]([^'"]+)['"])?/,
    );
    if (match) {
      const [, pkg, version] = match;
      dependencies.push({
        package: pkg,
        version: version || "any",
        type: "prod",
      });
    }
  }

  return dependencies;
}

/**
 * pom.xml (Maven/Java) parser
 */
export function parsePomXml(content: string): ParsedDependency[] {
  const dependencies: ParsedDependency[] = [];

  // Find all <dependency> blocks
  const depMatches = content.matchAll(/<dependency>([\s\S]*?)<\/dependency>/g);

  for (const match of depMatches) {
    const depBlock = match[1];

    // Extract artifactId and version
    const idMatch = depBlock.match(/<artifactId>([^<]+)<\/artifactId>/);
    const versionMatch = depBlock.match(/<version>([^<]+)<\/version>/);

    if (idMatch) {
      const [, artifactId] = idMatch;
      const [, version] = versionMatch || ["", "unknown"];
      dependencies.push({
        package: artifactId,
        version,
        type: "prod",
      });
    }
  }

  return dependencies;
}

/**
 * Detect file type and parse accordingly
 */
export function parseConfigFile(
  fileName: string,
  content: string,
): ParsedDependency[] {
  const lowerFileName = fileName.toLowerCase();

  if (lowerFileName === "package.json") {
    return parsePackageJson(content);
  } else if (lowerFileName === "requirements.txt") {
    return parseRequirementsTxt(content);
  } else if (lowerFileName === "pyproject.toml") {
    return parsePyprojectToml(content);
  } else if (lowerFileName === "gemfile") {
    return parseGemfile(content);
  } else if (lowerFileName === "pom.xml") {
    return parsePomXml(content);
  }

  return [];
}
