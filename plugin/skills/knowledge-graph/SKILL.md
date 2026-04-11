---
name: knowledge-graph
description: >-
  Generate structured knowledge markdown files from codebases.
  Trigger when user says: "map this codebase", "generate knowledge graph",
  "knowledge graph", "document the architecture", "create knowledge files",
  "analyze codebase structure", "map the code", "kg", or needs a codebase
  understanding before starting work. Use "refresh" to update incrementally.
allowed-tools: Read, Write, Glob, Grep, Bash
argument-hint: "[refresh] [path1] [path2...]"
---

# Knowledge Graph Generator

Generate structured knowledge markdown files that give agents complete codebase understanding without re-reading source code. Inspired by GitNexus's precomputed relational intelligence — module boundaries, call directions, execution flows, entry points, and functional clusters — but using only Claude's built-in tools.

## When to Use

- Starting work on an unfamiliar codebase
- Onboarding to a new project or multi-repo system
- Need to understand codebase architecture before planning
- Want agents to work efficiently without repeated source code reads
- Mapping how multiple codebases connect to each other

## When NOT to Use

- Single-file changes where you already know the context
- Codebase already has `.claude/knowledge/INDEX.md` and it's current — read that instead
- Just need to find one function or file — use Grep/Glob directly

## Mode Detection

Parse `$ARGUMENTS`:
- **No args or path(s):** Full generation mode — run all 4 phases
- **`refresh`:** Incremental mode — detect changes, update affected modules only
- **Multiple paths:** Multi-repo mode — analyze each repo + map cross-repo connections

## Pre-Flight Checks

1. If `.claude/knowledge/INDEX.md` exists, read it to check staleness
2. Detect primary language from config files (see [references/language-patterns.md](references/language-patterns.md))
3. Set `TARGET_DIR` = first path argument, or current working directory
4. Set `KNOWLEDGE_DIR` = `{TARGET_DIR}/.claude/knowledge`

---

# FULL GENERATION MODE

## Phase 1: Structure Scan

**Goal:** Map codebase structure, identify project characteristics.
**Budget:** Read ONLY config files, README, and directory listings. Do NOT read source code yet.

### Steps

1. **File tree discovery:**
   ```
   Glob("**/*.{ts,tsx,js,jsx,py,go,rs,java,kt,cs,php,rb,swift,dart}")
   ```
   Record total file count, group by extension, identify primary language.

2. **Read config files** (only those that exist):
   - `package.json`, `tsconfig.json`, `vite.config.*`, `next.config.*`
   - `pyproject.toml`, `requirements.txt`, `setup.py`, `Pipfile`
   - `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle*`
   - `*.csproj`, `composer.json`, `Gemfile`, `pubspec.yaml`
   - `Makefile`, `Dockerfile`, `docker-compose.*`
   - `.env.example` (never `.env`)

3. **Read README** (first 200 lines)

4. **Git context:**
   ```bash
   git log --oneline -20
   git remote -v
   ```

5. **Identify project type:**
   - Monorepo: multiple `package.json` / `go.mod` / `Cargo.toml` in subdirectories
   - Single-app: one main config at root
   - Library: `exports` or `main` field, no routes/handlers
   - Microservice: Dockerfile + small file count + API routes
   - CLI tool: `bin` field or `main` entry with commander/clap/cobra

6. **Map source directory structure:**
   ```bash
   find {src_dir} -type d -maxdepth 3 | head -50
   ```

7. **Write `architecture.md`** following [references/output-templates.md](references/output-templates.md)

## Phase 2: Module Discovery & Mapping

**Goal:** Identify modules, their boundaries, public interfaces, and inter-module dependencies.
**Strategy:** Group by directory → verify with import analysis → document each module.

### Steps

1. **Identify candidate modules:**
   - List top-level directories under the source root (e.g., `src/auth/`, `src/api/`, `src/db/`)
   - Each directory with 2+ source files is a candidate module
   - Special cases: `lib/`, `pkg/`, `internal/`, `app/` are containers — use their children as modules
   - Monorepo: each package/workspace is a module

2. **For each candidate module, gather:**

   a. **Exports** — Grep for export patterns matching the primary language:
   ```
   Grep(pattern=<export_pattern>, path=<module_dir>, glob=<lang_glob>)
   ```

   b. **Imports from other modules** — Grep for import patterns, filter to cross-module:
   ```
   Grep(pattern=<import_pattern>, path=<module_dir>, glob=<lang_glob>)
   ```

   c. **File count and key files:**
   ```
   Glob("<module_dir>/**/*.<ext>")
   ```

   d. **Index/barrel files** — Read these to understand public API:
   ```
   Read("index.ts"), Read("mod.rs"), Read("__init__.py"), Read("package-info.java")
   ```

3. **Spawn parallel subagents** for deep module analysis (one per module, max 5 concurrent):

   Each subagent receives:
   - Module name and directory path
   - File list
   - Export list (from step 2a)
   - Import list (from step 2b)
   - Language patterns reference

   Each subagent does:
   - Read key files (entry points, main classes, index files) — max 10 files per module
   - Map internal call graph (which exported functions call which)
   - Identify module entry points (most-called exported functions)
   - Write `modules/{module-name}.md` following the output template

4. **Build dependency edges:**
   For each module's imports, record: `{source_module} --imports--> {target_module}: {symbols}`

5. **Write draft `dependencies.md`** with mermaid graph

## Phase 3: Entry Points & Flow Tracing

**Goal:** Find where execution starts and trace key flows across modules.
**Strategy:** GitNexus-inspired heuristic entry point scoring + forward call chain tracing.

### Entry Point Detection

1. **Grep for entry point patterns** from [references/language-patterns.md](references/language-patterns.md):
   - Route handlers (Express, Flask, Spring, etc.)
   - CLI commands (commander, click, cobra)
   - Main functions
   - Event listeners and message handlers
   - Scheduled tasks

2. **Score candidates** (adapted from GitNexus entry-point-scoring):
   - **Export boost (+0.3):** Exported/public functions rank higher
   - **Name patterns (+0.2):** `handle*`, `on*`, `process*`, `create*`, `init*`, `setup*`
   - **Framework markers (+0.4):** Route decorators, controller annotations, handler registrations
   - **File location (+0.1):** Files in `routes/`, `handlers/`, `controllers/`, `api/`, `cmd/`

3. **Select top 10-15 entry points** by score

### Flow Tracing

For each selected entry point:

1. **Read the entry point function** — identify what it calls
2. **Follow call chain forward** (max depth 8):
   - Read each callee function
   - Record: step number, symbol name, file path, module name
   - Stop at: external library calls, database queries, HTTP responses, recursive calls
3. **Identify error paths** — catch blocks, error returns, validation failures
4. **Determine flow type:** API request / CLI command / event handler / cron job / message handler
5. **Write `flows/{flow-name}.md`** following the output template

### Parallel Execution

Spawn parallel subagents for flow tracing (one per entry point group, max 3 concurrent). Group entry points by module to reduce redundant file reads.

## Phase 4: Compilation & Cross-Referencing

**Goal:** Generate INDEX.md, conventions.md, finalize all cross-references.

### Steps

1. **Read all generated knowledge files:**
   ```
   Glob(".claude/knowledge/modules/*.md")
   Glob(".claude/knowledge/flows/*.md")
   Read(".claude/knowledge/architecture.md")
   Read(".claude/knowledge/dependencies.md")
   ```

2. **Generate `conventions.md`:**
   From patterns observed across all modules:
   - Naming conventions (files, functions, classes, constants)
   - File organization patterns
   - Error handling approach
   - Testing patterns (if test files found)
   - Import style and path aliases
   - Framework-specific conventions

3. **Finalize `dependencies.md`:**
   - Add mermaid diagram with all modules and edges
   - Add import matrix table
   - List external package dependencies
   - Flag circular dependencies

4. **Generate `INDEX.md`:**
   - Project summary (from architecture.md)
   - Module index with one-line descriptions
   - Top flows with entry points
   - Quick reference section: "How do I find X?" answers
   - File-to-module mapping table

5. **Cross-reference pass:**
   - Ensure every module file links to its flows
   - Ensure every flow file links back to its modules
   - Ensure INDEX.md links to everything
   - Verify all relative links are correct

---

# REFRESH MODE

Triggered by: `/knowledge-graph refresh`

1. **Detect changes:**
   ```bash
   git diff --name-only HEAD~5 -- '*.ts' '*.tsx' '*.js' '*.py' '*.go' '*.rs' '*.java' '*.kt' '*.cs' '*.php' '*.rb'
   ```

2. **Map changed files to modules:**
   Read `INDEX.md` file map to find which module each changed file belongs to.

3. **Re-analyze affected modules only:**
   - Re-run Phase 2 steps for each affected module
   - Regenerate that module's `modules/{name}.md`

4. **Update affected flows:**
   - Read existing flow files
   - If any flow step references a changed file, re-trace that flow

5. **Regenerate INDEX.md and dependencies.md**
   (These are cheap to regenerate — they summarize module files)

---

# MULTI-REPO MODE

Triggered by: `/knowledge-graph /path/repo1 /path/repo2 ...`

### Per-Repo Analysis

1. For each repo path, run Phases 1-3 in parallel subagents:
   - Each subagent writes to `.claude/knowledge/repos/{repo-name}/`
   - Uses the same module/flow analysis pipeline

### Cross-Repo Connection Mapping

After all repos are analyzed:

1. **Detect inter-repo communication:**
   - Grep for HTTP client calls (fetch, axios, http.Get, requests.get)
   - Grep for shared package imports (workspace packages, git dependencies)
   - Grep for shared type definitions
   - Grep for event/message patterns (publish/subscribe, queue names)

2. **Match providers to consumers:**
   - Route definitions in repo A ↔ HTTP calls in repo B
   - Event publishers in repo A ↔ Event subscribers in repo B
   - Shared types defined in repo A ↔ imported in repo B

3. **Write connection files:**
   - `connections/{repo1-to-repo2}.md` for each pair with connections
   - `system-map.md` with overview and mermaid architecture diagram

4. **Write system-level INDEX.md:**
   - Links to each repo's knowledge
   - System architecture overview
   - Cross-repo flow summaries

---

# OUTPUT RULES

1. **Write to `{TARGET_DIR}/.claude/knowledge/`** — create the directory structure
2. **Follow templates exactly** from [references/output-templates.md](references/output-templates.md)
3. **Use relative links** between knowledge files (e.g., `../flows/login.md`)
4. **Keep module files under 300 lines** — split large modules into sub-modules
5. **Keep flow files under 100 lines** — focus on the happy path + key error paths
6. **Use kebab-case for filenames** (e.g., `user-authentication.md`, `api-routes.md`)
7. **Never include full source code** in knowledge files — only symbol names, signatures, and one-line descriptions
8. **Include line numbers** where possible (e.g., `src/auth/login.ts:45`)
9. **Mermaid diagrams** in dependencies.md and architecture.md — keep under 15 nodes

# EFFICIENCY RULES

1. **Read each source file at most once** — extract all needed info in a single pass
2. **Grep before Read** — use Grep to find relevant files, only Read what's needed
3. **Parallel subagents** for independent module analysis and flow tracing
4. **Config files are cheap** — read all of them in Phase 1
5. **Index/barrel files first** — they reveal module structure without reading internals
6. **Skip generated files** — ignore `dist/`, `build/`, `node_modules/`, `.next/`, `vendor/`
7. **Skip test files in module analysis** — mention testing patterns in conventions.md only
8. **Max 10 source files read per module** — prioritize entry points and public API files
