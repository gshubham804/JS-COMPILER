<p align="center">
  <img src="public/jsc-mark.svg" alt="JSC" width="72" height="72" />
</p>

<h1 align="center">JSC</h1>

<p align="center"><strong>Live JavaScript workspace</strong> in the browser.</p>

<p align="center">
  Edit <code>index.html</code>, <code>style.css</code>, and <code>script.js</code> side by side, run the combined result in a sandboxed <strong>Preview</strong>, and read <strong>Console</strong> output from your preview code (output comes from <strong>script.js</strong> / the merged page — there is no separate “run JS in the console” box).
</p>

---

## Features

| Area | What it does |
|------|----------------|
| **Editors** | Three panes for HTML, CSS, and JavaScript, powered by **Monaco** (VS Code–style editing). |
| **Preview** | Builds a single document from your three files (inlines CSS/JS, injects a small console bridge) and runs it in a **sandboxed iframe**. |
| **Console** | Read-only: shows `console.log` / `warn` / `error` and uncaught errors from the preview. **Clear** empties the log. |
| **Panes** | Toggle visibility of HTML, CSS, JS, Console, and Preview in the sidebar — e.g. only JavaScript + Console for a minimal layout. |
| **Resize** | When both editors and at least one of Console/Preview are visible, drag the **horizontal bar** between the editor block and the output block to change their height split (ratio is persisted). |
| **Run** | Runs the preview (refreshes the iframe). **Auto-run** debounces and re-runs when files change (~420 ms). |
| **Shortcuts** | **Ctrl+Enter** (Windows/Linux) or **⌘+Enter** (macOS) runs the preview. |
| **Header** | Share (copies a URL with encoded state), Save (marks saved; state also auto-saves), Settings, light/dark theme. |
| **Settings** | Font size, tab size, line numbers (for the editors). |
| **Status bar** | Active file, indent/encoding hint, saved/unsaved. |
| **Persistence** | Workspace (files, panes, layout ratio, theme, editor settings, etc.) is stored in **`localStorage`** under the key `jsc-compiler-v1`. |
| **Share URL** | Copies a link with a `#p=` fragment (Base64-encoded JSON: `files`, `panes`, `outputPaneRatio`). Opening that link restores the snapshot. |
| **Import / export** | **Upload** (arrow up): open a `.json` project file exported by JSC. **Download** (arrow down): save `jsc-project-YYYY-MM-DD.json` with the full workspace (`jsc: true`, files, panes, layout, theme, editor settings). |

## How the preview works

`src/lib/previewDocument.ts` strips the normal `<link href="style.css">` and `<script src="script.js">` references, injects your CSS into `<style>` and your JS before `</body>` (uses `type="module"` when your `script.js` starts with `import`), and prepends a bridge so `console.*` can be shown in the app’s Console panel.

## Tech stack

- **React** 19 · **TypeScript** · **Vite** 8  
- **Tailwind CSS** v4 (`@tailwindcss/vite`)  
- **Monaco Editor** (`@monaco-editor/react`, `monaco-editor`)  
- **ESLint** (TypeScript + React hooks / refresh)

## Project structure

```
netlify.toml            # Build command, publish dir, SPA redirect (Netlify)
src/
  App.tsx                 # Shell, state, persistence, layout
  main.tsx
  index.css
  types.ts
  constants/defaultProject.ts   # Default HTML/CSS/JS starter
  lib/previewDocument.ts        # Merge files → iframe srcdoc
  components/
    HeaderBar.tsx
    FilesSidebar.tsx
    EditorColumn.tsx
    BottomPanes.tsx        # Console + Preview (or off-screen iframe)
    WorkspaceResizer.tsx
    StatusBarRow.tsx
    SettingsModal.tsx
public/
  jsc-mark.svg           # App logo
  favicon.svg
```

## Scripts

```bash
npm install
npm run dev       # dev server (default: http://localhost:5173)
npm run build     # typecheck + production bundle → dist/
npm run preview   # serve dist/ locally
npm run lint      # ESLint
```

**Netlify:** import the site from this repo; `netlify.toml` sets the build to `npm run build`, output to `dist/`, and a SPA fallback to `index.html`.

## Requirements

- **Node.js** (LTS recommended) and **npm**

## Branding

| Asset | Path |
|--------|------|
| Logo | `public/jsc-mark.svg` |
| Favicon | `public/favicon.svg` |

Page title (see `index.html`): **JSC — live JavaScript workspace**.

---

Add a `LICENSE` if you publish or open-source the repository.
