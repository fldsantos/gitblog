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

**Important:** The `_site/` folder is **NOT** committed to your main branch (it's in `.gitignore`). 
- The files are built **during the GitHub Actions workflow**
- They are deployed to the `gh-pages` branch automatically
- Your live site is available at: `https://[your-username].github.io/gitblog/`
- To see the built files, check the `gh-pages` branch or view your GitHub Pages site

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

## Troubleshooting

### _site folder not appearing in repository

**This is normal!** The `_site/` folder is in `.gitignore` and won't appear in your main branch. The files are:
- Built during the GitHub Actions workflow
- Deployed to the `gh-pages` branch (check your branches to see it)
- Served via GitHub Pages at your site URL

To verify the build worked:
1. Check the workflow logs in the **Actions** tab
2. Look for the "Verify build output" step - it will show all created files
3. Check the `gh-pages` branch in your repository
4. Visit your GitHub Pages URL: `https://[your-username].github.io/gitblog/`

### No static HTML pages created

If the workflow runs but no pages appear:

1. **Check the workflow logs:**
   - Go to your repository → **Actions** tab
   - Click on the latest workflow run
   - Check each step for errors
   - Look for the "Verify build output" step to see if files were created

2. **Verify your branch name:**
   - The workflow only runs on `main` or `master` branches
   - Make sure you're pushing to the correct branch

3. **Check GitHub Pages settings:**
   - Go to Settings → Pages
   - Make sure "Source" is set to **"GitHub Actions"** (not "Deploy from a branch")
   - If it was previously set to a branch, change it to "GitHub Actions"

4. **Verify the build works locally:**
   ```bash
   npm install
   npm run build
   ls -la _site/
   ```
   You should see `index.html` and entry HTML files in the `_site/` folder.

5. **Check the gh-pages branch:**
   - After a successful workflow run, a `gh-pages` branch should be created
   - Go to your repository → **Branches** to see if it exists
   - The branch should contain the static HTML files

6. **Manual workflow trigger:**
   - Go to **Actions** → **Build Blog** → **Run workflow**
   - This will manually trigger the build process

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

