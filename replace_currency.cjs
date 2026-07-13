const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(srcDir);

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Add import if we need it
  let needsImport = false;

  // Replace {currency}{SOMETHING.toLocaleString(...)}
  content = content.replace(/\{currency\}\{([^}]+)\.toLocaleString\([^)]*\)\}/g, (match, p1) => {
    needsImport = true;
    return `{formatCurrency(${p1})}`;
  });

  // Replace {currency}{SOMETHING} where SOMETHING is just a variable or property
  content = content.replace(/\{currency\}\{([^}]+)\}/g, (match, p1) => {
    needsImport = true;
    return `{formatCurrency(${p1})}`;
  });

  // Replace `${currency}${SOMETHING.toLocaleString(...)}`
  content = content.replace(/\$\{currency\}\$\{([^}]+)\.toLocaleString\([^)]*\)\}/g, (match, p1) => {
    needsImport = true;
    return `\${formatCurrency(${p1})}`;
  });

  // Replace `${currency}${SOMETHING}`
  content = content.replace(/\$\{currency\}\$\{([^}]+)\}/g, (match, p1) => {
    // avoid replacing if it was already formatted
    if (match.includes('formatCurrency')) return match;
    needsImport = true;
    return `\${formatCurrency(${p1})}`;
  });

  // Specifically for Recharts formatter: `${currency}${val}` -> `formatCurrency(val)`
  // Wait, in tooltips: `` `${currency}${val}` ``
  content = content.replace(/`\$\{currency\}\$\{([^}]+)\}`/g, (match, p1) => {
    needsImport = true;
    return `formatCurrency(${p1})`;
  });

  if (needsImport && !content.includes("import { formatCurrency } from '@/utils/currency'")) {
    // Add import after the last import statement or at top
    const importMatch = content.match(/import .* from .*\n/g);
    if (importMatch) {
      const lastImport = importMatch[importMatch.length - 1];
      content = content.replace(lastImport, lastImport + "import { formatCurrency } from '@/utils/currency';\n");
    } else {
      content = "import { formatCurrency } from '@/utils/currency';\n" + content;
    }
  }

  // Remove `const { currency } = useSettingsStore();` if currency is no longer used
  if (content !== originalContent) {
    if (!content.includes('currency') || (content.match(/currency/g) || []).length <= 2) {
       // Just rough cleanup. If tsc fails, we fix it.
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log('Modified:', file);
  }
});
