#!/usr/bin/env node
import { readFileSync } from 'fs';

const json = JSON.parse(readFileSync('.next/analyze/client.json', 'utf-8'));

function formatBytes(bytes) {
  return (bytes / 1024).toFixed(2) + ' KB';
}

function traverse(node, results = []) {
  if (node.label && node.statSize) {
    results.push({
      label: node.label,
      statSize: node.statSize,
      parsedSize: node.parsedSize,
      gzipSize: node.gzipSize,
    });
  }
  if (node.groups) {
    node.groups.forEach((child) => traverse(child, results));
  }
  return results;
}

const allModules = traverse(json[0]);
allModules.sort((a, b) => b.statSize - a.statSize);

console.log('\n📦 Bundle Analysis (Top 20)\n');
allModules.slice(0, 20).forEach((m, i) => {
  console.log(
    `${(i + 1).toString().padStart(2)}. ${m.label.substring(0, 70).padEnd(70)} ${formatBytes(m.statSize).padStart(12)} (gzip: ${formatBytes(m.gzipSize)})`,
  );
});

const total = allModules.reduce((sum, m) => sum + m.statSize, 0);
const totalGzip = allModules.reduce((sum, m) => sum + m.gzipSize, 0);

console.log(
  `\n📊 Total: ${formatBytes(total)} (gzip: ${formatBytes(totalGzip)})\n`,
);
