const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up previous demo...');

// Clean up existing installation
try {
    execSync('docker compose down');
    fs.rmSync(path.join(process.cwd(), 'postgres_db'), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), '.env.local'), { force: true });
    fs.rmSync(path.join(process.cwd(), 'node_modules'), { recursive: true, force: true });
    fs.rmSync(path.join(process.cwd(), 'package-lock.json'), { force: true });
} catch (error) {
    console.log('No existing installation to clean up');
}

console.log('📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

console.log('🚀 Starting demo...');
require('./demo.js'); 