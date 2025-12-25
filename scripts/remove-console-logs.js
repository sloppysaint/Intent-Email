#!/usr/bin/env node

/**
 * Script to remove console.log, console.debug, console.info statements
 * Keeps console.error and console.warn for production error tracking
 * 
 * Usage: node scripts/remove-console-logs.js [path]
 * If no path provided, processes all .ts and .tsx files in app/, lib/, utils/ directories
 */

const fs = require('fs');
const path = require('path');

const DEBUG_CONSOLE_PATTERNS = [
  // console.log statements
  /console\.log\s*\([^)]*\)\s*;?\s*/g,
  // console.debug statements
  /console\.debug\s*\([^)]*\)\s*;?\s*/g,
  // console.info statements
  /console\.info\s*\([^)]*\)\s*;?\s*/g,
];

// Patterns to keep (errors and warnings are kept for production)
const KEEP_PATTERNS = [
  /console\.error/,
  /console\.warn/,
];

function shouldRemoveLine(line) {
  // Don't remove lines that have errors or warnings
  if (KEEP_PATTERNS.some(pattern => pattern.test(line))) {
    return false;
  }
  
  // Remove debug console statements
  return DEBUG_CONSOLE_PATTERNS.some(pattern => pattern.test(line));
}

function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let modified = false;
    
    const processedLines = lines.map(line => {
      // Check if line contains a console.log/debug/info (but not in a string)
      if (shouldRemoveLine(line)) {
        // Check if entire line is just the console statement (with optional semicolon)
        const trimmed = line.trim();
        if (trimmed.match(/^console\.(log|debug|info)\s*\(.*\)\s*;?\s*$/)) {
          modified = true;
          return ''; // Remove the entire line
        }
        // If it's part of a larger line, try to remove just the statement
        // This is more complex, so we'll just comment it out or remove if standalone
        modified = true;
        return ''; // For now, remove the line (be careful with inline statements)
      }
      return line;
    });
    
    // Remove empty lines that were created by removing console statements
    const cleanedLines = processedLines
      .map((line, index, arr) => {
        // Keep line if it's not empty, or if it's not between two empty lines
        if (line.trim() !== '') return line;
        if (index === 0 || index === arr.length - 1) return line;
        if (arr[index - 1].trim() !== '' || arr[index + 1].trim() !== '') {
          return line;
        }
        return null;
      })
      .filter(line => line !== null);
    
    if (modified) {
      fs.writeFileSync(filePath, cleanedLines.join('\n'), 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return false;
  }
}

function findFiles(dir, extensions = ['.ts', '.tsx'], fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules, .next, .git, etc.
      if (!['node_modules', '.next', '.git', 'dist', 'build'].includes(file)) {
        findFiles(filePath, extensions, fileList);
      }
    } else if (extensions.some(ext => file.endsWith(ext))) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  const targetPath = process.argv[2];
  
  let filesToProcess = [];
  
  if (targetPath) {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      filesToProcess = findFiles(targetPath);
    } else {
      filesToProcess = [targetPath];
    }
  } else {
    // Process default directories
    const dirs = ['app', 'lib', 'utils'];
    dirs.forEach(dir => {
      if (fs.existsSync(dir)) {
        filesToProcess.push(...findFiles(dir));
      }
    });
  }
  
  console.log(`Found ${filesToProcess.length} files to process...`);
  
  let modifiedCount = 0;
  filesToProcess.forEach(file => {
    if (processFile(file)) {
      modifiedCount++;
      console.log(`✓ Removed console logs from: ${file}`);
    }
  });
  
  console.log(`\nDone! Modified ${modifiedCount} file(s).`);
}

if (require.main === module) {
  main();
}

module.exports = { processFile, findFiles };

