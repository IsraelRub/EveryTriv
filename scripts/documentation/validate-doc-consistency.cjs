/* eslint-env node */
const { readdirSync, readFileSync, statSync } = require('fs');
const { join, resolve, relative } = require('path');

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
  
  // Extract default exports (both function and const)
  const defaultExportRegex = /export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9]*)/g;
  while ((match = defaultExportRegex.exec(content))) {
    if (!components.includes(match[1])) {
      components.push(match[1]);
    }
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

function extractEnumsFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const enums = [];
  
  // Extract exported enums
  const enumRegex = /export\s+enum\s+([A-Z][a-zA-Z0-9]*)/g;
  let match;
  while ((match = enumRegex.exec(content))) {
    enums.push(match[1]);
  }
  
  return enums;
}

function extractServicesFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const services = [];
  
  // Extract service classes
  const classServiceRegex = /(?:export\s+)?class\s+([A-Z][a-zA-Z0-9]*Service)\s/g;
  let match;
  while ((match = classServiceRegex.exec(content))) {
    services.push(match[1]);
  }
  
  // Also check for exported service instances
  const serviceInstanceRegex = /export\s+const\s+(\w+)Service\s*=/g;
  while ((match = serviceInstanceRegex.exec(content))) {
    const serviceName = match[1].charAt(0).toUpperCase() + match[1].slice(1) + 'Service';
    if (!services.includes(serviceName)) {
      services.push(serviceName);
    }
  }
  
  // Also add the filename as a service (for files like api.service.ts)
  const fileName = filePath.split('/').pop().split('\\').pop();
  if (fileName && fileName.endsWith('.service.ts')) {
    const serviceName = fileName
      .replace('.service.ts', '')
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('') + 'Service';
    if (!services.includes(serviceName)) {
      services.push(serviceName);
    }
  }
  
  return services;
}

function extractViewsFromCode(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const views = [];
  
  // Extract React components (views)
  const componentRegex = /(?:export\s+default\s+function|export\s+function|export\s+const)\s+([A-Z][a-zA-Z0-9]*View)/g;
  let match;
  while ((match = componentRegex.exec(content))) {
    views.push(match[1]);
  }
  
  // Extract default exports
  const defaultExportRegex = /export\s+default\s+function\s+([A-Z][a-zA-Z0-9]*)/g;
  while ((match = defaultExportRegex.exec(content))) {
    if (match[1].endsWith('View') || match[1] === 'AdminDashboard') {
      views.push(match[1]);
    }
  }
  
  // Also add the filename as a view (for files like HomeView.tsx or views/home/HomeView.tsx)
  const fileName = filePath.split('/').pop().split('\\').pop();
  if (fileName && (fileName.endsWith('View.tsx') || fileName === 'AdminDashboard.tsx')) {
    const viewName = fileName.replace('.tsx', '');
    if (!views.includes(viewName)) {
      views.push(viewName);
    }
  }
  
  // Check for named exports that might be views
  const namedExportRegex = /export\s+function\s+([A-Z][a-zA-Z0-9]*)(?:\s*\(|\s*{)/g;
  while ((match = namedExportRegex.exec(content))) {
    if (match[1].endsWith('View') || match[1] === 'AdminDashboard') {
      if (!views.includes(match[1])) {
        views.push(match[1]);
      }
    }
  }
  
  return views;
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
                               hook.endsWith('Management') || hook.endsWith('Validation') ||
                               hook.endsWith('Preferences') || hook.endsWith('Stats');
        
        // For file-based hooks, check if the file exists and has any hooks
        // Try both hooks/ and hooks/api/ directories
        const possiblePaths = [
          join(CLIENT_ROOT, 'hooks', `${hook}.ts`),
          join(CLIENT_ROOT, 'hooks', `${hook}.tsx`),
          join(CLIENT_ROOT, 'hooks/api', `${hook}.ts`),
          join(CLIENT_ROOT, 'hooks/api', `${hook}.tsx`),
        ];
        
        let found = false;
        for (const filePath of possiblePaths) {
          if (exists(filePath)) {
            const fileHooks = extractHooksFromCode(filePath);
            if (fileHooks.length > 0) {
              // File exists and has hooks, so this is not a real issue
              found = true;
              break;
            }
          }
        }
        
        if (found) {
          continue;
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
    
    // Extract type names from documentation (both interfaces and type aliases)
    // Note: PaymentMethod is an enum in constants, not a type - skip it
    const interfaceMatches = typesContent.match(/interface\s+([A-Z][a-zA-Z0-9]*)/g) || [];
    const typeMatches = typesContent.match(/type\s+([A-Z][a-zA-Z0-9]*)\s*=/g) || [];
    const mentionedTypes = [
      ...interfaceMatches.map(match => match.replace('interface ', '')),
      ...typeMatches.map(match => match.replace(/type\s+/, '').replace(/\s*=.*/, '').trim())
    ].filter(type => type !== 'PaymentMethod'); // PaymentMethod is an enum, not a type
    
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
    
    // Extract constant names from documentation (both const and enum)
    const constMatches = constantsContent.match(/export\s+const\s+([A-Z_][A-Z0-9_]*)/g) || [];
    const enumMatches = constantsContent.match(/export\s+enum\s+([A-Z][a-zA-Z0-9]*)/g) || [];
    const mentionedConstants = [
      ...constMatches.map(match => match.replace('export const ', '')),
      ...enumMatches.map(match => match.replace('export enum ', ''))
    ];
    
    // Check if constants exist in code
    const sharedFiles = walk(SHARED_ROOT);
    const existingConstants = new Set();
    const existingEnums = new Set();
    
    for (const file of sharedFiles) {
      const constants = extractConstantsFromCode(file);
      const enums = extractEnumsFromCode(file);
      constants.forEach(constant => existingConstants.add(constant));
      enums.forEach(enumName => existingEnums.add(enumName));
    }
    
    // Check for missing constants
    for (const constant of mentionedConstants) {
      const isEnum = /^[A-Z][a-zA-Z0-9]*$/.test(constant) && !constant.includes('_');
      const existsInCode = isEnum ? existingEnums.has(constant) : existingConstants.has(constant);
      
      if (!existsInCode) {
        logIssue('missing-constant', constantsPath, 
          `${isEnum ? 'Enum' : 'Constant'} "${constant}" mentioned in documentation but not found in code`);
      }
    }
  }
  
  // 6. Check services mentioned in SERVICES.md (Client services)
  const servicesPath = join(DOC_ROOT, 'frontend/SERVICES.md');
  if (exists(servicesPath)) {
    const servicesContent = readFileSync(servicesPath, 'utf8');
    
    // Extract service names from documentation
    const serviceMatches = servicesContent.match(/([A-Z][a-zA-Z0-9]*Service)\.ts/g) || [];
    const mentionedServices = [...new Set(serviceMatches.map(match => match.replace('.ts', '')))];
    
    // Check if services exist in code
    const clientFiles = walk(CLIENT_ROOT);
    const existingServices = new Set();
    
    for (const file of clientFiles) {
      if (file.includes('/services/') && file.endsWith('.ts')) {
        const services = extractServicesFromCode(file);
        services.forEach(service => existingServices.add(service));
      }
    }
    
    // Check for missing services
    for (const service of mentionedServices) {
      if (!existingServices.has(service)) {
        logIssue('missing-service', servicesPath, 
          `Service "${service}" mentioned in documentation but not found in code`);
      }
    }
  }

  // 6b. Check shared services mentioned in SHARED_PACKAGE.md
  const sharedPackagePath = join(DOC_ROOT, 'shared/SHARED_PACKAGE.md');
  if (exists(sharedPackagePath)) {
    const sharedPackageContent = readFileSync(sharedPackagePath, 'utf8');
    
    // Extract service file names from documentation (e.g., clientLogger.service.ts)
    const serviceFileMatches = sharedPackageContent.match(/(\w+\.service\.ts)/g) || [];
    const mentionedServiceFiles = [...new Set(serviceFileMatches)];
    
    // Check if shared services exist in code
    const sharedFiles = walk(SHARED_ROOT);
    const existingServiceFiles = new Set();
    
    for (const file of sharedFiles) {
      if (file.includes('/services/') || file.includes('\\services\\')) {
        if (file.endsWith('.service.ts')) {
          const fileName = file.split('/').pop().split('\\').pop();
          if (fileName) {
            existingServiceFiles.add(fileName);
            // Also check service class names
            const services = extractServicesFromCode(file);
            services.forEach(service => {
              // Convert service class name to file name (e.g., ClientLoggerService -> clientLogger.service.ts)
              const fileNameFromClass = service
                .replace('Service', '')
                .replace(/([A-Z])/g, (match, p1, offset) => offset === 0 ? p1.toLowerCase() : match)
                .replace(/([a-z])([A-Z])/g, '$1$2') + '.service.ts';
              existingServiceFiles.add(fileNameFromClass);
            });
          }
        }
      }
    }
    
    // Check for missing shared services
    for (const serviceFile of mentionedServiceFiles) {
      if (!existingServiceFiles.has(serviceFile)) {
        logIssue('missing-service', sharedPackagePath, 
          `Shared service "${serviceFile}" mentioned in documentation but not found in code`);
      }
    }
  }
  
  // 7. Check views mentioned in VIEWS.md
  const viewsPath = join(DOC_ROOT, 'frontend/VIEWS.md');
  if (exists(viewsPath)) {
    const viewsContent = readFileSync(viewsPath, 'utf8');
    
    // Extract view names from documentation
    const viewMatches = viewsContent.match(/([A-Z][a-zA-Z0-9]*View|AdminDashboard)/g) || [];
    const mentionedViews = [...new Set(viewMatches)];
    
    // Check if views exist in code
    const clientFiles = walk(CLIENT_ROOT);
    const existingViews = new Set();
    
    for (const file of clientFiles) {
      if ((file.includes('/views/') || file.includes('\\views\\')) && file.endsWith('.tsx')) {
        const views = extractViewsFromCode(file);
        views.forEach(view => existingViews.add(view));
        
        // Also check filename directly
        const fileName = file.split('/').pop().split('\\').pop();
        if (fileName) {
          const viewName = fileName.replace('.tsx', '');
          
          // Add view name if it ends with View or is AdminDashboard
          if (fileName.endsWith('View.tsx') || fileName === 'AdminDashboard.tsx') {
            existingViews.add(viewName);
          }
          
          // Also check if component name matches view name pattern (UserProfile -> UserProfileView)
          // This handles cases where file is UserProfile.tsx but documentation mentions UserProfileView
          const content = readFileSync(file, 'utf8');
          const defaultExportMatch = content.match(/export\s+default\s+(?:function\s+)?([A-Z][a-zA-Z0-9]*)/);
          if (defaultExportMatch && defaultExportMatch[1] === viewName) {
            // Component name matches filename, add both original and View suffix version
            existingViews.add(viewName);
            existingViews.add(viewName + 'View');
          }
        }
      }
    }
    
    // Check for missing views
    for (const view of mentionedViews) {
      if (!existingViews.has(view)) {
        logIssue('missing-view', viewsPath, 
          `View "${view}" mentioned in documentation but not found in code`);
      }
    }
  }
  
  // 8. Check components mentioned in COMPONENTS.md
  const componentsPath = join(DOC_ROOT, 'frontend/COMPONENTS.md');
  if (exists(componentsPath)) {
    const componentsContent = readFileSync(componentsPath, 'utf8');
    
    // Extract component names from documentation
    const componentMatches = componentsContent.match(/([A-Z][a-zA-Z0-9]*)\.tsx/g) || [];
    const mentionedComponents = [...new Set(componentMatches.map(match => match.replace('.tsx', '')))];
    
    // Check if components exist in code
    const clientFiles = walk(CLIENT_ROOT);
    const existingComponents = new Set();
    
    for (const file of clientFiles) {
      if ((file.includes('/components/') || file.includes('\\components\\')) && file.endsWith('.tsx')) {
        const components = extractComponentsFromCode(file);
        components.forEach(comp => existingComponents.add(comp));
        
        // Also check filename directly
        const fileName = file.split('/').pop().split('\\').pop();
        if (fileName && fileName.endsWith('.tsx')) {
          const componentName = fileName.replace('.tsx', '');
          existingComponents.add(componentName);
        }
      }
    }
    
    // Check for missing components
    for (const component of mentionedComponents) {
      if (!existingComponents.has(component)) {
        logIssue('missing-component', componentsPath, 
          `Component "${component}" mentioned in documentation but not found in code`);
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
