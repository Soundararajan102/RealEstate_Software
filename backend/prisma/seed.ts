import { seedFullDatabase } from '../src/cli/seed-cli';

seedFullDatabase().catch((e) => {
  console.error('❌ Error during database seeding:', e);
  process.exit(1);
});
