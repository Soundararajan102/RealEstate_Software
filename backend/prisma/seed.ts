import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

async function run() {
  const distPath = path.resolve(__dirname, '../dist/cli/seed-cli.js');
  const srcPath = path.resolve(__dirname, '../src/cli/seed-cli.ts');

  if (fs.existsSync(distPath)) {
    // Compiled production runner mode
    const mod = await import(pathToFileURL(distPath).href);
    await mod.seedFullDatabase();
  } else {
    // Development tsx mode
    const mod = await import(pathToFileURL(srcPath).href);
    await mod.seedFullDatabase();
  }
}

run().catch((e) => {
  console.error('❌ Error during database seeding:', e);
  process.exit(1);
});
