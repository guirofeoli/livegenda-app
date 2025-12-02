import { spawn } from 'child_process';

let apiProcess = null;

function killApiProcess() {
  if (apiProcess) {
    try {
      apiProcess.kill('SIGTERM');
      setTimeout(() => {
        if (apiProcess && !apiProcess.killed) {
          apiProcess.kill('SIGKILL');
        }
      }, 1000);
    } catch (e) {
      // Process already dead
    }
    apiProcess = null;
  }
}

export function apiServerPlugin() {
  return {
    name: 'api-server',
    configureServer(server) {
      killApiProcess();
      
      console.log('Starting API server on port 3001...');
      apiProcess = spawn('npx', ['tsx', 'server/index.ts'], {
        stdio: 'inherit',
        shell: true
      });
      
      apiProcess.on('error', (err) => {
        console.error('API server error:', err);
      });
      
      apiProcess.on('exit', (code) => {
        console.log('API server exited with code', code);
        apiProcess = null;
      });

      server.httpServer?.on('close', () => {
        killApiProcess();
      });

      process.on('SIGINT', () => {
        killApiProcess();
        process.exit(0);
      });
      
      process.on('SIGTERM', () => {
        killApiProcess();
        process.exit(0);
      });
    },
    closeBundle() {
      killApiProcess();
    }
  };
}
