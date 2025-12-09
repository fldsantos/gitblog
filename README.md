# GitHub Pages Markdown Blog

Static, JavaScript-only blog for GitHub Pages. Posts are Markdown files in `entries/`; a small build script generates `entries.json` that the UI consumes.

## Quick start
1. Install Node 18+.
2. Add or edit Markdown files under `entries/`.
   - The first `#` line becomes the post title.
   - Add a `Tags: tag1, tag2` line (case-insensitive) anywhere near the top for tags.
3. Customize `config.json` with your name, avatar URL, and tagline.
4. Generate metadata:
   ```bash
   npm run build
   ```
5. Serve locally (optional):
   ```bash
   npx http-server -c-1 -p 4173 .
   ```
   Then open `http://localhost:4173`.
6. Commit and push to the `gh-pages` branch (or enable Pages on `main`). Each time you add or delete a Markdown file, rerun `npm run build` so `entries.json` stays in sync.

## How it works
- `scripts/build.js` scans `entries/*.md`, extracts the first level-1 heading for the title and the first `Tags:` line for tags, and writes `entries.json`.
- `index.html` fetches `config.json` and `entries.json`, renders the owner info, and lists posts with search + tag filters.
- `post.html` reads `entries.json` to find the selected entry, fetches its Markdown, and renders it with `marked` + `DOMPurify`.

## Adding posts
Create a file like `entries/my-post.md`:
```md
# My Post
Tags: life, notes

Your content here.
```
Run `npm run build` to refresh `entries.json`.

## Deleting posts
Remove the Markdown file from `entries/` and rerun `npm run build`. The post disappears from the main list after deployment.

## Deployment
Push the built files (including the generated `entries.json`) to the branch configured for GitHub Pages. No server-side code or build step is required on Pages itself—just static assets.

