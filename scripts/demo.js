const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const initializeKeycloak = require('./init-keycloak');
const axios = require('axios');

async function createTunnel(port, name) {
    console.log(`Creating tunnel for ${name} (port ${port})...`);

    const tunnel = spawn('cloudflared', [
        'tunnel',
        '--no-autoupdate',
        '--url',
        `http://localhost:${port}`
    ], {
        stdio: 'pipe'
    });

    // Get the assigned URL
    const url = await new Promise((resolve, reject) => {
        tunnel.stdout.on('data', (data) => {
            console.log(`${name}:`, data.toString());
        });

        tunnel.stderr.on('data', (data) => {
            const output = data.toString();
            console.log(`${name}:`, output);

            // Look for the connection URL
            const match = output.match(/(?<=\|\s+)https:\/\/[^\s]+/);
            if (match) {
                resolve(match[0]);
            }
        });

        tunnel.on('error', (error) => {
            console.error(`${name} tunnel error:`, error);
            reject(error);
        });

        tunnel.on('exit', (code) => {
            if (code !== 0) {
                reject(new Error(`${name} tunnel exited with code ${code}`));
            }
        });
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