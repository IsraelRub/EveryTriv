#!/usr/bin/env node

/**
 * Console Logger Replacement Script
 * Finds and suggests replacements for console.log/warn/error statements
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Console patterns to find and replace
const consolePatterns = [
  {
    pattern: /console\.log\((.*?)\);?/g,
    replacement: 'logger.info($1);',
    logLevel: 'info'
  },
  {
    pattern: /console\.warn\((.*?)\);?/g,
    replacement: 'logger.warn($1);',
    logLevel: 'warn'
  },
  {
    pattern: /console\.error\((.*?)\);?/g,
    replacement: 'logger.error($1);',
    logLevel: 'error'
  },
  {
    pattern: /console\.debug\((.*?)\);?/g,
    replacement: 'logger.debug($1);',
    logLevel: 'debug'
  }
];

// Files to scan
const filePatterns = [
  'client/src/**/*.{ts,tsx}',
  'server/src/**/*.{ts,tsx}',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**'
];

function findConsoleStatements() {
  const results = [];
  
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(filePath => {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        consolePatterns.forEach(({ pattern, replacement, logLevel }) => {
          const matches = line.match(pattern);
          if (matches) {
            matches.forEach(match => {
              results.push({
                file: filePath,
                line: lineNumber + 1,
                original: match,
                suggested: match.replace(pattern, replacement),
                logLevel,
                context: line.trim()
              });
            });
          }
        });
      });
    });
  });
  
  return results;
}

function generateReplacementSuggestions(results) {
  console.log('🔍 Console Statement Analysis Report\n');
  console.log(`Found ${results.length} console statements to replace:\n`);
  
  // Group by log level
  const byLevel = results.reduce((acc, item) => {
    if (!acc[item.logLevel]) acc[item.logLevel] = [];
    acc[item.logLevel].push(item);
    return acc;
  }, {});
  
  Object.entries(byLevel).forEach(([level, items]) => {
    console.log(`📊 ${level.toUpperCase()} Level (${items.length} items):`);
    console.log('─'.repeat(50));
    
    items.forEach((item, index) => {
      console.log(`${index + 1}. ${item.file}:${item.line}`);
      console.log(`   Original: ${item.original}`);
      console.log(`   Suggested: ${item.suggested}`);
      console.log(`   Context: ${item.context}`);
      console.log('');
    });
  });
  
  // Generate replacement commands
  console.log('\n🛠️  REPLACEMENT COMMANDS:');
  console.log('─'.repeat(50));
  
  const byFile = results.reduce((acc, item) => {
    if (!acc[item.file]) acc[item.file] = [];
    acc[item.file].push(item);
    return acc;
  }, {});
  
  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`\n📁 ${file} (${items.length} replacements needed):`);
    
    // Check if file already imports logger
    const fullPath = path.resolve(file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const hasLoggerImport = content.includes('import logger') || content.includes('import { logger }');
    
    if (!hasLoggerImport) {
      if (file.startsWith('client/')) {
        console.log(`   ➕ Add import: import logger from './shared/services/logger.service';`);
      } else if (file.startsWith('server/')) {
        console.log(`   ➕ Add import: import { LoggerService } from './shared/modules/logger/logger.service';`);
        console.log(`   ➕ Add to constructor: private logger: LoggerService`);
      }
    }
    
    items.forEach((item, index) => {
      console.log(`   ${index + 1}. Line ${item.line}: ${item.original} → ${item.suggested}`);
    });
  });
  
  console.log('\n📈 SUMMARY:');
  console.log('─'.repeat(50));
  console.log(`Total files affected: ${Object.keys(byFile).length}`);
  console.log(`Total replacements needed: ${results.length}`);
  console.log(`Breakdown by level:`);
  Object.entries(byLevel).forEach(([level, items]) => {
    console.log(`  - ${level}: ${items.length}`);
  });
}

function generateBatchReplaceScript(results) {
  console.log('\n🚀 BATCH REPLACEMENT SCRIPT:');
  console.log('─'.repeat(50));
  console.log('#!/bin/bash');
  console.log('# Auto-generated batch replacement script for console statements\n');
  
  const byFile = results.reduce((acc, item) => {
    if (!acc[item.file]) acc[item.file] = [];
    acc[item.file].push(item);
    return acc;
  }, {});
  
  Object.entries(byFile).forEach(([file, items]) => {
    console.log(`echo "Processing ${file}..."`);
    
    items.forEach(item => {
      // Escape special characters for sed
      const escapedOriginal = item.original.replace(/[\/&]/g, '\\$&');
      const escapedReplacement = item.suggested.replace(/[\/&]/g, '\\$&');
      
      console.log(`sed -i 's/${escapedOriginal}/${escapedReplacement}/g' "${file}"`);
    });
    
    console.log('');
  });
}

// Main execution
const results = findConsoleStatements();
generateReplacementSuggestions(results);
generateBatchReplaceScript(results);

console.log('\n✅ Analysis complete! Use the commands above to replace console statements with proper logging.');
