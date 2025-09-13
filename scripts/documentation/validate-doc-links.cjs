const { readdirSync, readFileSync, statSync } = require('fs');
const { join, dirname, resolve } = require('path');

const DOC_ROOT = resolve(process.cwd(), 'docs');

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    let st;
    try { st = statSync(full); } catch { continue; }
    if (st.isDirectory()) walk(full, files); else if (entry.endsWith('.md')) files.push(full);
  }
  return files;
}

function extractLinks(content) {
  const mdLink = /\[[^\]]+\]\(([^)]+)\)/g;
  const results = [];
  let m;
  while ((m = mdLink.exec(content))) {
    const link = m[1];
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('#')) continue;
    if (link.includes(' ')) continue;
    results.push(link.split('#')[0]);
  }
  return results;
}

function exists(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

function validate() {
  const issues = [];
  const mdFiles = walk(DOC_ROOT);
  for (const file of mdFiles) {
    const relDir = dirname(file);
    const content = readFileSync(file, 'utf8');
    const links = extractLinks(content);
    for (const l of links) {
      const target = resolve(relDir, l);
      if (!exists(target)) {
        issues.push({ file: file.replace(DOC_ROOT + '/', ''), link: l });
      }
    }
  }
  return issues;
}

function main() {
  const issues = validate();
  if (!issues.length) {
    console.log('All documentation links OK.');
    return;
  }
  console.log('Documentation link issues found:');
  for (const i of issues) {
    console.log(`- ${i.file}: ${i.link}`);
  }
  process.exit(1);
}

if (require.main === module) main();