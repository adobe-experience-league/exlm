/* eslint-disable no-underscore-dangle */
/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;
const MAX_PORT = 3010; // Maximum port number to try

// Ensure the directory for port.txt exists
const portFilePath = path.join(__dirname, 'port.txt');
const portFileDir = path.dirname(portFilePath);

// Function to check if a port is used by our visual-test server
async function isOurServer(portToCheck) {
  return new Promise((resolve) => {
    http.get(`http://localhost:${portToCheck}/api/health`, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve(response.status === 'ok');
        } catch (e) {
          resolve(false);
        }
      });
    }).on('error', () => {
      resolve(false);
    });
  });
}

// Wrap app.listen in a Promise so async EADDRINUSE errors are catchable
function listenOnPort(currentPort) {
  return new Promise((resolve, reject) => {
    const serverInstance = app.listen(currentPort, () => resolve(serverInstance));
    serverInstance.on('error', reject);
  });
}

async function startServer() {
  let currentPort = port;
  while (currentPort <= MAX_PORT) {
    // eslint-disable-next-line no-await-in-loop
    if (await isOurServer(currentPort)) {
      console.log(`Visual test server already running on port ${currentPort}`);
      process.exit(0);
    }
    try {
      // eslint-disable-next-line no-await-in-loop
      await listenOnPort(currentPort);
      try {
        if (!fs.existsSync(portFileDir)) {
          fs.mkdirSync(portFileDir, { recursive: true });
        }
        fs.writeFileSync(portFilePath, currentPort.toString(), 'utf8');
        console.log(`Port ${currentPort} written to ${portFilePath}`);
      } catch (error) {
        console.error('Error writing port file:', error);
      }
      console.log(`Visual test server running on port ${currentPort}`);
      return;
    } catch (error) {
      if (error.code === 'EADDRINUSE') {
        currentPort += 1;
      } else {
        console.error('Server failed to start:', error);
        process.exit(1);
      }
    }
  }
  console.error(`Could not find available port between ${process.env.PORT || 3001} and ${MAX_PORT}`);
  process.exit(1);
}

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from the playwright-report directory
const reportPath = path.join(__dirname, 'playwright-report');
if (fs.existsSync(reportPath)) {
  console.log('Serving Playwright report from:', reportPath);
  app.use('/playwright-report', express.static(reportPath));
} else {
  console.log('Playwright report directory not found at:', reportPath);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Port endpoint
app.get('/port.txt', (req, res) => {
  try {
    const portNumber = fs.readFileSync(portFilePath, 'utf8');
    res.setHeader('Content-Type', 'text/plain');
    res.send(portNumber);
  } catch (error) {
    console.error('Error reading port file:', error);
    res.status(500).send('Error reading port');
  }
});

// Test results summary endpoint
app.get('/api/results', (req, res) => {
  const resultsPath = path.join(__dirname, 'test-results', 'results.json');
  try {
    const raw = fs.readFileSync(resultsPath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(raw);
  } catch (error) {
    res.status(404).json({ error: 'No results available' });
  }
});

// Run visual test endpoint
app.post('/api/run-visual-test', async (req, res) => {
  const { command, component } = req.body;
  console.log('Received request:', { command, component });

  if (!component) {
    return res.status(400).json({ error: 'Missing component name' });
  }

  if (!/^[a-z0-9-]+$/.test(component)) {
    return res.status(400).json({ error: 'Invalid component name' });
  }

  // Get the project root directory (2 levels up from server.js)
  const projectRoot = path.resolve(__dirname, '../../');
  console.log('Project root:', projectRoot);

  // Construct the command to run visual tests for specific block
  // Component should match the block folder name (e.g., 'cards', 'hero', 'tabs')
  const testCommand = `npm run test:visual:block -- tools/visual-tests/blocks/${component}`;
  console.log('Executing command:', testCommand);
  console.log('In directory:', projectRoot);

  try {
    // Ensure the directory exists
    if (!fs.existsSync(projectRoot)) {
      return res.status(400).json({ error: 'Working directory does not exist' });
    }

    exec(testCommand, {
      cwd: projectRoot,
      env: {
        ...process.env,
        FORCE_COLOR: '1',
        PATH: process.env.PATH,
      },
      shell: process.platform === 'win32',
    }, (error, stdout, stderr) => {
      console.log('Command output:', stdout);
      if (stderr) console.log('Command errors:', stderr);
      console.log('Current working directory:', process.cwd());
      console.log('Command working directory:', projectRoot);
      console.log('Command:', testCommand);

      if (error) {
        console.error('Command execution error:', error);
        res.status(500).json({
          error: 'Command execution failed',
          details: error.message,
          output: stdout,
          stderr,
        });
        return;
      }

      if (stderr && stderr.toLowerCase().includes('error')) {
        res.status(500).json({
          error: 'Command completed with errors',
          output: stdout,
          stderr,
        });
        return;
      }

      res.json({
        success: true,
        output: stdout,
        stderr,
      });
    });
  } catch (error) {
    console.error('Error executing command:', error);
    res.status(500).json({
      error: 'Failed to execute command',
      details: error.message,
    });
  }
  return null;
});

// Start the server
startServer();

export default startServer;
