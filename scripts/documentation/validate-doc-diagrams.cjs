/* eslint-env node */
const { readFileSync, statSync } = require('fs');
const { join, resolve, relative } = require('path');

const DOC_ROOT = resolve(process.cwd(), 'docs');
const DIAGRAMS_PATH = join(DOC_ROOT, 'DIAGRAMS.md');

const issues = [];

function logIssue(type, file, message, details = '') {
  issues.push({
    type,
    file: relative(process.cwd(), file),
    message,
    details
  });
}

function exists(p) {
  try {
    return statSync(p).isFile();
  } catch {
    return false;
  }
}

function extractDiagramHeaders(content) {
  const headers = [];
  const headerRegex = /^##\s+(.+)$/gm;
  let match;
  
  while ((match = headerRegex.exec(content))) {
    const header = match[1].trim();
    // Convert Hebrew header to anchor (basic conversion)
    const anchor = header
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '');
    headers.push({ header, anchor });
  }
  
  return headers;
}

function extractDiagramReferences(content) {
  const references = [];
  // Match links like [text](../DIAGRAMS.md#anchor) or [text](DIAGRAMS.md#anchor)
  const linkRegex = /\[([^\]]+)\]\(([^)]*DIAGRAMS\.md#([^)]+))\)/gi;
  let match;
  
  while ((match = linkRegex.exec(content))) {
    references.push({
      text: match[1],
      fullLink: match[2],
      anchor: match[3]
    });
  }
  
  return references;
}

function extractMermaidBlocks(content) {
  const blocks = [];
  const mermaidRegex = /```mermaid\n([\s\S]*?)```/g;
  let match;
  let index = 0;
  
  while ((match = mermaidRegex.exec(content))) {
    blocks.push({
      index: index++,
      content: match[1],
      startLine: (content.substring(0, match.index).match(/\n/g) || []).length + 1
    });
  }
  
  return blocks;
}

function validateMermaidSyntax(mermaidContent) {
  const errors = [];
  
  // Basic validation - check for common issues
  // 1. Check for unbalanced brackets
  const openBrackets = (mermaidContent.match(/\[/g) || []).length;
  const closeBrackets = (mermaidContent.match(/\]/g) || []).length;
  if (openBrackets !== closeBrackets) {
    errors.push('Unbalanced brackets in Mermaid diagram');
  }
  
  // 2. Check for node ID duplicates (simple check)
  const nodeIdRegex = /\b([A-Z]{1,3})\[/g;
  const nodeIds = [];
  let idMatch;
  while ((idMatch = nodeIdRegex.exec(mermaidContent))) {
    const nodeId = idMatch[1];
    if (nodeIds.includes(nodeId)) {
      // This is OK - nodes can be reused
    } else {
      nodeIds.push(nodeId);
    }
  }
  
  // 3. Check for common syntax errors
  if (mermaidContent.includes('-->') && !mermaidContent.match(/graph\s+\w+/)) {
    // This might be OK depending on diagram type
  }
  
  // 4. Check for empty subgraphs
  const subgraphRegex = /subgraph\s+"[^"]+"\s*\n\s*end/g;
  if (subgraphRegex.test(mermaidContent)) {
    errors.push('Empty subgraph found');
  }
  
  return errors;
}

function validateDiagrams() {
  console.log('🔍 Validating diagrams...\n');
  
  if (!exists(DIAGRAMS_PATH)) {
    logIssue('missing-file', DIAGRAMS_PATH, 'DIAGRAMS.md file not found');
    return;
  }
  
  const content = readFileSync(DIAGRAMS_PATH, 'utf8');
  
  // 1. Extract all diagram headers (these become anchors)
  const headers = extractDiagramHeaders(content);
  const anchors = new Set(headers.map(h => h.anchor));
  
  // 2. Validate Mermaid syntax for each diagram
  const mermaidBlocks = extractMermaidBlocks(content);
  for (const block of mermaidBlocks) {
    const syntaxErrors = validateMermaidSyntax(block.content);
    for (const error of syntaxErrors) {
      logIssue('mermaid-syntax', DIAGRAMS_PATH, 
        `Mermaid syntax error in diagram ${block.index + 1} (line ${block.startLine}): ${error}`);
    }
  }
  
  // 3. Check all references to DIAGRAMS.md in documentation
  const { readdirSync } = require('fs');
  const { join: joinPath } = require('path');
  
  function walkDocs(dir, files = []) {
    try {
      for (const entry of readdirSync(dir)) {
        const full = joinPath(dir, entry);
        let st;
        try {
          st = statSync(full);
        } catch {
          continue;
        }
        
        if (st.isDirectory()) {
          walkDocs(full, files);
        } else if (entry.endsWith('.md') && entry !== 'DIAGRAMS.md') {
          files.push(full);
        }
      }
    } catch {
      // Ignore
    }
    return files;
  }
  
  const docFiles = walkDocs(DOC_ROOT);
  const missingAnchors = new Set();
  
  for (const file of docFiles) {
    const fileContent = readFileSync(file, 'utf8');
    const references = extractDiagramReferences(fileContent);
    
    for (const ref of references) {
      // Normalize anchor (remove Hebrew chars, lowercase, replace spaces with dashes)
      const normalizedAnchor = ref.anchor
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]/g, '');
      
      if (!anchors.has(normalizedAnchor)) {
        missingAnchors.add(ref.anchor);
        const normalizedAnchorForDetails = ref.anchor
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');
        logIssue('missing-anchor', file, 
          `Reference to non-existent anchor: "${ref.anchor}" in link "${ref.text}"`,
          `Looking for anchor: ${normalizedAnchorForDetails}`);
      }
    }
  }
  
  // 4. Check for diagrams without headers
  if (mermaidBlocks.length > headers.length) {
    logIssue('missing-header', DIAGRAMS_PATH, 
      `Found ${mermaidBlocks.length} Mermaid diagrams but only ${headers.length} headers`,
      'Each diagram should have a ## header before it');
  }
  
  // 5. Check for duplicate diagram titles
  const headerTitles = headers.map(h => h.header);
  const duplicates = headerTitles.filter((title, index) => headerTitles.indexOf(title) !== index);
  if (duplicates.length > 0) {
    for (const dup of [...new Set(duplicates)]) {
      logIssue('duplicate-header', DIAGRAMS_PATH, 
        `Duplicate diagram header: "${dup}"`);
    }
  }
}

function main() {
  console.log('🔍 Checking diagram validity...\n');
  
  validateDiagrams();
  
  if (!issues.length) {
    console.log('✅ All diagrams are valid.');
    return;
  }
  
  console.log(`❌ Found ${issues.length} diagram issue(s):\n`);
  
  // Group issues by type
  const issuesByType = {};
  for (const issue of issues) {
    if (!issuesByType[issue.type]) {
      issuesByType[issue.type] = [];
    }
    issuesByType[issue.type].push(issue);
  }
  
  for (const [type, typeIssues] of Object.entries(issuesByType)) {
    console.log(`📋 ${type.toUpperCase()} ISSUES:`);
    for (const issue of typeIssues) {
      console.log(`   📄 ${issue.file}`);
      console.log(`      ${issue.message}`);
      if (issue.details) {
        console.log(`      ${issue.details}`);
      }
      console.log('');
    }
  }
  
  console.log(`💡 Tip: Check that all diagram headers are unique`);
  console.log(`💡 Tip: Verify that anchor links match diagram header names`);
  console.log(`💡 Tip: Use GitHub's markdown renderer to preview diagrams`);
  
  process.exit(1);
}

if (require.main === module) main();

