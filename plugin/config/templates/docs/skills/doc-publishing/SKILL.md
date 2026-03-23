---
name: doc-publishing
description: >-
  Build and publish documentation to a hosting platform. Supports GitHub Pages,
  Vercel, Netlify, and static site generators. Triggers on "publish docs",
  "deploy docs", "push docs live". Requires target platform as $ARGUMENTS
  (e.g., "github-pages", "vercel", "netlify"). NOT for writing or formatting
  docs (use doc-generation or formatting first).
allowed-tools: Bash, Read
---

## When to Use

- Deploying documentation to a hosting platform after writing and review
- Building a static doc site (MkDocs, Docusaurus, VuePress, etc.)
- Updating a live documentation site with new content

## When NOT to Use

- Writing or generating documentation (use doc-generation)
- Formatting docs before publish (use formatting)
- Reviewing docs for accuracy (use doc-review)

## Instructions

1. **Identify the target platform.** Read $ARGUMENTS to determine where to deploy. If not specified, use Read to check for configuration files that indicate the platform:
   - `mkdocs.yml` -> MkDocs (likely GitHub Pages or ReadTheDocs)
   - `docusaurus.config.js` -> Docusaurus
   - `vercel.json` -> Vercel
   - `netlify.toml` -> Netlify
   - `.github/workflows/*docs*` -> GitHub Pages via Actions

2. **Read build configuration.** Use Read to examine `package.json` for doc-related scripts (`docs:build`, `docs:deploy`, `build:docs`). Also check the platform config file for build commands and output directory.

3. **Build the documentation site.**
   - For npm-based projects: `Run: npm run docs:build`
   - For MkDocs: `Run: mkdocs build`
   - For Docusaurus: `Run: npm run build`
   - Verify the build succeeds before proceeding.

4. **Deploy based on platform.**

   **GitHub Pages:**
   ```
   Run: npm run docs:deploy
   ```
   Or if no deploy script exists:
   ```
   Run: npx gh-pages -d [build-output-dir]
   ```

   **Vercel:**
   ```
   Run: vercel --prod
   ```

   **Netlify:**
   ```
   Run: netlify deploy --prod --dir=[build-output-dir]
   ```

   **ReadTheDocs:** Deployment is automatic via git push. Confirm the `.readthedocs.yml` config is correct using Read.

5. **Verify deployment.** After deploy completes, check the command output for a published URL. Report the URL and deployment status.

## Output

```markdown
## Documentation Published

- Platform: [platform name]
- URL: [published URL]
- Build status: success/failure
- Pages deployed: [count or list]
- Deploy time: [timestamp]

### Next Steps
- Verify published pages render correctly
- Update any external links pointing to docs
```
