import { existsSync } from 'node:fs';

const requiredPaths = [
  'apps/web',
  'apps/api',
  'packages/types',
  'packages/config',
  'docker-compose.yml',
  '.env.example'
];

const missing = requiredPaths.filter((path) => !existsSync(path));

if (missing.length > 0) {
  console.error('Missing required paths:', missing.join(', '));
  process.exit(1);
}

console.log('Monorepo structure check passed.');
