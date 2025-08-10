#!/usr/bin/env node

/**
 * Type Duplication Analysis Script
 * Finds duplicate type definitions and suggests consolidation
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to find type definitions
const typePatterns = [
  {
    name: 'interface',
    pattern: /interface\s+(\w+)\s*{/g,
    category: 'interface'
  },
  {
    name: 'type alias',
    pattern: /type\s+(\w+)\s*=/g,
    category: 'type'
  },
  {
    name: 'enum',
    pattern: /enum\s+(\w+)\s*{/g,
    category: 'enum'
  }
];

// Key types to track for duplication
const keyTypes = [
  'TriviaQuestion',
  'TriviaAnswer', 
  'GameMode',
  'QuestionCount',
  'ApiResponse',
  'ErrorResponse',
  'UserProfile',
  'ValidationResult',
  'TriviaRequest',
  'LeaderboardEntry'
];

// Files to scan
const filePatterns = [
  'shared/**/*.{ts,tsx}',
  'client/src/**/*.{ts,tsx}',
  'server/src/**/*.{ts,tsx}',
  '!**/node_modules/**',
  '!**/dist/**',
  '!**/build/**'
];

function findTypeDefinitions() {
  const results = [];
  
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(filePath => {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        typePatterns.forEach(({ name, pattern, category }) => {
          let match;
          while ((match = pattern.exec(line)) !== null) {
            const typeName = match[1];
            
            results.push({
              file: filePath,
              line: lineNumber + 1,
              typeName,
              category,
              patternName: name,
              context: line.trim(),
              isKeyType: keyTypes.includes(typeName)
            });
          }
        });
      });
    });
  });
  
  return results;
}

function analyzeTypeDuplication(results) {
  console.log('🔍 Type Duplication Analysis Report\n');
  
  // Group by type name
  const byTypeName = results.reduce((acc, item) => {
    if (!acc[item.typeName]) acc[item.typeName] = [];
    acc[item.typeName].push(item);
    return acc;
  }, {});
  
  // Find duplicates
  const duplicates = Object.entries(byTypeName).filter(([_, items]) => items.length > 1);
  const keyTypeDuplicates = duplicates.filter(([typeName]) => keyTypes.includes(typeName));
  
  console.log(`📊 SUMMARY:`);
  console.log(`Total types found: ${results.length}`);
  console.log(`Unique types: ${Object.keys(byTypeName).length}`);
  console.log(`Duplicate types: ${duplicates.length}`);
  console.log(`Key type duplicates: ${keyTypeDuplicates.length}\n`);
  
  if (keyTypeDuplicates.length > 0) {
    console.log('🚨 CRITICAL: Key Type Duplications Found');
    console.log('─'.repeat(60));
    
    keyTypeDuplicates.forEach(([typeName, items]) => {
      console.log(`\n🔴 ${typeName} (${items.length} definitions):`);
      items.forEach((item, index) => {
        const status = item.file.includes('shared/types/core.types.ts') ? '✅ CANONICAL' : '❌ DUPLICATE';
        console.log(`   ${index + 1}. ${item.file}:${item.line} - ${status}`);
        console.log(`      ${item.context}`);
      });
      
      // Suggest action
      const canonicalFile = items.find(item => item.file.includes('shared/types/core.types.ts'));
      if (canonicalFile) {
        console.log(`\n   💡 RECOMMENDATION: Remove duplicates, keep only shared/types/core.types.ts`);
        items.filter(item => !item.file.includes('shared/types/core.types.ts')).forEach(item => {
          console.log(`      - Remove from: ${item.file}:${item.line}`);
          console.log(`      - Replace imports with: import { ${typeName} } from '../../../../shared/types/core.types'`);
        });
      } else {
        console.log(`\n   ⚠️  WARNING: No canonical definition in shared/types/core.types.ts found!`);
        console.log(`      - Move one definition to shared/types/core.types.ts`);
        console.log(`      - Update all other files to import from shared`);
      }
    });
  }
  
  if (duplicates.length > keyTypeDuplicates.length) {
    console.log('\n\n📋 Other Duplicate Types:');
    console.log('─'.repeat(50));
    
    duplicates.filter(([typeName]) => !keyTypes.includes(typeName)).forEach(([typeName, items]) => {
      console.log(`\n${typeName} (${items.length} definitions):`);
      items.forEach(item => {
        console.log(`   - ${item.file}:${item.line}`);
      });
    });
  }
}

function findDeprecatedImports() {
  console.log('\n\n🗑️  DEPRECATED IMPORT ANALYSIS:');
  console.log('─'.repeat(50));
  
  const deprecatedPatterns = [
    {
      pattern: /import.*from.*['"`].*\/api\.types['"`]/g,
      issue: 'Importing from deprecated api.types.ts',
      solution: 'Replace with import from shared/types/core.types.ts'
    },
    {
      pattern: /import.*from.*['"`]\.\.\/\.\.\/\.\.\/\.\.\/shared\/types\/api\.types['"`]/g,
      issue: 'Importing from deprecated api.types.ts (relative path)',
      solution: 'Replace with shared/types/core.types.ts'
    }
  ];
  
  const deprecatedImports = [];
  
  filePatterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    
    files.forEach(filePath => {
      const fullPath = path.resolve(filePath);
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, lineNumber) => {
        deprecatedPatterns.forEach(({ pattern, issue, solution }) => {
          if (pattern.test(line)) {
            deprecatedImports.push({
              file: filePath,
              line: lineNumber + 1,
              content: line.trim(),
              issue,
              solution
            });
          }
        });
      });
    });
  });
  
  if (deprecatedImports.length > 0) {
    console.log(`Found ${deprecatedImports.length} deprecated imports:\n`);
    
    deprecatedImports.forEach((item, index) => {
      console.log(`${index + 1}. ${item.file}:${item.line}`);
      console.log(`   ❌ ${item.content}`);
      console.log(`   💡 ${item.solution}\n`);
    });
  } else {
    console.log('✅ No deprecated imports found!');
  }
}

function generateCleanupPlan(results) {
  console.log('\n\n🛠️  TYPE CLEANUP PLAN:');
  console.log('─'.repeat(50));
  
  const plan = [
    {
      phase: 'Phase 1: Establish Single Source of Truth',
      tasks: [
        '1. Ensure all key types are defined in shared/types/core.types.ts',
        '2. Remove duplicate definitions from other files',
        '3. Update imports to use shared types'
      ]
    },
    {
      phase: 'Phase 2: Remove Deprecated Files',
      tasks: [
        '1. Replace all imports from shared/types/api.types.ts',
        '2. Update client/src/shared/types/api.types.ts to re-export from core.types.ts',
        '3. Eventually remove deprecated api.types.ts'
      ]
    },
    {
      phase: 'Phase 3: Consolidate Client Types',
      tasks: [
        '1. Review client/src/shared/types/game.types.ts',
        '2. Move shared types to shared/types/core.types.ts',
        '3. Keep only client-specific types in client files'
      ]
    },
    {
      phase: 'Phase 4: Server Type Cleanup',
      tasks: [
        '1. Update server/src/shared/types/*.ts to import from shared',
        '2. Remove duplicate type definitions',
        '3. Keep only server-specific extensions'
      ]
    }
  ];
  
  plan.forEach(({ phase, tasks }) => {
    console.log(`\n${phase}:`);
    tasks.forEach(task => {
      console.log(`   ${task}`);
    });
  });
  
  console.log('\n📋 PRIORITY ACTIONS:');
  console.log('─'.repeat(30));
  console.log('1. 🔥 HIGH: Fix deprecated api.types.ts imports');
  console.log('2. 🔥 HIGH: Remove TriviaQuestion/GameMode duplicates');
  console.log('3. 🟡 MED:  Consolidate client type files');
  console.log('4. 🟢 LOW:  Clean up server type extensions');
}

// Main execution
console.log('🚀 Starting Type Duplication Analysis...\n');

const typeResults = findTypeDefinitions();
analyzeTypeDuplication(typeResults);
findDeprecatedImports();
generateCleanupPlan(typeResults);

console.log('\n✅ Type analysis complete!');
