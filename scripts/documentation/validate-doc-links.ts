import { readdirSync, readFileSync, statSync } from 'fs';
import { join, dirname, resolve } from 'path';

interface DocIssue { file: string; type: 'missing-file' | 'broken-link'; detail: string; }

const DOC_ROOT = resolve(process.cwd(), 'docs');
const VALID_EXT = new Set(['.md']);

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, files); else if (entry.endsWith('.md')) files.push(full);
  }
  return files;
}

function extractLinks(content: string): string[] {
  const mdLink = /\[[^\]]+\]\(([^)]+)\)/g; // [text](link)
  const results: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = mdLink.exec(content))) {
    const link = m[1];
    if (link.startsWith('http://') || link.startsWith('https://') || link.startsWith('#')) continue;
    if (link.includes(' ')) continue; // skip unusual
    results.push(link.split('#')[0]);
  }
  return results;
}

function validate(): DocIssue[] {
  const issues: DocIssue[] = [];
  const mdFiles = walk(DOC_ROOT);
  const existing = new Set(mdFiles.map(f => f.replace(DOC_ROOT + '\\', '').replace(DOC_ROOT + '/', '')));

  for (const file of mdFiles) {
    const relDir = dirname(file);
    const content = readFileSync(file, 'utf8');
    const links = extractLinks(content);
    for (const l of links) {
      if (l.startsWith('../')) {
        const target = resolve(relDir, l);
        if (!exists(target)) {
          issues.push({ file, type: 'missing-file', detail: l });
        }
      } else if (l.startsWith('./') || !l.startsWith('/')) {
        const target = resolve(relDir, l);
        if (!exists(target)) {
          issues.push({ file, type: 'broken-link', detail: l });
        }
      }
    }
  }
  return issues;
}

function exists(p: string): boolean {
  try { return statSync(p).isFile(); } catch { return false; }
}

function main() {
  const issues = validate();
  if (!issues.length) {
    console.log('All documentation links OK.');
    process.exit(0);
  }
  console.log('Documentation link issues found:');
  for (const i of issues) {
    console.log(`- ${i.type} in ${i.file}: ${i.detail}`);
  }
  process.exit(1);
}

if (require.main === module) {
  main();
}
