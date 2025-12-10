# gitblog

**Minimalistic blogging engine powered by GitHub Actions.**

`gitblog` streamlines the process of maintaining a static blog. It allows you to manage your content entirely through your terminal using simple git-like commands, while GitHub Actions handles the heavy lifting of building and deploying your site.

---

## Features

* ✨ **Automatic Generation:** seamlessly converts Markdown files into blog posts.
* 🔍 **Search Functionality:** Built-in search for easy content navigation.
* 🏷️ **Tag Filtering:** Organize posts with tags for better discoverability.
* 🚀 **Auto-deploy:** Updates are automatically deployed to GitHub Pages.

---

## Setup & Installation

Follow these steps to get your blog up and running.

### 1. Repository Configuration
Before installing the tools, you must configure a repository on GitHub to host your site.

1.  **Create a new repository** in your GitHub account.
2.  Navigate to your repository **Settings**.
3.  Go to **Pages** > **Workflow Permissions**.
    > **Important:** Select **Read and Write permissions**. This is required for the action to publish your site.
4.  Go to **Pages** > **Build and deployment**.
5.  Under "Source", select **GitHub Actions**.

### 2. Install the CLI Tool
To use the custom `git blog` commands, you need to install the shell script.

1.  Locate the file `installation-bash-script.txt` in this repository.
2.  Copy the content of the file.
3.  Paste and run the content in your Terminal.
4.  Follow installation instructions

### 3. Initialize the Blog
Once the CLI tool is installed:

1.  Open your terminal.
2.  Navigate to the folder where you wish to store your blog source files.
3.  Run the initialization command:
    ```
    git blog start
    ```
4.  Follow the on-screen instructions to finish the setup.

---

## Usage

Use the following commands to manage your blog content directly from your terminal.

| Command | Description |
| :--- | :--- |
| **`git blog new <filename>`** | Creates a new blog entry (Markdown file). |
| **`git blog edit <filename>`** | Opens an existing blog entry for editing. |
| **`git blog delete <filename>`** | Deletes an existing blog entry. |
| **`git blog update`** | Commits changes and updates the remote GitHub repository, triggering a new build/deploy. |

---