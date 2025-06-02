// scripts/server-start.js
require('dotenv').config();
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Get timestamp for log files
const timestamp = new Date().toISOString().replace(/:/g, '-');
const outputLog = path.join(logsDir, `server-${timestamp}.log`);
const errorLog = path.join(logsDir, `server-error-${timestamp}.log`);

// Create log streams
const output = fs.createWriteStream(outputLog);
const errorOutput = fs.createWriteStream(errorLog);

console.log('Starting server with logging...');
console.log(`Output log: ${outputLog}`);
console.log(`Error log: ${errorLog}`);

// Set environment variables for debugging
process.env.DEBUG_LEVEL = process.env.DEBUG_LEVEL || 'INFO';

// Start server with nodemon
const server = exec('nodemon server.js');

// Pipe output to both console and log files
server.stdout.pipe(process.stdout);
server.stderr.pipe(process.stderr);
server.stdout.pipe(output);
server.stderr.pipe(errorOutput);

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill();
  process.exit();
});

// Log any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  errorOutput.write(`Uncaught exception: ${err.stack}\n`);
});