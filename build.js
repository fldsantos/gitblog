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
    if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
        throw new Error('File is empty');
    }
    
    const lines = content.split('\n');
    
    // Extract title (first # heading)
    let title = '';
    let titleIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('# ')) {
            title = trimmed.substring(2).trim();
            titleIndex = i;
            break;
        }
    }
    
    if (!title) {
        // Fallback to filename if no title found
        title = path.basename(filePath, '.md');
    }
    
    // Extract tags (look for tags: line after title)
    let tags = [];
    let contentStart = titleIndex >= 0 ? titleIndex + 1 : 0;
    
    // Check for tags line (must be right after title)
    if (titleIndex >= 0 && titleIndex + 1 < lines.length) {
        const tagsLine = lines[titleIndex + 1].trim();
        if (tagsLine.toLowerCase().startsWith('tags:')) {
            const tagsStr = tagsLine.substring(5).trim();
            if (tagsStr) {
                tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
            }
            contentStart = titleIndex + 2;
        }
    }
    
    // Get content (everything after title and tags)
    const entryContent = lines.slice(contentStart).join('\n').trim();
    
    if (!entryContent) {
        throw new Error('No content found after title/tags');
    }
    
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
    console.log(`\nFound ${files.length} markdown file(s):`);
    files.forEach(file => console.log(`  - ${file}`));
    
    const entries = [];
    const errors = [];
    
    files.forEach(file => {
        try {
            const filePath = path.join(entriesDir, file);
            console.log(`\nProcessing: ${file}`);
            const entry = parseMarkdownFile(filePath);
            
            // Sanitize filename for URL (replace spaces and special chars)
            const safeFilename = entry.filename
                .replace(/\s+/g, '-')
                .replace(/[^a-zA-Z0-9\-_]/g, '')
                .toLowerCase();
            
            entry.url = `entry-${safeFilename}.html`;
            entry.originalFilename = file;
            entries.push(entry);
            console.log(`  ✓ Parsed: "${entry.title}" -> ${entry.url}`);
            console.log(`    Tags: ${entry.tags.length > 0 ? entry.tags.join(', ') : 'none'}`);
        } catch (error) {
            const errorMsg = `Error processing ${file}: ${error.message}`;
            console.error(`  ✗ ${errorMsg}`);
            errors.push(errorMsg);
        }
    });
    
    if (errors.length > 0) {
        console.error(`\n⚠️  ${errors.length} file(s) failed to parse:`);
        errors.forEach(err => console.error(`  - ${err}`));
    }
    
    return entries;
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
        console.log('No _site directory found, skipping cleanup');
        return;
    }
    
    // Get all HTML files in _site that match entry-*.html pattern
    const existingFiles = fs.readdirSync(outputDir).filter(file => 
        file.startsWith('entry-') && file.endsWith('.html')
    );
    
    // Create a set of expected HTML filenames from current entries
    const expectedFiles = new Set(entries.map(e => e.url));
    
    console.log(`\n=== Cleanup Check ===`);
    console.log(`Existing entry HTML files: ${existingFiles.length}`);
    console.log(`Expected entry HTML files: ${expectedFiles.size}`);
    
    if (existingFiles.length > 0) {
        console.log('Existing files:');
        existingFiles.forEach(file => {
            const isExpected = expectedFiles.has(file);
            console.log(`  ${isExpected ? '✓' : '✗'} ${file} ${isExpected ? '(expected)' : '(orphaned)'}`);
        });
    }
    
    // Find and delete orphaned files
    let deletedCount = 0;
    existingFiles.forEach(file => {
        if (!expectedFiles.has(file)) {
            const filePath = path.join(outputDir, file);
            try {
                fs.unlinkSync(filePath);
                console.log(`  → Deleted orphaned entry: ${file}`);
                deletedCount++;
            } catch (error) {
                console.error(`  → Failed to delete ${file}: ${error.message}`);
            }
        }
    });
    
    if (deletedCount > 0) {
        console.log(`\nCleaned up ${deletedCount} orphaned entry file(s)`);
    } else if (existingFiles.length > 0) {
        console.log('\nNo orphaned files to clean up');
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
        console.log(`\n=== Summary ===`);
        console.log(`Successfully parsed: ${entries.length} entry/entries`);
        
        if (entries.length === 0) {
            console.warn('\n⚠️  WARNING: No entries were successfully parsed!');
            console.warn('   Check the errors above to see what went wrong.');
        }
        
        // Ensure output directory exists
        if (!fs.existsSync(outputDir)) {
            console.log(`Creating output directory: ${outputDir}`);
            fs.mkdirSync(outputDir, { recursive: true });
        }
        
        if (entries.length === 0) {
            console.error('\n❌ Cannot build pages: No valid entries found!');
            process.exit(1);
        }
        
        console.log('\n=== Building Pages ===');
        console.log('Building main page...');
        buildMainPage(entries);
        console.log('✓ Main page built');
        
        console.log('Building entry pages...');
        buildEntryPages(entries);
        console.log(`✓ Built ${entries.length} entry page(s)`);
        
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

