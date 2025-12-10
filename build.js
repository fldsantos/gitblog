const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

// Configure marked for better markdown rendering
marked.setOptions({
    breaks: true,  // Convert line breaks to <br>
    gfm: true,     // GitHub Flavored Markdown
    headerIds: true, // Add IDs to headers
    mangle: false  // Don't mangle email addresses
});

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
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (!content || content.trim().length === 0) {
        throw new Error('File is empty');
    }
    
    const lines = content.split('\n');
    
    // Check for frontmatter (YAML between --- markers)
    let frontmatter = null;
    let contentStart = 0;
    let tags = [];
    let title = '';
    
    if (lines[0] && lines[0].trim() === '---') {
        // Find the closing ---
        let frontmatterEnd = -1;
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim() === '---') {
                frontmatterEnd = i;
                break;
            }
        }
        
        if (frontmatterEnd > 0) {
            // Parse frontmatter
            const frontmatterLines = lines.slice(1, frontmatterEnd);
            frontmatter = {};
            frontmatterLines.forEach(line => {
                const match = line.match(/^(\w+):\s*(.+)$/);
                if (match) {
                    const key = match[1].toLowerCase();
                    let value = match[2].trim();
                    
                    // Handle array values (tags: [a, b, c])
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
                    }
                    
                    frontmatter[key] = value;
                }
            });
            
            // Extract tags from frontmatter
            if (frontmatter.tags) {
                if (Array.isArray(frontmatter.tags)) {
                    tags = frontmatter.tags;
                } else {
                    tags = frontmatter.tags.split(',').map(t => t.trim()).filter(t => t.length > 0);
                }
            }
            
            // Extract title from frontmatter
            if (frontmatter.title) {
                title = frontmatter.title;
            }
            
            contentStart = frontmatterEnd + 1;
        }
    }
    
    // Get markdown content (skip frontmatter if present)
    const markdownContent = lines.slice(contentStart).join('\n').trim();
    
    // Extract title from first # heading if not in frontmatter
    if (!title) {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.startsWith('# ')) {
                title = trimmed.substring(2).trim();
                break;
            }
        }
    }
    
    // If still no title, use filename
    if (!title) {
        title = path.basename(filePath, '.md');
    }
    
    // Extract tags from markdown if not in frontmatter (old format: tags: tag1, tag2)
    if (tags.length === 0) {
        for (let i = 0; i < lines.length; i++) {
            const trimmed = lines[i].trim();
            if (trimmed.toLowerCase().startsWith('tags:')) {
                const tagsStr = trimmed.substring(5).trim();
                if (tagsStr) {
                    tags = tagsStr.split(',').map(t => t.trim()).filter(t => t.length > 0);
                }
                break;
            }
        }
    }
    
    // Use the full markdown content (including the title heading)
    const entryContent = markdownContent;
    
    if (!entryContent) {
        throw new Error('No content found after frontmatter/title');
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
    
    // Tags are now populated dynamically via JavaScript dropdown, no need to generate buttons
    
    fs.writeFileSync(path.join(outputDir, 'index.html'), template);
}

// Build entry pages (kept for backward compatibility, but now done inline in build function)
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
        console.log(`Current working directory: ${process.cwd()}`);
        
        // Check if entries directory exists
        if (!fs.existsSync(entriesDir)) {
            console.error(`ERROR: Entries directory not found: ${entriesDir}`);
            console.error(`Absolute path: ${path.resolve(entriesDir)}`);
            console.error('Current directory contents:');
            try {
                fs.readdirSync(__dirname).forEach(file => console.error(`  - ${file}`));
            } catch (e) {
                console.error(`Cannot read directory: ${e.message}`);
            }
            process.exit(1);
        }
        
        // List entries directory contents
        console.log(`\nEntries directory exists: ${entriesDir}`);
        console.log('Contents of entries directory:');
        try {
            const entriesContents = fs.readdirSync(entriesDir);
            entriesContents.forEach(file => {
                const filePath = path.join(entriesDir, file);
                const stats = fs.statSync(filePath);
                console.log(`  ${stats.isDirectory() ? 'DIR' : 'FILE'}: ${file} (${stats.size} bytes)`);
            });
        } catch (e) {
            console.error(`Error reading entries directory: ${e.message}`);
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
        
        console.log(`\nDirectories:`);
        console.log(`  Entries: ${entriesDir}`);
        console.log(`  Templates: ${templatesDir}`);
        console.log(`  Output: ${outputDir}`);
        
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
        console.log(`Building main page with ${entries.length} entries...`);
        try {
            buildMainPage(entries);
            const indexPath = path.join(outputDir, 'index.html');
            if (fs.existsSync(indexPath)) {
                const stats = fs.statSync(indexPath);
                console.log(`✓ Main page built: index.html (${stats.size} bytes)`);
            } else {
                throw new Error('index.html was not created!');
            }
        } catch (error) {
            console.error('✗ Failed to build main page:', error.message);
            throw error;
        }
        
        console.log(`\nBuilding ${entries.length} entry page(s)...`);
        try {
            buildEntryPages(entries);
            
            // Verify all files were created
            let builtCount = 0;
            entries.forEach(entry => {
                const outputPath = path.join(outputDir, entry.url);
                if (fs.existsSync(outputPath)) {
                    const stats = fs.statSync(outputPath);
                    console.log(`  ✓ ${entry.url} (${stats.size} bytes)`);
                    builtCount++;
                } else {
                    console.error(`  ✗ Missing: ${entry.url}`);
                }
            });
            
            console.log(`\n✓ Built ${builtCount}/${entries.length} entry page(s)`);
            
            if (builtCount !== entries.length) {
                throw new Error(`Only built ${builtCount} out of ${entries.length} entry pages!`);
            }
        } catch (error) {
            console.error('✗ Failed to build entry pages:', error.message);
            throw error;
        }
        
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