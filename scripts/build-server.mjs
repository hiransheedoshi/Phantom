import { build } from 'esbuild';

// The production server is a CommonJS bundle: the client is already compiled by
// Vite, and NODE_ENV is inlined so dist/ is served without starting Vite.
await build({
  entryPoints: ['server.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'dist/server.cjs',
  packages: 'external',
  define: { 'process.env.NODE_ENV': '"production"' },
  target: 'node20',
  logLevel: 'warning',
});

console.log('Built dist/server.cjs');
