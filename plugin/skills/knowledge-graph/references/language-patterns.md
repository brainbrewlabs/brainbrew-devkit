# Language-Specific Grep Patterns

Use these patterns with the Grep tool to extract structural information from codebases.
Detect the primary language from config files, then apply the matching pattern set.

## Language Detection

| Config File | Language |
|-------------|----------|
| `tsconfig.json` or `package.json` with `.ts` | TypeScript |
| `package.json` without `.ts` | JavaScript |
| `requirements.txt`, `pyproject.toml`, `setup.py`, `Pipfile` | Python |
| `go.mod`, `go.sum` | Go |
| `Cargo.toml` | Rust |
| `pom.xml`, `build.gradle` | Java |
| `build.gradle.kts` | Kotlin |
| `*.csproj`, `*.sln` | C# |
| `composer.json` | PHP |
| `Gemfile` | Ruby |
| `Package.swift` | Swift |
| `pubspec.yaml` | Dart |

---

## TypeScript / JavaScript

### Exports
```
pattern: "^export\s+(default\s+)?(function|class|interface|type|enum|const|let|var|abstract)"
glob: "*.{ts,tsx,js,jsx}"
```

### Named Exports (barrel files)
```
pattern: "^export\s+\{[^}]+\}\s+from"
glob: "*.{ts,tsx,js,jsx}"
```

### Imports
```
pattern: "^import\s+.*\s+from\s+['\"]"
glob: "*.{ts,tsx,js,jsx}"
```

### Function Definitions
```
pattern: "(export\s+)?(async\s+)?function\s+\w+|const\s+\w+\s*=\s*(async\s+)?\([^)]*\)\s*=>|const\s+\w+\s*=\s*(async\s+)?function"
glob: "*.{ts,tsx,js,jsx}"
```

### Class Definitions
```
pattern: "(export\s+)?(default\s+)?(abstract\s+)?class\s+\w+"
glob: "*.{ts,tsx,js,jsx}"
```

### Route Handlers (Express/Fastify/Hono)
```
pattern: "\.(get|post|put|patch|delete|all|use)\s*\(\s*['\"/]"
glob: "*.{ts,tsx,js,jsx}"
```

### Route Handlers (Next.js App Router)
```
pattern: "export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)"
glob: "*.{ts,tsx,js,jsx}"
```

### React Components
```
pattern: "export\s+(default\s+)?function\s+[A-Z]\w+|export\s+const\s+[A-Z]\w+\s*[=:]"
glob: "*.{tsx,jsx}"
```

### Event Listeners
```
pattern: "\.(on|addEventListener|subscribe|listen)\s*\("
glob: "*.{ts,tsx,js,jsx}"
```

---

## Python

### Exports (__all__)
```
pattern: "^__all__\s*="
glob: "*.py"
```

### Function Definitions
```
pattern: "^(async\s+)?def\s+\w+"
glob: "*.py"
```

### Class Definitions
```
pattern: "^class\s+\w+"
glob: "*.py"
```

### Imports
```
pattern: "^(from\s+\S+\s+import|import\s+\S+)"
glob: "*.py"
```

### Route Handlers (Flask)
```
pattern: "@\w+\.(route|get|post|put|patch|delete)\s*\("
glob: "*.py"
```

### Route Handlers (Django)
```
pattern: "path\s*\(\s*['\"]|re_path\s*\("
glob: "*.py"
```

### Route Handlers (FastAPI)
```
pattern: "@\w+\.(get|post|put|patch|delete)\s*\("
glob: "*.py"
```

### Decorators (general)
```
pattern: "^@\w+"
glob: "*.py"
```

---

## Go

### Function Definitions
```
pattern: "^func\s+(\(\w+\s+\*?\w+\)\s+)?\w+"
glob: "*.go"
```

### Type Definitions
```
pattern: "^type\s+\w+\s+(struct|interface|func)"
glob: "*.go"
```

### Imports
```
pattern: "\"[^\"]+\""
glob: "*.go"
note: "Search within import() blocks"
```

### HTTP Handlers
```
pattern: "(HandleFunc|Handle|http\.(Get|Post|Put|Delete)|\.Methods\()"
glob: "*.go"
```

### Exported Symbols (capitalized)
```
pattern: "^(func|type|var|const)\s+[A-Z]\w+"
glob: "*.go"
```

---

## Rust

### Public Functions
```
pattern: "^pub(\s*\(crate\))?\s+(async\s+)?fn\s+\w+"
glob: "*.rs"
```

### Struct/Enum/Trait Definitions
```
pattern: "^pub(\s*\(crate\))?\s+(struct|enum|trait|type)\s+\w+"
glob: "*.rs"
```

### Use Statements
```
pattern: "^use\s+\S+"
glob: "*.rs"
```

### Module Declarations
```
pattern: "^(pub\s+)?mod\s+\w+"
glob: "*.rs"
```

### Impl Blocks
```
pattern: "^impl(<[^>]+>)?\s+\w+"
glob: "*.rs"
```

### Route Handlers (Actix/Axum/Rocket)
```
pattern: "#\[(get|post|put|patch|delete)\s*\(|\.route\s*\("
glob: "*.rs"
```

---

## Java

### Public Classes/Interfaces
```
pattern: "^public\s+(abstract\s+)?(class|interface|enum|record)\s+\w+"
glob: "*.java"
```

### Public Methods
```
pattern: "public\s+(\w+\s+)*\w+\s*\([^)]*\)\s*(\{|throws)"
glob: "*.java"
```

### Imports
```
pattern: "^import\s+\S+"
glob: "*.java"
```

### Spring Controllers
```
pattern: "@(RestController|Controller|RequestMapping|GetMapping|PostMapping|PutMapping|DeleteMapping)"
glob: "*.java"
```

### Spring Services
```
pattern: "@(Service|Repository|Component|Bean|Configuration)"
glob: "*.java"
```

---

## Kotlin

### Function Definitions
```
pattern: "^(suspend\s+)?fun\s+\w+"
glob: "*.kt"
```

### Class Definitions
```
pattern: "^(data\s+|sealed\s+|abstract\s+|open\s+)?class\s+\w+|^object\s+\w+|^interface\s+\w+"
glob: "*.kt"
```

### Imports
```
pattern: "^import\s+\S+"
glob: "*.kt"
```

### Route Handlers (Ktor/Spring)
```
pattern: "@(GetMapping|PostMapping|PutMapping|DeleteMapping|RequestMapping)|get\s*\(\s*\"|post\s*\(\s*\"|route\s*\(\s*\""
glob: "*.kt"
```

---

## C#

### Public Classes/Interfaces
```
pattern: "public\s+(abstract\s+|sealed\s+|static\s+|partial\s+)*(class|interface|enum|struct|record)\s+\w+"
glob: "*.cs"
```

### Public Methods
```
pattern: "public\s+(static\s+|async\s+|virtual\s+|override\s+)*\w+\s+\w+\s*\("
glob: "*.cs"
```

### Using Statements
```
pattern: "^using\s+\S+"
glob: "*.cs"
```

### Controllers (ASP.NET)
```
pattern: "\[(ApiController|Controller|HttpGet|HttpPost|HttpPut|HttpDelete|Route)\]"
glob: "*.cs"
```

---

## PHP

### Class Definitions
```
pattern: "^(abstract\s+|final\s+)?class\s+\w+|^interface\s+\w+|^trait\s+\w+"
glob: "*.php"
```

### Function Definitions
```
pattern: "^(public|protected|private)?\s*(static\s+)?function\s+\w+|^function\s+\w+"
glob: "*.php"
```

### Use Statements
```
pattern: "^use\s+\S+"
glob: "*.php"
```

### Route Handlers (Laravel)
```
pattern: "Route::(get|post|put|patch|delete|any|match)\s*\("
glob: "*.php"
```

---

## Ruby

### Class/Module Definitions
```
pattern: "^(class|module)\s+\w+"
glob: "*.rb"
```

### Method Definitions
```
pattern: "^\s*def\s+(self\.)?\w+"
glob: "*.rb"
```

### Require Statements
```
pattern: "^require(_relative)?\s+['\"]"
glob: "*.rb"
```

### Route Handlers (Rails)
```
pattern: "(get|post|put|patch|delete|resources|resource|root)\s+['\"/:]"
glob: "*.rb"
path: "config/routes.rb or routes/ directory"
```

---

## Entry Point Patterns (Cross-Language)

### Main Entry Points
```
pattern: "^(async\s+)?function\s+main|^def\s+main|^func\s+main|^fn\s+main|static\s+void\s+main|if\s+__name__\s*==\s*['\"]__main__['\"]"
```

### CLI Command Definitions
```
pattern: "\.command\s*\(|\.add_command|@click\.(command|group)|#\[clap|structopt|cobra\.Command|kingpin\.Command"
```

### Event/Message Handlers
```
pattern: "\.(on|subscribe|listen|handle|consume)\s*\(|@EventHandler|@Subscribe|@Listener|@RabbitListener|@KafkaListener"
```

### Middleware/Interceptors
```
pattern: "\.use\s*\(|@Middleware|middleware\s*=|before_action|before_filter|@app\.before_request"
```

### Scheduled Tasks / Cron
```
pattern: "@Scheduled|@cron|schedule\.(every|cron)|celery\.task|sidekiq|\.crontab"
```

### Database Migrations
```
pattern: "migration|Migration|migrate|CREATE TABLE|ALTER TABLE|def\s+(up|down|change)"
```
