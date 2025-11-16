/* eslint-env node */
const { readdirSync, readFileSync, statSync } = require('fs');
const { join, dirname, resolve, relative } = require('path');

const DOC_ROOT = resolve(process.cwd(), 'docs');

// Cache for file existence checks
const fileCache = new Map();

function walk(dir, files = []) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      let st;
      try { 
        st = statSync(full); 
      } catch (err) {
        console.warn(`Warning: Cannot access ${full}: ${err.message}`);
        continue;
      }
      
      if (st.isDirectory()) {
        walk(full, files);
      } else if (entry.endsWith('.md')) {
        files.push(full);
      }
    }
  } catch (err) {
    console.warn(`Warning: Cannot read directory ${dir}: ${err.message}`);
  }
  return files;
}

function extractLinks(content, filePath = '') {
  const mdLink = /\[[^\]]+\]\(([^)]+)\)/g;
  const results = [];
  let m;
  let lineNumber = 1;
  let lastIndex = 0;
  
  while ((m = mdLink.exec(content))) {
    // Calculate line number
    const beforeMatch = content.substring(lastIndex, m.index);
    lineNumber += (beforeMatch.match(/\n/g) || []).length;
    lastIndex = m.index;
    
    const link = m[1];
    
    // Skip external links, anchors, and mailto
    if (link.startsWith('http://') || 
        link.startsWith('https://') || 
        link.startsWith('mailto:') ||
        link.startsWith('#')) {
      continue;
    }
    
    // Extract file path (remove anchor)
    const linkPath = link.split('#')[0];
    
    // Skip links with spaces (likely malformed)
    if (link.includes(' ') && linkPath) {
      console.warn(`Warning: Link with spaces in ${filePath}:${lineNumber} - "${link}"`);
      continue;
    }
    
    if (linkPath) {
      results.push({
        path: linkPath,
        line: lineNumber,
        original: link
      });
    }
  }
  return results;
}

function exists(p) {
  if (fileCache.has(p)) {
    return fileCache.get(p);
  }
  
  try { 
    const result = statSync(p).isFile();
    fileCache.set(p, result);
    return result;
  } catch { 
    fileCache.set(p, false);
    return false;
  }
}

function validate() {
  const issues = [];
  const mdFiles = walk(DOC_ROOT);
  
  console.log(`Scanning ${mdFiles.length} markdown files...`);
  
  for (const file of mdFiles) {
    const relDir = dirname(file);
    let content;
    
    try {
      content = readFileSync(file, 'utf8');
    } catch (err) {
      console.warn(`Warning: Cannot read file ${file}: ${err.message}`);
      continue;
    }
    
    const relativeFile = relative(DOC_ROOT, file);
    const links = extractLinks(content, relativeFile);
    
    for (const link of links) {
      let target;
      
      if (link.path.startsWith('/')) {
        // Absolute path from docs root
        target = resolve(DOC_ROOT, link.path.substring(1));
      } else if (link.path.startsWith('./') || link.path.startsWith('../')) {
        // Relative path
        target = resolve(relDir, link.path);
      } else {
        // Relative to current directory
        target = resolve(relDir, link.path);
      }
      
      if (!exists(target)) {
        issues.push({
          file: relativeFile,
          link: link.original,
          line: link.line,
          target: target
        });
      }
    }
  }
  
  return issues;
}

function main() {
  console.log('🔍 Checking documentation links...\n');
  
  const issues = validate();
  
  if (!issues.length) {
    console.log('✅ All documentation links OK.');
    return;
  }
  
  console.log(`❌ Found ${issues.length} documentation link issue(s):\n`);
  
  // Group issues by file for better readability
  const issuesByFile = {};
  for (const issue of issues) {
    if (!issuesByFile[issue.file]) {
      issuesByFile[issue.file] = [];
    }
    issuesByFile[issue.file].push(issue);
  }
  
  for (const [file, fileIssues] of Object.entries(issuesByFile)) {
    console.log(`📄 ${file}:`);
    for (const issue of fileIssues) {
      console.log(`   Line ${issue.line}: "${issue.link}" → ${issue.target}`);
    }
    console.log('');
  }
  
  console.log(`💡 Tip: Use relative paths like "./filename.md" for files in the same directory`);
  console.log(`💡 Tip: Use "../filename.md" for files in parent directories`);
  
  process.exit(1);
}

if (require.main === module) main();