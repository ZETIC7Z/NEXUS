const fs = require('fs');
const path = require('path');

const dirA = '/home/zeticuz/Music/nexus/src';
const dirB = '/home/zeticuz/Music/p-stream-temp/p-stream-production/src';

function getFiles(dir, baseDir = dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, baseDir));
    } else {
      results.push(path.relative(baseDir, filePath));
    }
  });
  return results;
}

const filesA = new Set(getFiles(dirA));
const filesB = new Set(getFiles(dirB));

console.log("=== FILES ONLY IN NEXUS ===");
for (const f of filesA) {
  if (!filesB.has(f)) {
    console.log(f);
  }
}

console.log("\n=== FILES ONLY IN P-STREAM ===");
for (const f of filesB) {
  if (!filesA.has(f)) {
    console.log(f);
  }
}

console.log("\n=== CHANGED FILES ===");
for (const f of filesA) {
  if (filesB.has(f)) {
    const contentA = fs.readFileSync(path.join(dirA, f));
    const contentB = fs.readFileSync(path.join(dirB, f));
    if (!contentA.equals(contentB)) {
      console.log(f, `(NEXUS size: ${contentA.length}, p-stream size: ${contentB.length})`);
    }
  }
}
