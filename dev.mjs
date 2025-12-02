import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('Starting API server...');
const api = spawn('npx', ['tsx', 'server/index.ts'], {
  cwd: __dirname,
  stdio: 'inherit',
  shell: true
});

setTimeout(() => {
  console.log('Starting Vite...');
  const vite = spawn('npx', ['vite'], {
    cwd: __dirname,
    stdio: 'inherit',
    shell: true
  });

  vite.on('exit', (code) => {
    console.log('Vite exited with code', code);
    api.kill();
    process.exit(code);
  });
}, 2000);

process.on('SIGINT', () => {
  api.kill();
  process.exit(0);
});
