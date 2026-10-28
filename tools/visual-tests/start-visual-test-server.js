/* eslint-disable no-underscore-dangle */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start the visual test server
const startVisualTestServer = () => {
  const serverPath = join(__dirname, 'server.js');
  console.log('Starting server from:', serverPath);

  const server = spawn('node', [serverPath], {
    stdio: 'inherit',
    shell: true,
  });

  server.on('error', (error) => {
    console.error('Failed to start server:', error);
  });

  server.on('close', (code) => {
    console.log(`Server process exited with code ${code}`);
  });

  return server;
};

// Start the server
const server = startVisualTestServer();

// Handle process termination
const cleanup = () => {
  try {
    server.kill();
  } catch (err) {
    console.error('Error while shutting down server:', err);
  }
  process.exit(0);
};

process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);
