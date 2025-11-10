import path from 'path';
import fs from 'fs';
import { transpileTypeScript } from '../lib/utils/typescript.js';
import ts from 'typescript';

const target = process.argv[2];
if (!target) {
  console.error('Usage: node debug-transpile.mjs <path-to-ts-file>');
  process.exit(1);
}

const abs = path.resolve(target);
console.log('Transpiling', abs);
const result = await transpileTypeScript(abs, ts);
console.log('Result:', result);
console.log('Files exist:');
for (const f of result.allTempFiles) {
  console.log(' -', f, 'exists?', fs.existsSync(f));
}
