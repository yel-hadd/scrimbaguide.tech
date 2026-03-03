
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AFFILIATE_CODE = '?via=u42d4986';
const TARGET_DIRS = ['../docs', '../blog', '../src/pages'];
// Avoid double tagging or tagging existing affiliate links that might be different (though we want to enforce ours)
// actually, let's just enforce ours.
const SCRIMBA_REGEX = /https:\/\/scrimba\.com[^\s)"]*/g;

// Helper to recursively get files
function getFiles(dir) {
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const files = dirents.map((dirent) => {
    const res = path.resolve(dir, dirent.name);
    return dirent.isDirectory() ? getFiles(res) : res;
  });
  return Array.prototype.concat(...files);
}

function processFile(filePath) {
  const ext = path.extname(filePath);
  if (!['.md', '.mdx', '.tsx', '.ts'].includes(ext)) return;

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  // Replace raw links
  const newContent = content.replace(SCRIMBA_REGEX, (match) => {
    // If it already contains our affiliate code, ignore
    if (match.includes('via=u42d4986')) return match;

    // If it contains another affiliate code, replace it? Or just append ours?
    // Scrimba uses ?via=...
    // If there is already a query param
    const url = new URL(match);
    
    // Check if 'via' param exists
    if (url.searchParams.has('via')) {
      if (url.searchParams.get('via') !== 'u42d4986') {
        // Replace it
        url.searchParams.set('via', 'u42d4986');
        changed = true;
        return url.toString();
      }
      return match;
    } else {
        // Append it
        url.searchParams.set('via', 'u42d4986');
        changed = true;
        return url.toString();
    }
  });

  if (newContent !== content) {
    console.log(`Updating ${path.relative(path.join(__dirname, '..'), filePath)}`);
    fs.writeFileSync(filePath, newContent, 'utf8');
  }
}

async function main() {
  console.log('Starting affiliate link injection...');
  
  for (const dir of TARGET_DIRS) {
    const fullDir = path.join(__dirname, dir);
    if (fs.existsSync(fullDir)) {
        const files = getFiles(fullDir);
        for (const file of files) {
            processFile(file);
        }
    } else {
        console.warn(`Directory not found: ${fullDir}`);
    }
  }
  
  console.log('Finished injecting affiliate links.');
}

main().catch(console.error);
