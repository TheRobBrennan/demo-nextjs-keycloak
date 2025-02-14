const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function createTunnel(port, name) {
    console.log(`Creating tunnel for ${name} (port ${port})...`);

    const tunnel = spawn('cloudflared', [
        'tunnel',
        '--url',
        `http://localhost:${port}`
    ], {
        stdio: ['ignore', 'pipe', 'inherit']
    });

    // Get the assigned URL
    const url = await new Promise((resolve, reject) => {
        let buffer = '';
        tunnel.stdout.on('data', (data) => {
            buffer += data.toString();
            // Look for the URL announcement box in cloudflared output
            if (buffer.includes('Your quick Tunnel has been created! Visit it at')) {
                const match = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
                if (match) {
                    const url = match[0];
                    console.log(`${name} tunnel created at: ${url}`);
                    resolve(url);
                }
            }
        });

        tunnel.on('error', (error) => {
            console.error(`Tunnel error for ${name}:`, error);
            reject(error);
        });

        tunnel.on('exit', (code) => {
            if (code !== 0) {
                console.error(`Tunnel exited with code ${code} for ${name}`);
                reject(new Error(`Tunnel exited with code ${code}`));
            }
        });

        // Timeout after 45 seconds
        setTimeout(() => {
            console.error(`Timeout waiting for ${name} tunnel URL. Buffer contents:`, buffer);
            reject(new Error(`Timeout waiting for ${name} tunnel URL`));
        }, 45000);
    });

    return { tunnel, url };
}

// Start Docker services
const docker = spawn('docker', ['compose', 'up', '-d']);

docker.on('close', async (code) => {
    if (code !== 0) {
        console.error('Docker compose failed to start');
        process.exit(1);
    }

    try {
        console.log('Starting tunnels...');
        const { url: keycloakUrl } = await createTunnel(8080, 'Keycloak');
        const { url: nextjsUrl } = await createTunnel(3000, 'NextJS');

        // Create .env.local with the actual URLs
        console.log('Creating .env.local with tunnel URLs...');
        const envContent = `KEYCLOAK_CLIENT_ID="nextjs"
KEYCLOAK_CLIENT_SECRET="WlCaSt6E2EJUcyIDkq64DhOWfzGCqk8m"
KEYCLOAK_ISSUER="${keycloakUrl}/realms/tdr"
NEXTAUTH_URL="${nextjsUrl}"
NEXTAUTH_SECRET="uCWzOXQaEtWX7XfzPrJG2Q74DtDcL828+h5N03n10fA="`;

        fs.writeFileSync('.env.local', envContent);

        // Initialize Keycloak with the dynamic URL
        console.log('Initializing Keycloak...');
        await initializeKeycloak(keycloakUrl);

        // Start Next.js development server
        console.log('Starting Next.js...');
        const nextApp = spawn('next', ['dev'], {
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_OPTIONS: '--dns-result-order=ipv4first'
            }
        });

        nextApp.on('error', (error) => {
            console.error('Failed to start Next.js:', error);
            process.exit(1);
        });
    } catch (error) {
        console.error('Failed during setup:', error);
        process.exit(1);
    }
});

// Handle script termination
process.on('SIGINT', () => {
    spawn('docker', ['compose', 'down'], { stdio: 'inherit' });
    process.exit();
}); 