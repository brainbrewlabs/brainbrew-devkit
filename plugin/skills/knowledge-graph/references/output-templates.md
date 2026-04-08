# Output Templates

Templates for each knowledge file type. Follow these structures exactly.

## INDEX.md

```markdown
# Knowledge Graph: {Project Name}

> Generated: {date} | {total_modules} modules | {total_flows} flows | {total_files} source files

## Project Summary
{1-3 sentence summary from architecture.md}

## Modules
| Module | Files | Purpose |
|--------|-------|---------|
| [{name}](modules/{slug}.md) | {count} | {one-line purpose} |

## Key Flows
| Flow | Entry Point | Modules Crossed |
|------|-------------|-----------------|
| [{name}](flows/{slug}.md) | {entry_symbol} | {module1}, {module2} |

## Quick Reference
- "How does {feature} work?" → Read [modules/{module}.md](modules/{module}.md) + [flows/{flow}.md](flows/{flow}.md)
- "What happens when {action}?" → Read [flows/{flow}.md](flows/{flow}.md)
- "What depends on {module}?" → Check "Depended On By" in [modules/{module}.md](modules/{module}.md)
- "What would break if I change {file}?" → Find its module, check Impact Notes section

## File Map
| Directory | Module | Role |
|-----------|--------|------|
| src/{dir}/ | [{module}](modules/{slug}.md) | {role} |

## See Also
- [Architecture](architecture.md) — tech stack, project type, directory layout
- [Dependencies](dependencies.md) — module dependency graph
- [Conventions](conventions.md) — coding patterns and standards
```

## architecture.md

```markdown
# Architecture: {Project Name}

## Overview
{2-4 sentences: what the project does, who it serves, primary technology}

## Tech Stack
| Layer | Technology | Config |
|-------|------------|--------|
| Language | {lang} {version} | {tsconfig.json / go.mod / etc.} |
| Framework | {framework} {version} | {config file} |
| Build | {build tool} | {config file} |
| Test | {test framework} | {config file} |
| Database | {db} | {connection config} |

## Project Type
{monorepo / single-app / library / microservice / CLI tool}

## Directory Structure
```
{project}/
├── {src_dir}/           # Source code ({X} files)
│   ├── {module_dir}/    # {module purpose}
│   └── ...
├── {test_dir}/          # Tests ({Y} files)
├── {config_files}       # Configuration
└── {other_dirs}         # {purposes}
```

## Module Map
```mermaid
graph LR
  {Module1} --> {Module2}
  {Module2} --> {Module3}
  ...
```

## Key Patterns
- **{Pattern Name}**: {brief description of architectural pattern used}
- **{Pattern Name}**: {brief description}

## Entry Points
- `{main_entry}` — {what it does}
- `{secondary_entry}` — {what it does}
```

## modules/{name}.md

```markdown
# Module: {Name}

> {file_count} files | {export_count} exports | Cohesion: {brief functional description}

## Purpose
{2-3 sentences: what this module does, why it exists, what domain it covers}

## Key Files
| File | Role | Key Exports |
|------|------|-------------|
| {path} | {role} | `{export1}`, `{export2}` (+{N}) |

## Entry Points
- `{symbol}()` — {file}:{line} — {brief description}

## Internal Call Graph
{caller} --> {callee} --> {deeper_callee}
{caller} --> {other_callee}

## Dependencies (imports from other modules)
- **{Module}**: `{symbol1}`, `{symbol2}` — {why}

## Depended On By (other modules import from here)
- **{Module}**: imports `{symbol1}`, `{symbol2}`

## Execution Flows
-> [{Flow Name}](../flows/{slug}.md) — steps {N}-{M}

## Impact Notes
Changing `{key_symbol}` affects: {list of impacted areas}
```

## flows/{name}.md

```markdown
# Flow: {Name}

> Type: {API request / CLI command / event handler / cron job / message handler}
> Entry: {entry point description}
> {step_count} steps | Modules: {module1}, {module2}, {module3}

## Steps
| # | Symbol | File | Module |
|---|--------|------|--------|
| 1 | `{symbol}` | {file_path} | {module} |
| 2 | `{symbol}` | {file_path} | {module} |

## Description
{Brief narrative of what happens in this flow, end to end}

## Error Paths
- Step {N} fails -> {error response/behavior}

## Data Flow
{input} -> {transform1} -> {transform2} -> {output}

## Related Flows
- [{Other Flow}]({slug}.md) — {relationship description}
```

## dependencies.md

```markdown
# Module Dependencies

## Dependency Graph
```mermaid
graph TD
  subgraph Core
    {Module1}
    {Module2}
  end
  subgraph Features
    {Module3}
    {Module4}
  end
  {Module3} -->|imports| {Module1}
  {Module4} -->|imports| {Module1}
  {Module4} -->|imports| {Module2}
```

## Import Matrix
| Module | Depends On | Depended On By |
|--------|-----------|----------------|
| {Name} | {Module1}, {Module2} | {Module3} |

## External Dependencies
| Package | Used By | Purpose |
|---------|---------|---------|
| {package} | {module1}, {module2} | {why} |

## Circular Dependencies
{list any circular imports, or "None detected"}
```

## conventions.md

```markdown
# Conventions: {Project Name}

## Naming
- Files: {kebab-case / camelCase / snake_case}
- Functions: {camelCase / snake_case / PascalCase}
- Classes: {PascalCase}
- Constants: {UPPER_SNAKE / camelCase}

## File Organization
- {pattern: e.g., "one class per file", "barrel exports via index.ts"}

## Error Handling
- {pattern: e.g., "try/catch with custom error classes", "Result type"}

## Testing
- Framework: {test framework}
- Location: {co-located / separate __tests__ / test/ directory}
- Pattern: {describe/it / test functions / table-driven}

## Configuration
- {pattern: e.g., "env vars via .env", "config/ directory", "runtime config"}

## Imports
- {pattern: e.g., "path aliases via @/", "relative imports", "barrel exports"}

## Framework-Specific
- {any framework-specific conventions observed}
```

## Multi-Repo: system-map.md

```markdown
# System Map

> {repo_count} repositories | Generated: {date}

## Overview
{2-3 sentences: what the system does as a whole}

## Repositories
| Repo | Type | Primary Language | Role |
|------|------|-----------------|------|
| [{name}](repos/{slug}/architecture.md) | {type} | {lang} | {role} |

## System Architecture
```mermaid
graph LR
  subgraph {Repo1}
    {Service1}
  end
  subgraph {Repo2}
    {Service2}
  end
  {Service1} -->|HTTP / gRPC / events| {Service2}
```

## Communication Patterns
| From | To | Protocol | Purpose |
|------|----|----------|---------|
| {repo1} | {repo2} | {HTTP/gRPC/events/shared-db} | {purpose} |

## Shared Contracts
- {shared types, API specs, protobuf definitions, event schemas}
```

## Multi-Repo: connections/{repo1-to-repo2}.md

```markdown
# Connection: {Repo1} <-> {Repo2}

## API Contracts
| Endpoint/Method | Provider ({Repo1}) | Consumer ({Repo2}) |
|----------------|--------------------|--------------------|
| {endpoint} | {handler function + file} | {client call + file} |

## Shared Types
| Type | Defined In | Used In |
|------|-----------|---------|
| {TypeName} | {repo}:{file} | {repo}:{file} |

## Event Contracts
| Event | Publisher | Subscriber |
|-------|----------|------------|
| {event_name} | {repo}:{handler} | {repo}:{handler} |

## Data Flow
{repo1}:{symbol} --> {protocol} --> {repo2}:{symbol}
```
