# GitBlog

A minimalistic, dark-mode blogging engine powered by GitHub Actions.

## Features

- ✨ Automatic blog generation from markdown files
- 🔍 Search functionality
- 🏷️ Tag filtering
- 🌙 Dark mode design
- 🚀 Auto-deploy to GitHub Pages

## Setup

1. **Update Configuration**
   - Edit `config.json` with your name and profile picture URL

2. **Add Blog Entries**
   - Create markdown files in the `entries/` folder
   - Each entry should start with a `# Title` heading
   - Add tags on the line after the title: `tags: tag1, tag2, tag3`

3. **Test Locally** (optional)
   ```bash
   npm install
   npm run build
   ```
   The generated site will be in the `_site/` folder.

4. **Push to GitHub**
   - Push your code to a repository named `gitblog`
   - The GitHub Actions workflow will automatically build and deploy to GitHub Pages

## Entry Format

Each markdown file in `entries/` should follow this format:

```markdown
# Entry Title

tags: tag1, tag2, tag3

Your markdown content here...
```

## How It Works

**Important:** This blog generates **100% static HTML files**. Node.js is only used during the build process in GitHub Actions, not on GitHub Pages.

1. **Build Process (GitHub Actions):**
   - When you push to GitHub, the workflow runs `build.js` (Node.js)
   - It reads markdown files from `entries/`
   - Converts markdown to HTML
   - Populates templates with data
   - Generates static HTML files in `_site/`

2. **Deployment (GitHub Pages):**
   - Only the `_site/` folder (static HTML/CSS/JS) is deployed
   - No server-side processing needed
   - Pure client-side JavaScript for search and filtering

## GitHub Pages Setup

1. **Enable GitHub Actions Permissions:**
   - Go to your repository Settings
   - Navigate to **Actions** → **General**
   - Under "Workflow permissions", select **"Read and write permissions"**
   - Click **Save**

2. **Configure GitHub Pages:**
   - Go to your repository Settings
   - Navigate to **Pages**
   - Under "Source", select **"GitHub Actions"**
   - The workflow will automatically deploy on every push to main/master

**Note:** If you get a permission error, make sure step 1 is completed first!

## Project Structure

```
gitblog/
├── .github/
│   └── workflows/
│       └── build.yml          # GitHub Actions workflow
├── entries/                   # Markdown blog entries
├── templates/                 # HTML templates
│   ├── index.html            # Main page template
│   └── entry.html            # Entry page template
├── config.json               # Blog configuration
├── build.js                  # Build script
└── package.json              # Dependencies
```

