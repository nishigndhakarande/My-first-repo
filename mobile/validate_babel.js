const fs = require('fs');
const path = require('path');
const babelParser = require('@babel/parser');

const getAllFiles = function(dirPath, arrayOfFiles) {
  let files = fs.readdirSync(dirPath);
  arrayOfFiles = arrayOfFiles || [];
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if(file.endsWith('.js') || file.endsWith('.jsx')) {
        arrayOfFiles.push(path.join(__dirname, dirPath, "/", file));
      }
    }
  });
  return arrayOfFiles;
}

const files = getAllFiles('src');
if (fs.existsSync('App.js')) files.push(path.join(__dirname, 'App.js'));
if (fs.existsSync('index.js')) files.push(path.join(__dirname, 'index.js'));

let errors = [];

files.forEach(file => {
  try {
    const code = fs.readFileSync(file, 'utf8');
    babelParser.parse(code, {
      sourceType: 'module',
      plugins: [
        'jsx',
        'flow',
        'classProperties',
        'optionalChaining',
        'nullishCoalescingOperator'
      ]
    });
  } catch (err) {
    errors.push({ file: file, error: err.message, loc: err.loc });
  }
});

if (errors.length > 0) {
  console.log("ERRORS FOUND:");
  errors.forEach(e => {
    console.log("File: " + e.file);
    console.log("Error: " + e.error);
    if (e.loc) console.log("Location: Line " + e.loc.line + ", Column " + e.loc.column);
  });
  process.exit(1);
} else {
  console.log("No Babel syntax errors found in " + files.length + " files.");
}
