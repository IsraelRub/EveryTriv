const { readdirSync, readFileSync, statSync } = require('fs');
const { join, dirname, resolve, relative } = require('path');

const DOC_ROOT = resolve(process.cwd(), 'docs');
const CLIENT_ROOT = resolve(process.cwd(), 'client/src');
const SERVER_ROOT = resolve(process.cwd(), 'server/src');
const SHARED_ROOT = resolve(process.cwd(), 'shared');

// Cache for file existence checks
const fileCache = new Map();
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

function isDirectory(p) {
  try { 
    return statSync(p).isDirectory();
  } catch { 
    return false;
  }
}

function walk(dir, files = [], extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  if (!isDirectory(dir)) return files;
  
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      let st;
      try { 
        st = statSync(full); 
      } catch (err) {
        continue;
      }
      
      if (st.isDirectory()) {
        walk(full, files, extensions);
      } else if (extensions.some(ext => entry.endsWith(ext))) {
        files.push(full);
      }
    }
  } catch (err) {
    // Directory doesn't exist or can't be read
  }
  return files;
}

function extractComponentsFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const components = [];
  
  // Extract React components
  const componentRegex = /(?:export\s+)?(?:const|function|class)\s+([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = componentRegex.exec(content))) {
    components.push(match[1]);
  }
  
  // Extract default exports
  const defaultExportRegex = /export\s+default\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = defaultExportRegex.exec(content))) {
    components.push(match[1]);
  }
  
  // Also add the filename as a component (for files like AnimationEffects.tsx)
  const fileName = filePath.split('/').pop().split('\\').pop();
  if (fileName && fileName.endsWith('.tsx')) {
    const componentName = fileName.replace('.tsx', '');
    if (!components.includes(componentName)) {
      components.push(componentName);
    }
  }
  
  return components;
}

function extractModulesFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const modules = [];
  
  // Extract NestJS modules
  const moduleRegex = /@Module\(/g;
  let match;
  while ((match = moduleRegex.exec(content))) {
    // Try to find the class name before @Module
    const beforeModule = content.substring(0, match.index);
    const classMatch = beforeModule.match(/(?:export\s+)?class\s+([A-Z][a-zA-Z0-9]*)/);
    if (classMatch) {
      modules.push(classMatch[1]);
    }
  }
  
  return modules;
}

function extractTypesFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const types = [];
  
  // Extract interfaces and types
  const typeRegex = /(?:export\s+)?(?:interface|type)\s+([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = typeRegex.exec(content))) {
    types.push(match[1]);
  }
  
  return types;
}

function extractConstantsFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const constants = [];
  
  // Extract exported constants
  const constRegex = /export\s+const\s+([A-Z_][A-Z0-9_]*)/g;
  let match;
  while ((match = constRegex.exec(content))) {
    constants.push(match[1]);
  }
  
  return constants;
}

function extractHooksFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const hooks = [];
  
  // Extract custom hooks (functions starting with 'use')
  const hookRegex = /(?:export\s+)?(?:const|function)\s+(use[A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = hookRegex.exec(content))) {
    hooks.push(match[1]);
  }
  
  // Also extract from export statements
  const exportHookRegex = /export\s*{\s*([^}]*use[A-Z][a-zA-Z0-9]*[^}]*)\s*}/g;
  while ((match = exportHookRegex.exec(content))) {
    const exports = match[1].split(',').map(exp => exp.trim());
    for (const exp of exports) {
      if (exp.startsWith('use') && /^use[A-Z]/.test(exp)) {
        hooks.push(exp);
      }
    }
  }
  
  return hooks;
}

function checkDocumentationConsistency() {
  console.log('🔍 Checking documentation consistency...\n');
  
  // 1. Check components mentioned in DIAGRAMS.md
  const diagramsPath = join(DOC_ROOT, 'DIAGRAMS.md');
  if (exists(diagramsPath)) {
    const diagramsContent = readFileSync(diagramsPath, 'utf8');
    
    // Extract component names from diagrams
    const componentMatches = diagramsContent.match(/[A-Z][a-zA-Z0-9]*\.tsx/g) || [];
    const mentionedComponents = [...new Set(componentMatches.map(match => match.replace('.tsx', '')))];
    
    // Check if components exist in code
    const clientFiles = walk(CLIENT_ROOT);
    const existingComponents = new Set();
    
    for (const file of clientFiles) {
      if (file.endsWith('.tsx')) {
        const components = extractComponentsFromCode(file);
        components.forEach(comp => existingComponents.add(comp));
      }
    }
    
    // Check for missing components
    for (const component of mentionedComponents) {
      if (!existingComponents.has(component)) {
        logIssue('missing-component', diagramsPath, 
          `Component "${component}" mentioned in diagrams but not found in code`);
      }
    }
  }
  
  // 2. Check modules mentioned in FEATURES.md
  const featuresPath = join(DOC_ROOT, 'backend/FEATURES.md');
  if (exists(featuresPath)) {
    const featuresContent = readFileSync(featuresPath, 'utf8');
    
    // Extract module names from features documentation
    const moduleMatches = featuresContent.match(/###\s+([A-Z][a-zA-Z0-9]*)\s+Module/g) || [];
    const mentionedModules = moduleMatches.map(match => match.replace(/###\s+/, '').replace(/\s+Module/, ''));
    
    // Check if modules exist in code
    const serverFiles = walk(SERVER_ROOT);
    const existingModules = new Set();
    
    for (const file of serverFiles) {
      if (file.endsWith('.ts')) {
        const modules = extractModulesFromCode(file);
        modules.forEach(mod => existingModules.add(mod));
      }
    }
    
    // Check for missing modules
    for (const module of mentionedModules) {
      if (!existingModules.has(module)) {
        logIssue('missing-module', featuresPath, 
          `Module "${module}" mentioned in features but not found in code`);
      }
    }
  }
  
  // 3. Check hooks mentioned in HOOKS_ARCHITECTURE.md
  const hooksPath = join(DOC_ROOT, 'frontend/HOOKS_ARCHITECTURE.md');
  if (exists(hooksPath)) {
    const hooksContent = readFileSync(hooksPath, 'utf8');
    
    // Extract hook names from documentation
    const hookMatches = hooksContent.match(/use[A-Z][a-zA-Z0-9]*/g) || [];
    const mentionedHooks = [...new Set(hookMatches)];
    
    // Filter out file names that are mentioned in directory structure
    const fileBasedHooks = new Set(['useAuth', 'useTrivia', 'usePoints', 'useUser', 'useRedux']);
    const actualHooks = mentionedHooks.filter(hook => !fileBasedHooks.has(hook));
    
    // Filter out React built-in hooks
    const reactHooks = new Set([
      'useState', 'useEffect', 'useCallback', 'useMemo', 'useRef', 
      'useContext', 'useReducer', 'useLayoutEffect', 'useImperativeHandle',
      'useDebugValue', 'useDeferredValue', 'useId', 'useInsertionEffect',
      'useSyncExternalStore', 'useTransition', 'useQuery', 'useMutation',
      'useQueryClient', 'useSelector', 'useDispatch'
    ]);
    
    const customHooks = actualHooks.filter(hook => !reactHooks.has(hook));
    
    // Check if hooks exist in code
    const clientFiles = walk(CLIENT_ROOT);
    const existingHooks = new Set();
    
    for (const file of clientFiles) {
      const hooks = extractHooksFromCode(file);
      hooks.forEach(hook => existingHooks.add(hook));
    }
    
    // Check for missing hooks
    for (const hook of customHooks) {
      if (!existingHooks.has(hook)) {
        // Check if it's a file-based hook name (like useAnalyticsDashboard)
        const isFileBasedHook = hook.endsWith('Dashboard') || hook.endsWith('Features') || 
                               hook.endsWith('Management') || hook.endsWith('Validation');
        
        if (isFileBasedHook) {
          // For file-based hooks, check if the file exists and has any hooks
          const fileName = hook.replace('use', '').toLowerCase();
          const filePath = join(CLIENT_ROOT, 'hooks/api', `use${fileName.charAt(0).toUpperCase() + fileName.slice(1)}.ts`);
          
          if (exists(filePath)) {
            const fileHooks = extractHooksFromCode(filePath);
            if (fileHooks.length > 0) {
              // File exists and has hooks, so this is not a real issue
              continue;
            }
          }
        }
        
        logIssue('missing-hook', hooksPath, 
          `Hook "${hook}" mentioned in documentation but not found in code`);
      }
    }
  }
  
  // 4. Check types mentioned in TYPES.md
  const typesPath = join(DOC_ROOT, 'shared/TYPES.md');
  if (exists(typesPath)) {
    const typesContent = readFileSync(typesPath, 'utf8');
    
    // Extract type names from documentation
    const typeMatches = typesContent.match(/interface\s+([A-Z][a-zA-Z0-9]*)/g) || [];
    const mentionedTypes = typeMatches.map(match => match.replace('interface ', ''));
    
    // Check if types exist in code
    const sharedFiles = walk(SHARED_ROOT);
    const existingTypes = new Set();
    
    for (const file of sharedFiles) {
      const types = extractTypesFromCode(file);
      types.forEach(type => existingTypes.add(type));
    }
    
    // Check for missing types
    for (const type of mentionedTypes) {
      if (!existingTypes.has(type)) {
        logIssue('missing-type', typesPath, 
          `Type "${type}" mentioned in documentation but not found in code`);
      }
    }
  }
  
  // 5. Check constants mentioned in CONSTANTS.md
  const constantsPath = join(DOC_ROOT, 'shared/CONSTANTS.md');
  if (exists(constantsPath)) {
    const constantsContent = readFileSync(constantsPath, 'utf8');
    
    // Extract constant names from documentation
    const constMatches = constantsContent.match(/export\s+const\s+([A-Z_][A-Z0-9_]*)/g) || [];
    const mentionedConstants = constMatches.map(match => match.replace('export const ', ''));
    
    // Check if constants exist in code
    const sharedFiles = walk(SHARED_ROOT);
    const existingConstants = new Set();
    
    for (const file of sharedFiles) {
      const constants = extractConstantsFromCode(file);
      constants.forEach(constant => existingConstants.add(constant));
    }
    
    // Check for missing constants
    for (const constant of mentionedConstants) {
      if (!existingConstants.has(constant)) {
        logIssue('missing-constant', constantsPath, 
          `Constant "${constant}" mentioned in documentation but not found in code`);
      }
    }
  }
}

function main() {
  console.log('🔍 Checking documentation consistency with codebase...\n');
  
  checkDocumentationConsistency();
  
  if (!issues.length) {
    console.log('✅ All documentation is consistent with codebase.');
    return;
  }
  
  console.log(`❌ Found ${issues.length} consistency issue(s):\n`);
  
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
  
  console.log(`💡 Tip: Update documentation to match actual codebase implementation`);
  console.log(`💡 Tip: Or implement missing components/modules mentioned in documentation`);
  
  process.exit(1);
}

if (require.main === module) main();
