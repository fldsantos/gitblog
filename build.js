const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configuration
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const entriesDir = path.join(__dirname, 'entries');
const templatesDir = path.join(__dirname, 'templates');
const outputDir = path.join(__dirname, '_site');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// Parse markdown files
function parseMarkdownFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    // Extract title (first # heading)
    let title = '';
    let titleIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('# ')) {
            title = lines[i].trim().substring(2);
            titleIndex = i;
            break;
        }
    }
    
    if (!title) {
        title = path.basename(filePath, '.md');
    }
    
    // Extract tags (look for tags: line after title)
    let tags = [];
    let contentStart = titleIndex + 1;
    
    // Check for tags line
    if (titleIndex >= 0 && titleIndex + 1 < lines.length) {
        const tagsLine = lines[titleIndex + 1].trim();
        if (tagsLine.toLowerCase().startsWith('tags:')) {
            tags = tagsLine.substring(5).trim().split(',').map(t => t.trim()).filter(t => t);
            contentStart = titleIndex + 2;
        }
    }
    
    // Get content (everything after title and tags)
    const entryContent = lines.slice(contentStart).join('\n');
    
    return {
        title,
        tags,
        content: entryContent,
        filename: path.basename(filePath, '.md')
    };
}

// Get all entries
function getAllEntries() {
    const files = fs.readdirSync(entriesDir).filter(f => f.endsWith('.md'));
    return files.map(file => {
        const entry = parseMarkdownFile(path.join(entriesDir, file));
        entry.url = `entry-${entry.filename}.html`;
        return entry;
    });
}

// Escape HTML for safe insertion
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Build main page
function buildMainPage(entries) {
    let template = fs.readFileSync(path.join(templatesDir, 'index.html'), 'utf8');
    
    // Replace placeholders (escape HTML for security)
    template = template.replace(/\{\{BLOG_OWNER_NAME\}\}/g, escapeHtml(config.owner.name));
    template = template.replace(/\{\{BLOG_OWNER_PICTURE\}\}/g, escapeHtml(config.owner.picture));
    
    // Generate entries JSON (content is already plain text from markdown, safe for JSON)
    const entriesJson = JSON.stringify(entries.map(e => ({
        title: e.title,
        tags: e.tags,
        url: e.url,
        content: e.content.substring(0, 200) // Preview for search
    })));
    template = template.replace(/\{\{ENTRIES_JSON\}\}/g, entriesJson);
    
    // Generate tag filter buttons (escape HTML)
    const allTags = [...new Set(entries.flatMap(e => e.tags))].sort();
    const tagButtons = allTags.map(tag => {
        const escapedTag = escapeHtml(tag);
        return `
        <button onclick="filterByTag('${escapedTag.replace(/'/g, "\\'")}')" 
                class="tag-filter px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors">
            ${escapedTag}
        </button>
    `;
    }).join('');
    
    template = template.replace('<!-- Tags will be populated by build script -->', tagButtons);
    
    fs.writeFileSync(path.join(outputDir, 'index.html'), template);
}

// Build entry pages
function buildEntryPages(entries) {
    entries.forEach(entry => {
        let template = fs.readFileSync(path.join(templatesDir, 'entry.html'), 'utf8');
        
        // Convert markdown to HTML (server-side, so it's static in the final HTML)
        const htmlContent = marked.parse(entry.content);
        
        // Replace placeholders (escape HTML for security in title/name, content is already HTML)
        template = template.replace(/\{\{ENTRY_TITLE\}\}/g, escapeHtml(entry.title));
        template = template.replace(/\{\{BLOG_OWNER_NAME\}\}/g, escapeHtml(config.owner.name));
        template = template.replace(/\{\{ENTRY_CONTENT\}\}/g, htmlContent);
        
        fs.writeFileSync(path.join(outputDir, entry.url), template);
    });
}

// Clean up orphaned entry HTML files (files without corresponding markdown)
function cleanupOrphanedEntries(entries) {
    if (!fs.existsSync(outputDir)) {
        return;
    }
    
    // Get all HTML files in _site that match entry-*.html pattern
    const existingFiles = fs.readdirSync(outputDir).filter(file => 
        file.startsWith('entry-') && file.endsWith('.html')
    );
    
    // Create a set of expected HTML filenames from current entries
    const expectedFiles = new Set(entries.map(e => e.url));
    
    // Find and delete orphaned files
    let deletedCount = 0;
    existingFiles.forEach(file => {
        if (!expectedFiles.has(file)) {
            const filePath = path.join(outputDir, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted orphaned entry: ${file}`);
            deletedCount++;
        }
    });
    
    if (deletedCount > 0) {
        console.log(`Cleaned up ${deletedCount} orphaned entry file(s)`);
    }
}

// Main build function
function build() {
    try {
        console.log('Building blog...');
        console.log(`Working directory: ${__dirname}`);
        
        // Check if entries directory exists
        if (!fs.existsSync(entriesDir)) {
            console.error(`ERROR: Entries directory not found: ${entriesDir}`);
            process.exit(1);
        }
        
        // Check if templates directory exists
        if (!fs.existsSync(templatesDir)) {
            console.error(`ERROR: Templates directory not found: ${templatesDir}`);
            process.exit(1);
        }
        
        // Check if config exists
        if (!fs.existsSync('config.json')) {
            console.error('ERROR: config.json not found!');
            process.exit(1);
        }
        
        console.log(`Entries directory: ${entriesDir}`);
        console.log(`Templates directory: ${templatesDir}`);
        console.log(`Output directory: ${outputDir}`);
        
        const entries = getAllEntries();
        console.log(`Found ${entries.length} entries`);
        
        if (entries.length === 0) {
            console.warn('WARNING: No entries found!');
        } else {
            entries.forEach(entry => {
                console.log(`  - ${entry.filename}.md -> ${entry.url}`);
            });
        }
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            console.log(`Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        console.log('Building main page...');
        buildMainPage(entries);
        
        console.log('Building entry pages...');
        buildEntryPages(entries);
        
        // Clean up orphaned entry HTML files
        console.log('Cleaning up orphaned entries...');
        cleanupOrphanedEntries(entries);
        
        // Verify output
        console.log('\n=== Build Verification ===');
        const indexPath = path.join(outputDir, 'index.html');
        const indexExists = fs.existsSync(indexPath);
        console.log(`Index page: ${indexExists ? '✓ Created' : '✗ Missing'} (${indexPath})`);
        
        if (indexExists) {
            const stats = fs.statSync(indexPath);
            console.log(`Index page size: ${stats.size} bytes`);
        }
        
        const entryFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('entry-') && f.endsWith('.html'));
        console.log(`Entry pages: ${entryFiles.length} file(s) created`);
        entryFiles.forEach(file => {
            const filePath = path.join(outputDir, file);
            const stats = fs.statSync(filePath);
            console.log(`  - ${file} (${stats.size} bytes)`);
        });
        
        console.log('\nBuild complete!');
    } catch (error) {
        console.error('\n=== BUILD FAILED ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    }
}

build();

